'use client'

import React, { useState } from 'react'
import { Bell, Check, CheckCheck, Trash2, Inbox } from 'lucide-react'
import { Button } from './button'
import { Badge } from './badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from './popover'
import { ScrollArea } from './scroll-area'
import { useNotifications } from '@/hooks/use-notifications'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'
import { cn } from '@/lib/utils'

export function NotificationBell() {
  const { notifications, stats, loading, markAsRead, markAllAsRead, deleteNotification, fetchNotifications } = useNotifications()
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      sampling_completed: <Inbox className="h-4 w-4 text-emerald-600" />,
      analysis_ready: <Inbox className="h-4 w-4 text-blue-600" />,
      analysis_completed: <Check className="h-4 w-4 text-blue-600" />,
      reporting_completed: <Check className="h-4 w-4 text-purple-600" />,
      invoice_generated: <Bell className="h-4 w-4 text-amber-600" />,
      invoice_sent: <Bell className="h-4 w-4 text-amber-600" />,
      payment_received: <Check className="h-4 w-4 text-emerald-600" />,
      job_assigned: <Bell className="h-4 w-4 text-blue-600" />,
      approval_requested: <Bell className="h-4 w-4 text-orange-600" />,
      approval_decided: <Check className="h-4 w-4 text-slate-600" />
    }
    return icons[type] || <Bell className="h-4 w-4 text-slate-600" />
  }

  const getNotificationColor = (type: string) => {
    const colors: Record<string, string> = {
      sampling_completed: 'bg-emerald-50 border-emerald-200',
      analysis_ready: 'bg-blue-50 border-blue-200',
      analysis_completed: 'bg-blue-50 border-blue-200',
      reporting_completed: 'bg-purple-50 border-purple-200',
      invoice_generated: 'bg-amber-50 border-amber-200',
      invoice_sent: 'bg-amber-50 border-amber-200',
      payment_received: 'bg-emerald-50 border-emerald-200',
      job_assigned: 'bg-blue-50 border-blue-200',
      approval_requested: 'bg-orange-50 border-orange-200',
      approval_decided: 'bg-slate-50 border-slate-200'
    }
    return colors[type] || 'bg-slate-50 border-slate-200'
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 cursor-pointer"
        >
          <Bell className="h-5 w-5" />
          {stats.unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs font-bold flex items-center justify-center"
            >
              {stats.unreadCount > 9 ? '9+' : stats.unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-bold text-sm uppercase tracking-wide">Notifikasi</h4>
          <div className="flex items-center gap-1">
            {stats.unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-8 text-xs cursor-pointer"
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1" />
                Semua
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); fetchNotifications(); }}
              className="h-8 cursor-pointer"
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-slate-100 rounded-lg" />
                ))}
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Inbox className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Tidak ada notifikasi</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 hover:bg-slate-50 transition-colors cursor-pointer border-l-4",
                    notification.is_read ? "bg-white border-transparent" : "bg-white border-emerald-500",
                    getNotificationColor(notification.type)
                  )}
                  onClick={async () => {
                    if (!notification.is_read) {
                      await markAsRead(notification.id)
                    }
                    if (notification.link) {
                      router.push(notification.link)
                      setOpen(false)
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          "text-sm font-semibold truncate",
                          !notification.is_read && "text-emerald-900"
                        )}>
                          {notification.title}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteNotification(notification.id)
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-slate-400" />
                        </Button>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-2">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: id
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t bg-slate-50 text-center">
            <p className="text-xs text-slate-500">
              {stats.unreadCount} belum dibaca dari {stats.totalCount} total
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
