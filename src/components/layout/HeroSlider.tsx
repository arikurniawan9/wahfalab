"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Banner {
  image_url: string;
  title: string;
  subtitle: string;
}

interface HeroSliderProps {
  banners: Banner[];
  ctaLink?: string;
  ctaText?: string;
}

export function HeroSlider({ banners, ctaLink = "/login", ctaText = "Mulai Penawaran" }: HeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
  }, [banners.length]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 6000);
    return () => clearInterval(interval);
  }, [nextSlide, isPaused]);

  if (!banners || banners.length === 0) return null;

  return (
    <div 
      className="relative w-full h-[450px] md:h-[550px] lg:h-[650px] overflow-hidden group bg-slate-900 shadow-2xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides */}
      {banners.map((banner, index) => (
        <div
          key={index}
          className={cn(
            "absolute inset-0 transition-all duration-1000 ease-in-out transform",
            index === currentIndex 
              ? "opacity-100 scale-100 z-10" 
              : "opacity-0 scale-105 z-0"
          )}
        >
          {/* Background Image with Parallax effect simulation */}
          <div className="absolute inset-0">
            <img
              src={banner.image_url}
              alt={banner.title}
              className="w-full h-full object-cover object-center"
            />
            {/* Multi-layered Overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-emerald-950/40 to-transparent" />
            <div className="absolute inset-0 bg-black/20" />
          </div>

          {/* Content Container */}
          <div className="relative h-full container mx-auto px-6 md:px-12 flex flex-col justify-center items-start">
            <div className={cn(
              "max-w-2xl space-y-6 transition-all duration-1000 delay-300",
              index === currentIndex ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            )}>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 backdrop-blur-md px-4 py-1.5 text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] border border-emerald-500/30 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                WahfaLab Indonesia
              </div>
              
              <h2 className="text-3xl md:text-5xl lg:text-5xl font-black text-white uppercase tracking-tight leading-[1.1] drop-shadow-2xl">
                {banner.title}
              </h2>
              
              <p className="text-base md:text-lg text-emerald-50 font-medium max-w-lg leading-relaxed opacity-90 border-l-2 border-emerald-500/50 pl-6">
                {banner.subtitle}
              </p>
              
              <div className="pt-4 flex flex-col sm:flex-row gap-4">
                <Link href={ctaLink}>
                  <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 h-14 px-10 text-sm rounded-2xl font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(16,185,129,0.3)] transition-all hover:-translate-y-1 active:translate-y-0">
                    {ctaText} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/catalog">
                  <Button variant="outline" size="lg" className="h-14 px-10 text-sm rounded-2xl border-white/20 text-white bg-white/5 backdrop-blur-md hover:bg-white/10 font-black uppercase tracking-widest transition-all">
                    Katalog Layanan
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Modern Navigation Arrows */}
      <div className="absolute bottom-8 right-12 z-20 flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden md:flex">
        <button 
          onClick={prevSlide}
          className="p-4 rounded-2xl bg-white/10 backdrop-blur-xl text-white border border-white/10 hover:bg-emerald-600 transition-all hover:scale-110 active:scale-95"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button 
          onClick={nextSlide}
          className="p-4 rounded-2xl bg-white/10 backdrop-blur-xl text-white border border-white/10 hover:bg-emerald-600 transition-all hover:scale-110 active:scale-95"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Minimalist Progress Indicators */}
      <div className="absolute bottom-10 left-12 z-20 flex gap-2">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={cn(
              "h-1 transition-all duration-700 rounded-full",
              i === currentIndex ? "w-16 bg-emerald-400" : "w-4 bg-white/20 hover:bg-white/40"
            )}
          />
        ))}
      </div>
    </div>
  );
}
