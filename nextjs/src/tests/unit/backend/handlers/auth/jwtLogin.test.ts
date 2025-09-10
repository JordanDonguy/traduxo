import { NextRequest } from "next/server";
import * as tokenModule from "@/lib/server/auth/generateToken";
import { jwtLoginHandler } from "@/lib/server/handlers/auth/jwtLogin";
import * as authModule from "@/lib/server/auth/authorizeUser";

describe("jwtLoginHandler", () => {
  // ------ Test 1️⃣ ------
  it("fails if missing credentials", async () => {
    const req = { json: async () => ({}) } as unknown as NextRequest;
    const res = await jwtLoginHandler(req, {});
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe("Missing credentials");
  });

  // ------ Test 2️⃣ ------
  it("fails if authorizeUser returns null", async () => {
    jest.spyOn(authModule, "authorizeUser").mockResolvedValue(null);

    const req = { json: async () => ({ email: "a@b.com", password: "123" }) } as unknown as NextRequest;
    const res = await jwtLoginHandler(req, {});
    const json = await res.json();
    expect(res.status).toBe(401);
    expect(json.error).toBe("Invalid credentials");
  });

  // ------ Test 3️⃣ ------
  it("creates tokens successfully", async () => {
    jest.spyOn(authModule, "authorizeUser").mockResolvedValue({
      id: "user1",
      email: "a@b.com",
      language: "en",
      providers: ["google"],
    });

    jest.spyOn(tokenModule, "generateToken").mockResolvedValue({
      accessToken: "jwt-token",
      refreshToken: "refresh-token",
      expiresIn: 3600,
    });

    const req = { json: async () => ({ email: "a@b.com", password: "123" }) } as unknown as NextRequest;
    const res = await jwtLoginHandler(req, {});
    const json = await res.json();

    expect(json).toEqual({
      accessToken: "jwt-token",
      refreshToken: "refresh-token",
      expiresIn: 3600,
    });

    // Ensure generateToken was called with correct user info
    expect(tokenModule.generateToken).toHaveBeenCalledWith(expect.objectContaining({
      userId: "user1",
      email: "a@b.com",
      language: "en",
      providers: ["google"],
    }));
  });

  // ------ Test 4️⃣ ------
  it("uses default dependencies when none are provided", async () => {
    jest.spyOn(authModule, "authorizeUser").mockResolvedValue({
      id: "user2",
      email: "default@user.com",
      language: "fr",
      providers: [],
    });

    jest.spyOn(tokenModule, "generateToken").mockResolvedValue({
      accessToken: "jwt-token-2",
      refreshToken: "refresh-token-2",
      expiresIn: 3600,
    });

    const req = { json: async () => ({ email: "default@user.com", password: "123" }) } as unknown as NextRequest;
    const res = await jwtLoginHandler(req, {});
    const json = await res.json();

    expect(json).toEqual({
      accessToken: "jwt-token-2",
      refreshToken: "refresh-token-2",
      expiresIn: 3600,
    });
  });

  // ------ Test 5️⃣ ------
  it("returns 500 if an unexpected error occurs", async () => {
    // Mock authorizeUser to throw
    jest.spyOn(authModule, "authorizeUser").mockImplementation(() => {
      throw new Error("Unexpected failure");
    });

    const req = { json: async () => ({ email: "a@b.com", password: "123" }) } as unknown as NextRequest;
    const res = await jwtLoginHandler(req, {});
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });
});
