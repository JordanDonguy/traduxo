import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcrypt";
import { NextAuthOptions } from "next-auth";
import { prisma } from "../prisma";
import { loginSchema } from "../schemas";
import { ZodError } from "zod";
import sanitizeHtml from "sanitize-html";

const authOptions: NextAuthOptions = {
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
      async authorize(credentials) {
        try {
          // Validate input with zod
          const { email, password } = loginSchema.parse(credentials);

          // Sanitize email
          const cleanEmail = sanitizeHtml(email, { allowedTags: [], allowedAttributes: {} });

          // Throw error if email or password is missing, rejects login
          if (!credentials?.email || !credentials?.password) {
            throw new Error("NoMailOrPassword");
          }

          // Fetch user by email from Prisma
          const user = await prisma.user.findUnique({
            where: { email: cleanEmail },
          });

          // Throw error if user not found or error occurs
          if (!user) throw new Error("NoUserFound");

          // Check if user is a Google-only user (e.g. no hashed password)
          if (!user.password) {
            throw new Error("NeedToCreatePassword");
          }

          // Compare provided password with hashed password from DB
          const isValid = await bcrypt.compare(
            password,
            user.password
          );
          // Throw error if password does not match
          if (!isValid) throw new Error("PasswordIncorrect");

          // Return user object to create session
          return {
            id: user.id,
            email: user.email ?? undefined,
          };
        } catch (error) {
          if (error instanceof ZodError) {
            throw new Error("InvalidInput");
          }
          throw error;
        }
      },
    }),

    // Google OAuth provider configuration
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    // Called after sign-in, before session creation
    async signIn({ user, account }) {
      // Ensure the sign-in request includes provider/account info; otherwise, reject the sign-in
      if (!account) return false;

      if (account.provider === "google") {
        // Check if user already exists with this Google email
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        // If user does not exist, create new user with Google provider
        if (!existingUser) {
          await prisma.user.create({
            data: {
              email: user.email!,
              providers: ["Google"],
            },
          });
          return true;
        }

        // Block if account exists but user is not already signed in (to avoid hijacking)
        if (
          !existingUser.providers.includes("Google") &&
          existingUser.providers.includes("Credentials")
        ) {
          const now = new Date();
          const linkingDate = existingUser.google_linking
            ? new Date(existingUser.google_linking)
            : null;

          // If user recently initiated linking (within 60s), allow and update providers
          if (linkingDate && (now.getTime() - linkingDate.getTime()) / 1000 < 60) {
            const updatedProviders = [...existingUser.providers, "Google"];

            try {
              await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                  providers: updatedProviders,
                  google_linking: null, // Clear the flag after use
                },
              });
              return true;
            } catch (error) {
              console.error("Failed to update providers after linking:", error);
              return false;
            }
          }
          // Otherwise block Google sign-in
          throw new Error("NeedGoogleLinking");
        }

        return true; // allow Google sign-in if no problem
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
  jwt: { secret: process.env.JWT_SECRET },

  // Custom sign-in page route
  pages: {
    error: "/",
  },
};

export default authOptions;
