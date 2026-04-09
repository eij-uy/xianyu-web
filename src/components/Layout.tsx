'use client';

import { Package2, BarChart3, Menu, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import AIChat from './AIChat';

const navItems = [
  { href: '/inventory', label: '仓管中心', icon: Package2 },
  { href: '/xianyu', label: '闲鱼数据', icon: BarChart3 },
];

function MouseFollower() {
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    let animationId: number;
    const animate = () => {
      setPosition(prev => ({
        x: prev.x + (mouseRef.current.x - prev.x) * 0.1,
        y: prev.y + (mouseRef.current.y - prev.y) * 0.1,
      }));
      animationId = requestAnimationFrame(animate);
    };
    animate();
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, []);
  
  return (
    <div
      className="fixed w-96 h-96 rounded-full pointer-events-none z-0"
      style={{
        left: position.x - 192,
        top: position.y - 192,
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
        filter: 'blur(40px)',
        transition: 'none',
      }}
    />
  );
}

function BackgroundEffects() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-violet-50/50 via-transparent to-purple-50/50" />
      <div className="absolute top-20 left-0 w-96 h-96 bg-violet-200/30 rounded-full blur-3xl -translate-x-1/2" />
      <div className="absolute bottom-20 right-0 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl translate-x-1/2" />
      <div className="absolute top-1/3 left-10 w-64 h-64 bg-indigo-200/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-10 w-56 h-56 bg-pink-200/20 rounded-full blur-3xl" />
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <MouseFollower />
      <BackgroundEffects />
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-md">
        <div className="max-w-full mx-auto">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Package2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-slate-800 text-base sm:text-xl">
                一禾 · 二手机供应链批发平台
              </span>
            </div>

            <div className="hidden md:flex items-center gap-2">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-violet-100 text-violet-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </a>
              ))}
            </div>

            <button
              className="md:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? (
                <X className="w-5 h-5 text-slate-600" />
              ) : (
                <Menu className="w-5 h-5 text-slate-600" />
              )}
            </button>
          </div>

          {mobileOpen && (
            <div className="md:hidden border-t border-slate-200/60 px-4 pb-4">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-violet-100 text-violet-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </nav>

      <main className="pt-16 pb-8 px-4 sm:px-6 max-w-full mx-auto relative">
        {children}
      </main>
      <AIChat />
    </div>
  );
}