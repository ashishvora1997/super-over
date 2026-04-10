"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UsersRound,
  Trophy,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { useAuthStore } from "../store/auth.store";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "../components/auth/protected-route";

const navItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "scorer", "viewer"],
  },
  {
    name: "Players",
    href: "/players",
    icon: Users,
    roles: ["admin", "scorer", "viewer"],
  },
  {
    name: "Teams",
    href: "/teams",
    icon: UsersRound,
    roles: ["admin", "scorer", "viewer"],
  },
  {
    name: "Matches",
    href: "/matches",
    icon: Trophy,
    roles: ["admin", "scorer", "viewer"],
  },
  {
    name: "Tournaments",
    href: "/tournaments",
    icon: Trophy,
    roles: ["admin", "scorer", "viewer"],
  },
  {
    name: "Users",
    href: "/users",
    icon: Users,
    roles: ["admin"],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  const filteredNav = navItems.filter((item) =>
    item.roles.includes(user?.role || "viewer"),
  );

  return (
    <ProtectedRoute>
      <div className="h-[100dvh] flex flex-col bg-background">
        {/* ── Body: Sidebar + Main ── */}
        <div className="flex flex-1 overflow-hidden">
          {/* Desktop Sidebar */}
          <aside className="hidden md:flex w-64 bg-white border-r border-border flex-col">
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

            <nav className="flex-1 px-3 py-4 space-y-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted px-3 mb-3">
                Main Menu
              </p>
              {filteredNav.map((item) => {
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

          <main className="flex-1 overflow-y-auto bg-background p-4 md:p-8 pb-20 md:pb-8">
            {children}
          </main>
        </div>

        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-border flex justify-around items-center px-1 z-50"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 px-3 rounded-xl transition-colors flex-1 ${
                  active ? "text-primary" : "text-muted hover:text-foreground"
                }`}
              >
                <div
                  className={`p-1.5 rounded-lg transition-colors ${
                    active ? "bg-primary/10" : ""
                  }`}
                >
                  <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                </div>
                <span className="text-[10px] font-medium leading-none">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </ProtectedRoute>
  );
}
