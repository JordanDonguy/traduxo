import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getToken } from "@traduxo/packages/utils/auth/token";

export type Auth = {
  status: "authenticated" | "unauthenticated" | "loading";
  token?: string;
  language?: string;
  providers?: string[];
};

export interface AuthContextType extends Auth {
  refresh: () => Promise<void>;
}

// No default value; we'll ensure useAuth is called inside a provider
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [auth, setAuth] = useState<Auth>({ status: "loading" });

  const refresh = useCallback(async () => {
    const tokenData = await getToken();
    setAuth({
      status: tokenData?.token ? "authenticated" : "unauthenticated",
      token: tokenData?.token,
      language: tokenData?.language,
      providers: tokenData?.providers,
    });
  }, []);

  // initialize on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ ...auth, refresh }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
