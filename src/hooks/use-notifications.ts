'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
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
  const [page, setPage] = useState(1)
  const limit = 20

  const supabase = createClient()

  // Fetch notifications
  const fetchNotifications = useCallback(async (unreadOnly = false) => {
    try {
      const response = await fetch(`/api/notifications?page=${page}&limit=${limit}&unreadOnly=${unreadOnly}`)
      const data = await response.json()

      if (data.error) {
        console.error('Error fetching notifications:', data.error)
        return
      }

      setNotifications(data.items || [])
      setStats({
        unreadCount: data.unreadCount || 0,
        totalCount: data.total || 0,
        readCount: (data.total || 0) - (data.unreadCount || 0)
      })
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [page])

  // Fetch stats only
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications', { method: 'OPTIONS' })
      const data = await response.json()

      if (!data.error) {
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }, [])

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAsRead', notificationId })
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        )
        fetchStats()
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }, [fetchStats])

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllAsRead' })
      })

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        setStats(prev => ({ ...prev, unreadCount: 0 }))
        toast.success('Semua notifikasi ditandai sebagai dibaca')
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }, [])

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        fetchStats()
        toast.success('Notifikasi dihapus')
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }, [fetchStats])

  // Setup realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications'
      }, (payload) => {
        const newNotification = payload.new as Notification

        // Add to notifications list
        setNotifications(prev => [newNotification, ...prev])

        // Update stats
        setStats(prev => ({
          ...prev,
          unreadCount: prev.unreadCount + 1,
          totalCount: prev.totalCount + 1
        }))

        // Play notification sound
        playNotificationSound()

        // Show toast notification
        toast.info(newNotification.title, {
          description: newNotification.message,
          action: newNotification.link ? {
            label: 'Buka',
            onClick: () => window.location.href = newNotification.link!
          } : undefined
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  // Initial load
  useEffect(() => {
    fetchNotifications()
    fetchStats()
  }, [fetchNotifications, fetchStats])

  return {
    notifications,
    stats,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications,
    refreshStats: fetchStats
  }
}

// Play notification sound
function playNotificationSound() {
  try {
    const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU')
    audio.volume = 0.2
    audio.play().catch(() => {}) // Silent fail if autoplay blocked
  } catch (error) {
    // Ignore sound errors
  }
}
