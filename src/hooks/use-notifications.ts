'use client'

import { useState, useEffect, useCallback } from 'react'
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
  const [fetching, setFetching] = useState(false)
  const [page, setPage] = useState(1)
  const limit = 20

  // Fetch notifications
  const fetchNotifications = useCallback(async (unreadOnly = false) => {
    if (fetching) return
    
    try {
      setFetching(true)
      const response = await fetch(`/api/notifications?page=${page}&limit=${limit}&unreadOnly=${unreadOnly}`)
      
      // Handle unauthorized or forbidden silently (session expired or glitch)
      if (response.status === 401 || response.status === 403) {
        setLoading(false)
        setFetching(false)
        return
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()

      if (data.error) {
        // Only log serious errors, ignore common connection glitches in development/polling
        if (!data.error.includes('connection')) {
          console.error('Error fetching notifications:', data.error)
        }
        return
      }

      setNotifications(data.items || [])
      setStats({
        unreadCount: data.unreadCount || 0,
        totalCount: data.total || 0,
        readCount: (data.total || 0) - (data.unreadCount || 0)
      })
    } catch (error: any) {
      // Quietly handle connection errors during polling
      if (!error?.message?.includes('connection') && !error?.message?.includes('fetch')) {
        console.error('Error fetching notifications:', error)
      }
    } finally {
      setFetching(false)
      setLoading(false)
    }
  }, [page, limit, fetching])

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
        unreadCount: prev.unreadCount - 1,
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

      setNotifications(prev => prev.filter(n => n.id !== id))
      setStats(prev => ({
        ...prev,
        totalCount: prev.totalCount - 1,
        unreadCount: prev.unreadCount - (notifications.find(n => n.id === id)?.is_read ? 0 : 1)
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

  // Polling for new notifications (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications(true)
    }, 30000)

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
