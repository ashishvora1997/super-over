export const canManagePlayers = (role: string) => {
  return role === "scorer" || role === "admin";
};

export const isAdmin = (role: string) => {
  return role === "admin";
};
