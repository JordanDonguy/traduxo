// eslint-disable-next-line @typescript-eslint/no-unused-vars
import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    systemLang?: string;
    refreshToken?: string;
  }

  interface Session {
    user: {
      id: string;
      email?: string | null;
      providers?: string[];
      systemLang: string | null;
    };
  }

  interface JWT {
    sub?: string;
    systemLang?: string;
    refreshToken?: string;
  }
}
