import { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: Props) {
  const base =
    "px-4 py-2.5 rounded-xl text-sm font-medium transition active:scale-[0.98] disabled:opacity-70";

  const variants = {
    primary: "bg-primary text-white hover:bg-primary-dark",
    secondary:
      "bg-background text-foreground border border-border hover:bg-border",
    danger: "bg-destructive text-white hover:opacity-90",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
