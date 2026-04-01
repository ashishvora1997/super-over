export function formatRole(role: string) {
  if (!role) return "—";

  return role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function toTitleCase(text: string) {
  if (!text) return "—";

  return text.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
