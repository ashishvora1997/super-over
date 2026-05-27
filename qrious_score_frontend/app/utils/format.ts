export function formatRole(role: string) {
  if (!role) return "—";

  return role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function toTitleCase(text: string | undefined) {
  if (!text) return "—";

  return text.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

const BATTING_STYLE_LABELS: Record<string, string> = {
  RHB: "Right Hand Bat",
  LHB: "Left Hand Bat",
};

const BOWLING_STYLE_LABELS: Record<string, string> = {
  RAF: "Right Arm Fast",
  LAF: "Left Arm Fast",
  OFF: "Right Arm Off Spin",
  LAO: "Left Arm Orthodox",
  LEG: "Right Arm Leg Spin",
};

export function formatBattingStyle(code: string | undefined) {
  if (!code) return "—";
  return BATTING_STYLE_LABELS[code] || code;
}

export function formatBowlingStyle(code: string | undefined) {
  if (!code) return "—";
  return BOWLING_STYLE_LABELS[code] || code;
}

export function formatDate(date: string | Date | undefined) {
  if (!date) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  } catch (e) {
    return date.toString();
  }
}
