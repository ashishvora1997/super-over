import { variantStyles } from "@/app/types/constants";
import { StatCardProps } from "@/app/types/dashboard.types";
import { TrendingUp } from "lucide-react";

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  variant,
  pulse = false,
}: StatCardProps) {
  const c = variantStyles[variant];

  return (
    <div className="bg-white border border-border rounded-2xl p-4 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div
          className={`w-10 h-10 ${c.iconBg} rounded-xl flex items-center justify-center`}
        >
          <Icon size={18} className={c.icon} />
        </div>

        {pulse && (
          <span className="text-xs font-semibold text-accent flex items-center gap-1">
            ● Live
          </span>
        )}
      </div>

      <div className="mt-3">
        <p className="text-xs text-muted font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-foreground mt-0.5">{value}</h3>

        <p
          className={`text-xs mt-1 flex items-center gap-1 font-medium ${c.badge}`}
        >
          <TrendingUp size={12} />
          {trend}
        </p>
      </div>
    </div>
  );
}
