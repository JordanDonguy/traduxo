import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { NextAuthOptions } from "next-auth";
import { prisma } from "../prisma";
import { authorizeUser } from "./authorizeUser";
import { authEnvSchema } from "../../shared/schemas";
import { handleGoogleSignIn } from "./handleGoogleSignIn";

type EnvVars = {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  JWT_SECRET: string;
};

const parsedEnv = authEnvSchema.parse(process.env);

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

        // Called when user tries to login with credentials
        authorize: async(credentials) => {
          return await authorizeUser(credentials);
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
          if (!result.success) {
            throw new Error(result.reason);
          }
        }
        return true; // Allow sign-in for other providers (e.g. credentials)
      },

      // Customize session object returned to client
      async session({ session }) {
        if (session.user?.email) {
          // Fetch the custom user ID and providers from Prisma using the email
          const data = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, providers: true },
          });

          if (data) {
            session.user.id = data.id;
            session.user.providers = data.providers;
          }
        }
        return session;
      },

      // Customize JWT token payload
      async jwt({ token, user }) {
        // On first sign-in, persist user ID in JWT token 'sub' field
        if (user) {
          token.sub = user.id;
        }
        return token;
      },

      // After Google linking, redirect to profile page with success flag
      async redirect({ url, baseUrl }) {
        // Allow absolute URLs within same origin
        if (url.startsWith(baseUrl)) {
          return url;
        }

        // Allow relative URLs
        if (url.startsWith("/")) {
          return `${baseUrl}${url}`;
        }

        // Otherwise fallback to base
        return baseUrl;
      },
    },

    // Use JWT for session management (instead of database sessions)
    session: { strategy: "jwt" },

    // JWT secret from env for signing tokens
    jwt: { secret: env.JWT_SECRET },

    // Custom sign-in page route
    pages: {
      error: "/",
    },
  };
}

const authOptions = createAuthOptions();
export default authOptions;
