"use client";

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: "default" | "pills" | "underline";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = "default",
  size = "md",
  className,
}: TabsProps) {
  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const variantClasses = {
    default: {
      container: "bg-gray-100/80 p-1 rounded-xl",
      tab: "px-4 py-2 rounded-lg font-medium transition-all duration-200",
      active: "bg-white text-foreground shadow-sm",
      inactive: "text-muted hover:text-foreground hover:bg-white/50",
    },
    pills: {
      container: "gap-2",
      tab: "px-4 py-2 rounded-full font-medium transition-all duration-200 border",
      active: "bg-primary text-white border-primary shadow-sm",
      inactive:
        "bg-white text-muted border-border hover:border-primary/30 hover:text-foreground",
    },
    underline: {
      container: "border-b border-border gap-6",
      tab: "pb-3 font-medium transition-all duration-200 border-b-2 -mb-px",
      active: "text-primary border-primary",
      inactive: "text-muted border-transparent hover:text-foreground",
    },
  };

  const styles = variantClasses[variant];

  return (
    <div
      className={`flex ${styles.container} ${sizeClasses[size]} ${className || ""}`}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`${styles.tab} flex items-center gap-2 ${
            activeTab === tab.id ? styles.active : styles.inactive
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

interface TabPanelProps {
  children: React.ReactNode;
  className?: string;
}

export function TabPanel({ children, className }: TabPanelProps) {
  return <div className={`pt-6 ${className || ""}`}>{children}</div>;
}
