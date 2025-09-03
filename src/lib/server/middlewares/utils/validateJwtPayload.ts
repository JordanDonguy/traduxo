export interface JWTPayload {
  sub?: string | null;
  email?: string | null;
}

export function validateJWTPayload(payload: JWTPayload) {
  if (!payload.sub || !payload.email) return null;
  return { id: payload.sub, email: payload.email };
}
