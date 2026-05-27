import { LucideIcon } from "lucide-react";

export type ColorVariant = "blue" | "violet" | "amber" | "green";

export interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  variant: ColorVariant;
  pulse?: boolean;
}

export interface ActionButtonProps {
  icon: LucideIcon;
  label: string;
  variant: ColorVariant;
}

export type MatchStatus = "live" | "completed" | "upcoming";

export interface MatchRowProps {
  home: string;
  away: string;
  homeScore: string;
  awayScore: string;
  overs: string;
  status: MatchStatus;
  result: string;
}
