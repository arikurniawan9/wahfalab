'use client'

import React from 'react'
import { ChemicalLoader } from '@/components/ui/chemical-loader'
import { WifiOff, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function GlobalErrorLayout({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body className="min-h-screen bg-emerald-50/50 flex flex-col items-center justify-center p-4 text-center antialiased">
        <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
          
          {/* Loader Visual */}
          <div className="relative h-48 flex items-center justify-center scale-110">
            <div className="absolute inset-0 bg-emerald-200/50 rounded-full blur-3xl animate-pulse" />
            <ChemicalLoader />
          </div>

          <div className="space-y-6 relative z-10">
            <div className="flex flex-col items-center gap-2 text-emerald-900 mb-2">
              <div className="bg-emerald-100 p-3 rounded-full">
                <WifiOff className="h-8 w-8 text-emerald-600" />
              </div>
              <span className="text-[12px] font-black uppercase tracking-[0.4em] mt-4">WahfaLab System</span>
            </div>
            
            <h1 className="text-3xl font-black text-emerald-950 tracking-tight">
              Koneksi Ke Server Terputus
            </h1>
            
            <p className="text-emerald-800/60 text-sm font-medium leading-relaxed px-4">
              WahfaLab tidak dapat menjangkau server database. <br/>
              Ini biasanya disebabkan oleh koneksi internet yang tidak stabil.
            </p>

            <div className="pt-4 px-8">
              <Button 
                onClick={() => {
                  reset();
                  window.location.reload();
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-14 rounded-3xl shadow-xl shadow-emerald-200 w-full uppercase tracking-widest text-xs"
              >
                <RefreshCcw className="mr-2 h-4 w-4" /> Hubungkan Ulang
              </Button>
            </div>
          </div>

          {/* Minimal Footer */}
          <div className="mt-20">
            <p className="text-[10px] font-black text-emerald-900/30 uppercase tracking-[0.5em]"> WahfaLab Security Standard </p>
          </div>
        </div>
      </body>
    </html>
  )
}
