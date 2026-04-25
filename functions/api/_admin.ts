export const ADMIN_NAME = "doliver";

export function isAdmin(name: string): boolean {
  return name.toLowerCase() === ADMIN_NAME;
}
