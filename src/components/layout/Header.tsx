'use client'

import React from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { NotificationBell } from '@/components/ui/notification-bell'
import { createClient } from '@/lib/supabase/client'
import { useNotifications } from '@/hooks/use-notifications'

interface HeaderProps {
  title?: string
  subtitle?: string
  profile?: {
    full_name: string | null
    email: string | null
    role: string
  }
}

export function Header({ title, subtitle, profile }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-white/80 backdrop-blur-md px-6 shadow-sm">
      {/* Left: Title */}
      <div className="flex flex-col">
        {title && (
          <h1 className="text-lg font-bold text-emerald-900 uppercase tracking-wide">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="text-xs text-slate-500 font-medium">
            {subtitle}
          </p>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <NotificationBell />

        {/* Profile Avatar */}
        {profile && (
          <div className="flex items-center gap-2 pl-3 border-l">
            <div className="hidden md:block text-right">
              <p className="text-xs font-bold text-slate-700">{profile.full_name}</p>
              <p className="text-[10px] text-slate-500 uppercase font-medium">{profile.role}</p>
            </div>
            <div className="h-9 w-9 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
              {(profile.full_name || 'U').charAt(0)}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
