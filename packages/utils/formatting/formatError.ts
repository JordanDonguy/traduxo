export function formatError(error: unknown): string {
  if (!error && error !== 0 && error !== false) {
    return "An unknown error occurred";
  }

  if (typeof error === "string") return error;

  if (Array.isArray(error)) {
    return error
      .map(e => {
        if (typeof e === "string") return e;
        if (typeof e === "number" || typeof e === "boolean") return String(e);
        return formatError(e);
      })
      .join("; ");
  }

  if (error instanceof Error) {
    return error.message || "An unexpected error occurred";
  }

  if (typeof error === "object") {
    try {
      return JSON.stringify(error);
    } catch {
      return "An error occurred (unserializable object)";
    }
  }

  return "An unknown error occurred";
}
