// tests/unit/helpers/jwtHelpers.test.ts
import { validateJWTPayload, JWTPayload } from "@/lib/server/middlewares/utils/validateJwtPayload";

describe("validateJWTPayload helper", () => {
  // ------ Test 1️⃣ ------
  it("returns null if payload missing sub", () => {
    const payload: JWTPayload = { email: "a@b.com" };
    expect(validateJWTPayload(payload)).toBeNull();
  });

  // ------ Test 2️⃣ ------
  it("returns null if payload missing email", () => {
    const payload: JWTPayload = { sub: "123" };
    expect(validateJWTPayload(payload)).toBeNull();
  });

  // ------ Test 3️⃣ ------
  it("returns user object if payload has both sub and email", () => {
    const payload: JWTPayload = { sub: "123", email: "a@b.com" };
    expect(validateJWTPayload(payload)).toEqual({ id: "123", email: "a@b.com" });
  });

  // ------ Test 4️⃣ ------
  it("returns null if both sub and email are missing", () => {
    const payload: JWTPayload = {};
    expect(validateJWTPayload(payload)).toBeNull();
  });
});
