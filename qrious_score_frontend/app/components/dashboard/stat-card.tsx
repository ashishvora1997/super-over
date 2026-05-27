"use client";

import { LucideIcon, TrendingUp, Minus } from "lucide-react";

export interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  trend?: string;
  trendUp?: boolean | null;
  icon: LucideIcon;
  loading?: boolean;
  accentColor?: string;
  iconColor?: string;
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-border rounded-2xl p-4 flex flex-col gap-3 animate-pulse">
      <div className="w-11 h-11 rounded-xl bg-gray-100" />
      <div className="space-y-2">
        <div className="h-8 w-20 bg-gray-100 rounded-lg" />
        <div className="h-3 w-28 bg-gray-50 rounded-lg" />
      </div>
      <div className="h-3 w-24 bg-gray-50 rounded-lg" />
    </div>
  );
}

export function StatCard({
  value,
  subtitle,
  trend,
  trendUp,
  icon: Icon,
  loading = false,
  accentColor = "bg-primary/10",
  iconColor = "text-primary",
}: StatCardProps) {
  if (loading) return <SkeletonCard />;

  return (
    <div className="bg-white border border-border rounded-2xl p-4 flex flex-col gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
      <div
        className={`w-11 h-11 rounded-xl ${accentColor} flex items-center justify-center`}
      >
        <Icon size={18} className={iconColor} />
      </div>

      <div>
        <p className="text-[1.6rem] font-bold text-foreground leading-none tracking-tight">
          {value}
        </p>
        <p className="text-xs text-muted mt-1">{subtitle}</p>
      </div>

      {trend && (
        <div
          className={`flex items-center gap-1 text-xs font-medium ${
            trendUp === true
              ? "text-accent"
              : trendUp === false
                ? "text-destructive"
                : "text-muted"
          }`}
        >
          {trendUp === null ? (
            <Minus size={12} />
          ) : (
            <TrendingUp
              size={12}
              className={trendUp === false ? "rotate-180" : ""}
            />
          )}
          {trend}
        </div>
      )}
    </div>
  );
}
