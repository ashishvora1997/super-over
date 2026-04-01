"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  UsersRound,
  Trophy,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronRight,
} from "lucide-react";
import { useAuthStore } from "../store/auth.store";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "../components/auth/protected-route";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Players", href: "/players", icon: Users },
  { name: "Teams", href: "/teams", icon: UsersRound },
  { name: "Matches", href: "/matches", icon: Trophy },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  return (
    <ProtectedRoute>
      <div className="h-[100dvh] flex flex-col bg-background">
        {/* Topbar — logomark only, no text duplicate */}
        <header className="h-16 bg-white border-b border-border flex items-center justify-between px-4 md:px-6 z-10 shadow-sm">
          {/* Left: hamburger (mobile) + Q logomark */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              className="md:hidden p-2 rounded-xl text-muted hover:bg-gray-100 transition-colors"
            >
              <Menu size={20} />
            </button>

            {/* On mobile show full brand; on desktop just the mark (sidebar has full name) */}
            <div className="flex items-center gap-2 md:hidden">
              <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm shadow-primary/30">
                Q
              </div>
              <span className="text-base font-bold tracking-tight text-foreground">
                Qrious Score
              </span>
            </div>

            {/* Desktop: just the Q mark as a breadcrumb anchor */}
            <div className="hidden md:flex w-8 h-8 bg-primary rounded-xl items-center justify-center text-white font-bold text-base shadow-sm shadow-primary/30">
              Q
            </div>
          </div>

          {/* Right: notifications + avatar */}
          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-xl text-muted hover:bg-gray-100 transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full border-2 border-white" />
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-border ml-1">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-semibold text-foreground leading-tight">
                  Admin
                </span>
                <span className="text-[10px] text-muted leading-tight">
                  Super Admin
                </span>
              </div>
              <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm">
                AD
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Drawer */}
        {open && (
          <div className="fixed inset-0 z-50 flex">
            <div
              className="flex-1 bg-black/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <div className="w-72 bg-white flex flex-col shadow-2xl">
              {/* Drawer header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white font-bold shadow-sm shadow-primary/30">
                    Q
                  </div>
                  <span className="text-lg font-bold tracking-tight text-foreground">
                    Qrious Score
                  </span>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg text-muted hover:bg-gray-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="flex-1 px-4 py-4 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        active
                          ? "bg-primary text-white shadow-md shadow-primary/20"
                          : "text-muted hover:bg-gray-100 hover:text-foreground"
                      }`}
                    >
                      <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                      {item.name}
                      {active && (
                        <ChevronRight
                          size={14}
                          className="ml-auto opacity-70"
                        />
                      )}
                    </Link>
                  );
                })}
              </nav>

              <div className="px-4 py-4 border-t border-border">
                <button
                  onClick={() => {
                    logout();
                    router.push("/dashboard");
                  }}
                  className="flex items-center gap-2 text-sm text-destructive hover:text-red-600 transition-colors px-4 py-2.5 rounded-xl hover:bg-red-50 w-full"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-1 overflow-hidden">
          {/* Desktop Sidebar */}
          <aside className="hidden md:flex w-64 bg-white border-r border-border flex-col">
            {/* Brand */}
            <div className="px-6 py-6 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white font-bold shadow-sm shadow-primary/30">
                  Q
                </div>
                <div>
                  <p className="text-sm font-bold tracking-tight text-foreground">
                    Qrious Score
                  </p>
                  <p className="text-[10px] text-muted">Cricket Management</p>
                </div>
              </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted px-3 mb-3">
                Main Menu
              </p>
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                      active
                        ? "bg-primary text-white shadow-md shadow-primary/20"
                        : "text-muted hover:bg-gray-50 hover:text-foreground"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        active
                          ? "bg-white/20"
                          : "bg-gray-100 group-hover:bg-gray-200"
                      }`}
                    >
                      <Icon size={16} strokeWidth={active ? 2.5 : 2} />
                    </div>
                    {item.name}
                    {active && (
                      <ChevronRight size={14} className="ml-auto opacity-60" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="px-3 py-4 border-t border-border">
              <button
                onClick={() => {
                  logout();
                  router.push("/dashboard");
                }}
                className="flex items-center gap-3 text-sm text-muted hover:text-destructive transition-colors px-3 py-2.5 rounded-xl hover:bg-red-50 w-full group"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-red-100 flex items-center justify-center transition-colors">
                  <LogOut size={15} />
                </div>
                Logout
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto bg-background p-4 md:p-8">
            {children}
          </main>
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden h-16 bg-white border-t border-border flex justify-around items-center px-1 safe-area-pb">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-xl transition-colors ${
                  active ? "text-primary" : "text-muted hover:text-foreground"
                }`}
              >
                <div
                  className={`p-1.5 rounded-lg transition-colors ${active ? "bg-primary/10" : ""}`}
                >
                  <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                </div>
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </ProtectedRoute>
  );
}
