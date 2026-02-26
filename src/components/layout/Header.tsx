'use client'

import React, { useState, useEffect } from 'react'
import { Bell, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NotificationBell } from '@/components/ui/notification-bell'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { NavContent, adminMenuItems, operatorMenuItems } from './Sidebar'
import { usePathname } from 'next/navigation'
import { logout } from '@/lib/actions/auth'
import { getPendingApprovalCount } from '@/lib/actions/approval'

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
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [companyName, setCompanyName] = useState("WahfaLab");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState(0);

  // Determine if we should show hamburger menu based on role
  const showHamburger = profile?.role === 'admin' || profile?.role === 'operator';

  useEffect(() => {
    async function fetchCompanyProfile() {
      try {
        const response = await fetch('/api/company-profile');
        const data = await response.json();
        if (data) {
          setCompanyName(data.company_name || "WahfaLab");
          setLogoUrl(data.logo_url);
        }
      } catch (error) {
        console.error('Error fetching company profile:', error);
      }
    }
    fetchCompanyProfile();
  }, []);

  useEffect(() => {
    async function fetchPendingApprovals() {
      if (profile?.role === 'admin') {
        try {
          const count = await getPendingApprovalCount();
          setPendingApprovals(count);
        } catch (error) {
          console.error('Error fetching pending approvals:', error);
        }
      }
    }
    if (showHamburger) {
      fetchPendingApprovals();
    }
  }, [profile?.role, showHamburger]);

  const menuItems = profile?.role === 'admin'
    ? adminMenuItems(pendingApprovals)
    : profile?.role === 'operator'
      ? operatorMenuItems
      : [];

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-white/80 backdrop-blur-md px-4 md:px-6 shadow-sm">
      {/* Left: Hamburger (Mobile Admin/Operator) & Title */}
      <div className="flex items-center gap-3">
        {showHamburger && (
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-emerald-900 hover:bg-emerald-50">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 bg-emerald-950 border-none">
              <SheetTitle className="sr-only">Menu Navigasi</SheetTitle>
              <NavContent 
                isCollapsed={false}
                menuItems={menuItems}
                pathname={pathname}
                companyName={companyName}
                logoUrl={logoUrl}
                logout={logout}
                onItemClick={() => setIsOpen(false)}
              />
            </SheetContent>
          </Sheet>
        )}

        <div className="flex flex-col">
          {title && (
            <h1 className="text-sm md:text-lg font-bold text-emerald-900 uppercase tracking-wide truncate max-w-[150px] md:max-w-none">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="hidden md:block text-xs text-slate-500 font-medium">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Notification Bell */}
        <NotificationBell />

        {/* Profile Avatar */}
        {profile && (
          <div className="flex items-center gap-2 pl-2 md:pl-3 border-l border-slate-200">
            <div className="hidden md:block text-right">
              <p className="text-xs font-bold text-slate-700">{profile.full_name}</p>
              <p className="text-[10px] text-slate-500 uppercase font-medium">{profile.role}</p>
            </div>
            <div className="h-8 w-8 md:h-9 md:w-9 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xs md:text-sm shadow-md">
              {(profile.full_name || 'U').charAt(0)}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
