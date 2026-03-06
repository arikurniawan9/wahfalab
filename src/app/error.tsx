'use client'

import React, { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ChemicalLoader } from '@/components/ui/chemical-loader'
import { WifiOff, RefreshCcw, AlertTriangle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const isPrismaError = error.message?.includes('DATABASE_CONNECTION_ERROR') || 
                        error.message?.includes('Prisma') || 
                        error.message?.includes('database') || 
                        error.message?.includes("Can't reach database");

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('System Error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
        
        {/* Loader Visual */}
        <div className="relative h-48 flex items-center justify-center">
          <div className="absolute inset-0 bg-emerald-100/50 rounded-full blur-3xl animate-pulse" />
          <ChemicalLoader />
        </div>

        <div className="space-y-4 relative z-10">
          <div className="flex items-center justify-center gap-2 text-rose-600 mb-2">
            {isPrismaError ? <WifiOff className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">System Connection Error</span>
          </div>
          
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {isPrismaError ? 'Koneksi Terputus' : 'Terjadi Kesalahan'}
          </h1>
          
          <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">
            {isPrismaError 
              ? 'Sistem tidak dapat terhubung ke server database WahfaLab. Mohon periksa koneksi internet Anda atau coba beberapa saat lagi.' 
              : 'Mohon maaf, terjadi kesalahan sistem yang tidak terduga. Tim teknis kami sedang memperbaikinya.'}
          </p>

          <div className="pt-6 flex flex-col gap-3">
            <Button 
              onClick={() => {
                reset();
                window.location.reload();
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-14 rounded-2xl shadow-lg shadow-emerald-200 w-full uppercase tracking-widest text-xs"
            >
              <RefreshCcw className="mr-2 h-4 w-4" /> Coba Hubungkan Kembali
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={() => window.location.href = '/'}
              className="text-slate-400 hover:text-slate-600 text-[10px] font-black uppercase tracking-widest"
            >
              Kembali ke Beranda
            </Button>
          </div>
        </div>

        {/* Technical Info (Collapsible or subtle) */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">
            Error Code: {isPrismaError ? 'DB_INIT_FAILED' : 'RUNTIME_ERROR'} <br/>
            Ref: {error.digest || 'wahfa-system-err'}
          </p>
        </div>
      </div>
    </div>
  )
}
