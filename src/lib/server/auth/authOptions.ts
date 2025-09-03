import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { NextAuthOptions } from "next-auth";
import { prisma } from "../prisma";
import { authorizeUser } from "./authorizeUser";
import { authEnvSchema } from "@/lib/shared/schemas/auth/authEnv.schemas";
import { handleGoogleSignIn } from "./handleGoogleSignIn";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { User, Session } from "next-auth";

type EnvVars = {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  JWT_SECRET: string;
};

const parsedEnv = authEnvSchema.parse(process.env);

interface UserWithRefreshToken extends User {
  refreshToken?: string;
}

export function createAuthOptions(env: EnvVars = parsedEnv): NextAuthOptions {
  return {
    // Configure authentication providers
    providers: [
      // Credentials provider for email/password login
      CredentialsProvider({
        id: "credentials",
        name: "credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },

        authorize: async (credentials) => {
          const user = await authorizeUser(credentials);
          if (!user) return null;

          // Generate refresh token
          const refreshToken = crypto.randomBytes(64).toString("hex");
          const hashedToken = await bcrypt.hash(refreshToken, 10);

          // Set expiration (e.g., 30 days)
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 30);

          await prisma.refreshToken.create({
            data: { token: hashedToken, userId: user.id, expiresAt },
          });

          // Return user + refreshToken so it can be added to JWT
          return { ...user, refreshToken };
        }
      }),

      // Google OAuth provider configuration
      GoogleProvider({
        clientId: env.GOOGLE_CLIENT_ID!,
        clientSecret: env.GOOGLE_CLIENT_SECRET!,
      }),
    ],

    callbacks: {
      // Called after sign-in, before session creation
      async signIn({ user, account }) {
        // Ensure the sign-in request includes provider/account info; otherwise, reject the sign-in
        if (!account) return false;
        // Google sign in method here
        if (account.provider === "google") {
          const result = await handleGoogleSignIn(user.email!);

          // Redirect to Google linking page if logging with Google on a credentials only account
          if (!result.success && result.reason === "NeedGoogleLinking") {
            return "/link-google";
          }

          // Else throw error if another error happens
          if (!result.success) {
            throw new Error(result.reason);
          }

          // Generate a refresh token for mobile clients
          const refreshToken = crypto.randomBytes(64).toString("hex");
          const hashedToken = await bcrypt.hash(refreshToken, 10);
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 30);

          await prisma.refreshToken.create({
            data: { token: hashedToken, userId: result.userId, expiresAt },
          });

          // Attach refresh token to user object so JWT callback can include it
          const userWithToken = user as UserWithRefreshToken;
          userWithToken.refreshToken = refreshToken;
        }
        return true; // Allow sign-in for other providers (e.g. credentials)
      },

      // Customize session object returned to client
      async session({ session }) {
        // Ensure session.user always exists
        session.user = session.user || {} as Partial<Session["user"]>;

        if (session.user.email) {
          const data = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, providers: true, systemLang: true },
          });

          if (data) {
            session.user.id = data.id;
            session.user.providers = data.providers;
            session.user.systemLang = data.systemLang;
          }
        }
        return session;
      },

      // Customize JWT token payload
      async jwt({ token, user }) {
        if (user) {
          token.sub = user.id;
          // Cast user to include refreshToken
          const u = user as UserWithRefreshToken;
          if (u.refreshToken) token.refreshToken = u.refreshToken
        }
        return token;
      },
    },

    // Use JWT for session management (instead of database sessions)
    session: { strategy: "jwt" },

    // JWT secret from env for signing tokens
    jwt: { secret: env.JWT_SECRET, maxAge: 60 * 60 },

    // Custom sign-in page route
    pages: {
      error: "/",
    },
  };
}

const authOptions = createAuthOptions();
export default authOptions;
