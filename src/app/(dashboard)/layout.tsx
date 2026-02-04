"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/sms", label: "SMS", icon: "💬" },
  { href: "/calls", label: "Appels", icon: "📞" },
  { href: "/ussd", label: "USSD", icon: "#️⃣" },
  { href: "/contacts", label: "Contacts", icon: "👥" },
  { href: "/settings", label: "Paramètres", icon: "⚙️" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50 z-40 flex items-center px-4">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors text-slate-300"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        <h1 className="ml-3 text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          SMS Gateway
        </h1>
      </header>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Desktop & Mobile */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-slate-900/95 to-slate-950/95 backdrop-blur-xl border-r border-slate-800/50 z-50 transform transition-transform duration-300 lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-center h-16 border-b border-slate-800/50 mt-16 lg:mt-0">
          <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
            SMS Gateway
          </h1>
        </div>
        <nav className="mt-6 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-4 py-3 mb-1 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-white shadow-lg shadow-blue-500/20 border border-blue-500/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800/50">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>v1.0.0</span>
            <span className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              En ligne
            </span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 p-4 lg:p-8 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation (Alternative) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/50 z-30">
        <div className="flex justify-around items-center h-16">
          {navItems.slice(0, 5).map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                  isActive ? "text-cyan-400" : "text-slate-400"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-[10px] mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
