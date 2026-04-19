'use client'

import React, { useState, useEffect } from 'react'
import { Bell, Menu, X, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NotificationBell } from '@/components/ui/notification-bell'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { NavContent, adminMenuItems, operatorMenuItems } from './Sidebar'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { logout } from '@/lib/actions/auth'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Settings, User as UserIcon } from 'lucide-react'

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

  // Determine settings link based on role
  const getSettingsLink = () => {
    switch (profile?.role) {
      case 'admin': return '/admin/settings/profile';
      case 'operator': return '/operator/settings/profile';
      case 'client': return '/dashboard/settings';
      default: return '#';
    }
  };

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

  const menuItems = profile?.role === 'admin'
    ? adminMenuItems()
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
        {/* Search Toggle (Visual Premium Only for now) */}
        <Button variant="ghost" size="icon" className="hidden md:flex text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-all">
          <Search className="h-5 w-5" />
        </Button>

        {/* Notification Bell */}
        <NotificationBell />

        {/* Profile Avatar with Dropdown */}
        {profile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-2 pl-2 md:pl-3 border-l border-slate-200 cursor-pointer hover:opacity-80 transition-all group">
                <div className="hidden md:block text-right">
                  <p className="text-xs font-bold text-slate-700 group-hover:text-emerald-600 transition-colors">{profile.full_name}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-medium">{profile.role}</p>
                </div>
                <div className="h-8 w-8 md:h-9 md:w-9 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xs md:text-sm shadow-md ring-2 ring-transparent group-hover:ring-emerald-100 transition-all">
                  {(profile.full_name || 'U').charAt(0)}
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-slate-200">
              <DropdownMenuLabel className="px-3 py-2">
                <p className="text-xs font-black text-slate-900 uppercase truncate">{profile.full_name}</p>
                <p className="text-[10px] text-slate-500 truncate lowercase">{profile.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-2 bg-slate-100" />
              
              <Link href={getSettingsLink()}>
                <DropdownMenuItem className="rounded-xl cursor-pointer font-bold text-xs py-2.5 px-3">
                  <Settings className="h-4 w-4 mr-2 text-slate-400" />
                  Pengaturan Profil
                </DropdownMenuItem>
              </Link>

              <DropdownMenuSeparator className="my-2 bg-slate-100" />
              
              <DropdownMenuItem 
                className="rounded-xl cursor-pointer font-bold text-xs py-2.5 px-3 text-red-600 focus:text-red-600 focus:bg-red-50"
                onClick={async () => {
                  await logout();
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Keluar Aplikasi
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
