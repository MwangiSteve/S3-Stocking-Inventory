

"use client";

import { createContext, useContext } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

interface AuthContextType {
  isLoggedIn: boolean;
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
  } | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status } = useSession();

  const login = async (email: string, password: string) => {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  };

  const logout = async () => {
    await signOut({ redirect: false });
  };

 const value: AuthContextType = {
  isLoggedIn: status === "authenticated",
  user: session?.user
    ? {
        id: (session.user as any).id,
        name: session.user.name ?? undefined,
        email: session.user.email ?? undefined,
      }
    : null,
  login,
  logout,
};


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
