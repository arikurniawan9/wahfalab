'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  link: string | null
  is_read: boolean
  metadata: any
  created_at: string
}

export interface NotificationStats {
  unreadCount: number
  totalCount: number
  readCount: number
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState<NotificationStats>({ unreadCount: 0, totalCount: 0, readCount: 0 })
  const [loading, setLoading] = useState(true)
  const isFetching = useRef(false) // Use ref to prevent dependency loop
  const [page, setPage] = useState(1)
  const limit = 20

  // Fetch notifications
  const fetchNotifications = useCallback(async (unreadOnly = false) => {
    if (isFetching.current) return
    
    try {
      isFetching.current = true
      const response = await fetch(`/api/notifications?page=${page}&limit=${limit}&unreadOnly=${unreadOnly}`)
      
      // Handle unauthorized or forbidden silently
      if (response.status === 401 || response.status === 403) {
        setLoading(false)
        return
      }

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      
      const data = await response.json()
      if (data.error) return

      setNotifications(data.items || [])
      setStats({
        unreadCount: data.unreadCount || 0,
        totalCount: data.total || 0,
        readCount: (data.total || 0) - (data.unreadCount || 0)
      })
    } catch (error: any) {
      // Quietly handle connection errors
    } finally {
      isFetching.current = false
      setLoading(false)
    }
  }, [page]) // Only depend on page

  // Mark as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      )
      setStats(prev => ({
        ...prev,
        unreadCount: Math.max(0, prev.unreadCount - 1),
        readCount: prev.readCount + 1
      }))
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast.error('Gagal menandai sudah dibaca')
    }
  }, [])

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      })

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setStats(prev => ({ ...prev, unreadCount: 0, readCount: prev.totalCount }))
      toast.success('Semua notifikasi ditandai sudah dibaca')
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast.error('Gagal menandai semua sudah dibaca')
    }
  }, [])

  // Delete notification
  const deleteNotification = useCallback(async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      const target = notifications.find(n => n.id === id)
      setNotifications(prev => prev.filter(n => n.id !== id))
      setStats(prev => ({
        ...prev,
        totalCount: prev.totalCount - 1,
        unreadCount: prev.unreadCount - (target?.is_read ? 0 : 1)
      }))
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error('Gagal menghapus notifikasi')
    }
  }, [notifications])

  // Initial load
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Polling for new notifications (every 60 seconds, less aggressive)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications(true)
    }, 60000)

    return () => clearInterval(interval)
  }, [fetchNotifications])

  return {
    notifications,
    stats,
    loading,
    page,
    setPage,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  }
}
