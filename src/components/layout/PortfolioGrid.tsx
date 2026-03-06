"use client";

import React, { useState, useMemo } from "react";
import { Search, ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PortfolioItem {
  name: string;
  logo_url: string;
  industry: string;
}

interface PortfolioGridProps {
  portfolio: PortfolioItem[];
  title?: string;
  description?: string;
}

export function PortfolioGrid({ portfolio, title, description }: PortfolioGridProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("Semua");

  // Ekstrak kategori unik dari portfolio
  const categories = useMemo(() => {
    const cats = new Set(portfolio.map(item => item.industry).filter(Boolean));
    return ["Semua", ...Array.from(cats)];
  }, [portfolio]);

  // Filter portfolio berdasarkan pencarian dan kategori
  const filteredPortfolio = useMemo(() => {
    return portfolio.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.industry.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === "Semua" || item.industry === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [portfolio, searchTerm, activeCategory]);

  return (
    <section id="portfolio" className="w-full py-20 md:py-32 bg-slate-50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-200 to-transparent" />
      
      <div className="container px-4 md:px-6 mx-auto relative z-10">
        <div className="flex flex-col items-center mb-16 text-center">
          <div className="inline-block rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-black text-emerald-700 uppercase tracking-widest mb-4">
            Mitra Strategis
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-emerald-900 uppercase tracking-tight font-[family-name:var(--font-montserrat)]">
            {title || "Mitra Industri Kami"}
          </h2>
          <div className="h-1.5 w-24 bg-emerald-500 rounded-full mt-4" />
          <p className="mt-6 text-slate-500 font-medium max-w-2xl text-sm leading-relaxed">
            {description || "Telah dipercaya oleh berbagai perusahaan terkemuka di Indonesia untuk memastikan standar kualitas dan kepatuhan lingkungan."}
          </p>
        </div>

        {/* Filter & Search Controls */}
        <div className="max-w-4xl mx-auto mb-12 space-y-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            <Input 
              placeholder="Cari nama industri atau kategori..." 
              className="h-14 pl-12 pr-4 rounded-2xl border-slate-200 bg-white shadow-sm focus:ring-emerald-500 focus:border-emerald-500 font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-6 py-2 rounded-full text-[10px] font-black tracking-widest transition-all border-2",
                  activeCategory === cat 
                    ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-900/20" 
                    : "bg-white border-slate-100 text-slate-400 hover:border-emerald-200 hover:text-emerald-600"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Logos */}
        {filteredPortfolio.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 md:gap-8">
            {filteredPortfolio.map((item, idx) => (
              <div 
                key={idx} 
                className="group relative flex flex-col items-center justify-center p-6 rounded-[2.5rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/30 hover:shadow-emerald-900/10 transition-all duration-500 hover:-translate-y-2 animate-in fade-in zoom-in duration-300"
              >
                <div className="aspect-square w-full flex items-center justify-center relative grayscale group-hover:grayscale-0 transition-all duration-500 p-4">
                  {item.logo_url ? (
                    <img 
                      src={item.logo_url} 
                      alt={item.name} 
                      className="max-w-full max-h-full object-contain transform group-hover:scale-110 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-50 rounded-2xl flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-slate-200" />
                    </div>
                  )}
                </div>
                <div className="mt-4 text-center">
                  <h4 className="text-[11px] font-black text-emerald-900 tracking-tight leading-tight">
                    {item.name}
                  </h4>
                  <p className="text-[9px] font-bold text-slate-400 tracking-wide mt-1">
                    {item.industry}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
            <p className="text-slate-400 font-black tracking-widest text-sm">Tidak ada mitra yang ditemukan</p>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-200 to-transparent" />
    </section>
  );
}
