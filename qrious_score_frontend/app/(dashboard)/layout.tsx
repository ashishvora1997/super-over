"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LogOut,
  ChevronRight,
  UserCircle,
  Swords,
} from "lucide-react";
import { useAuthStore } from "../store/auth.store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { logoutUser } from "../services/auth.service";
import toast from "react-hot-toast";

const navItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "My Cricket",
    href: "/my-cricket",
    icon: Swords,
  },
  {
    name: "My Profile",
    href: "/profile",
    icon: UserCircle,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((state) => state.accessToken);
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error(error);
    } finally {
      clearAuth();
      router.replace("/login");
      toast.success("Logged out successfully");
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      <div className="flex flex-1 overflow-hidden">
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

            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/");

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
                  <span className="flex-1">{item.name}</span>
                  {item.href === "/profile" &&
                    user?.is_profile_complete === false && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-medium rounded-full">
                        Complete
                      </span>
                    )}
                  {active && <ChevronRight size={14} className="opacity-60" />}
                </Link>
              );
            })}
          </nav>

          <div className="px-3 py-4 border-t border-border">
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white text-sm font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.name}
                </p>
                <p className="text-[11px] text-muted truncate">{user?.email}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 text-sm text-muted hover:text-destructive transition-colors px-3 py-2.5 rounded-xl hover:bg-red-50 w-full group"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-red-100 flex items-center justify-center transition-colors">
                <LogOut size={15} />
              </div>
              Logout
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>

      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-border flex justify-around items-center px-1 z-50"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {navItems.map((item) => {
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
  );
}
