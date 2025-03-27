"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase, User as CustomUser } from "../supabase/client";
import { isAdmin } from "@/config/admin";
import { redirect, usePathname } from "next/navigation";

interface AuthContextType {
  user: CustomUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithTwitter: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isCreator: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserRole(session.user);
      } else {
        setUser(null);
        setLoading(false);

        if (pathname.startsWith("/dashboard")) {
          redirect("/login");
        }
      }
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);
      if (session?.user) {
        await fetchUserRole(session.user);
      } else {
        setUser(null);
        setLoading(false);

        if (pathname.startsWith("/dashboard")) {
          redirect("/login");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname]);

  async function fetchUserRole(supabaseUser: User) {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", supabaseUser.id)
      .single();

    if (error) {
      console.error("Error fetching user role:", error);
      return;
    }

    setUser(data);
    setLoading(false);

    if (data.role === "creator") {
      redirect("/dashboard");
    } else {
      redirect("/");
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    try {
      // Check if there's already a session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        console.log(
          "Session already exists, redirecting based on admin status"
        );
        const redirectUrl = isAdmin(session.user.email!) ? "/dashboard" : "/";
        window.location.href = redirectUrl;
        return;
      }

      console.log("No existing session, initiating Google sign-in with PKCE");

      // Start OAuth sign-in (Supabase handles PKCE internally)
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        console.error("Google sign-in error:", error);
        throw error;
      }

      console.log("OAuth response data:", data);
    } catch (error) {
      console.error("Error in signInWithGoogle:", error);
      throw error;
    }
  };

  const signInWithTwitter = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "twitter",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    user,
    loading,
    signIn,
    signInWithMagicLink,
    signInWithGoogle,
    signInWithTwitter,
    signUp,
    signOut,
    isCreator: user?.role === "creator",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
