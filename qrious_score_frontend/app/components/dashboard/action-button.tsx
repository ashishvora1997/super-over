import { variantStyles } from "@/app/types/constants";
import { ActionButtonProps } from "@/app/types/dashboard.types";

export function ActionButton({
  icon: Icon,
  label,
  variant,
}: ActionButtonProps) {
  const c = variantStyles[variant];

  return (
    <button
      className={`${c.bg} rounded-xl py-3 px-4 flex flex-col items-center gap-2 transition hover:scale-[1.02]`}
    >
      <div
        className={`w-9 h-9 ${c.iconBg} rounded-lg flex items-center justify-center`}
      >
        <Icon size={16} className={c.icon} />
      </div>

      <span className="text-xs font-semibold text-foreground">{label}</span>
    </button>
  );
}
