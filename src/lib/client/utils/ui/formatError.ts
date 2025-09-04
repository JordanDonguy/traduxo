export function formatError(error: unknown): string {
  if (typeof error === "string") return error;
  if (Array.isArray(error)) return error.map(e => (typeof e === "string" ? e : JSON.stringify(e))).join("; ");
  if (error && typeof error === "object") return JSON.stringify(error);
  return "An unknown error occurred";
}
