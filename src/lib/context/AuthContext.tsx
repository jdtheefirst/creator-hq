"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
  ReactNode,
} from "react";
import {
  User as SupabaseUser,
  Session,
  AuthError,
} from "@supabase/supabase-js";
import { getSupabaseClient } from "../supabase/client";

export interface CustomUser extends SupabaseUser {
  role?: string;
  is_vip?: boolean;
}

interface AuthContextType {
  user: CustomUser | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithTwitter: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isCreator: boolean;
  supabase: ReturnType<typeof getSupabaseClient>;
  deleteFileFromSupabase: (
    fileUrl: string,
    bucketName: string
  ) => Promise<boolean>; // ✅ Also needed!
  debouncePromise: <T extends (...args: any[]) => Promise<any>>(
    fn: T,
    delay: number
  ) => (...args: Parameters<T>) => Promise<ReturnType<T>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [supabase] = useState(() => getSupabaseClient());

  const fetchUserRole = useCallback(
    async (supabaseUser: SupabaseUser) => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", supabaseUser.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching user role:", error.message);
          return;
        }

        if (data) setUser(data as CustomUser);
      } catch (err) {
        console.error("Unexpected error in fetchUserRole:", err);
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Error getting session:", error.message);
        setLoading(false);
        return;
      }

      if (mounted) {
        if (session?.user) {
          await fetchUserRole(session.user);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    }: {
      data: { subscription: { unsubscribe: () => void } };
    } = supabase.auth.onAuthStateChange((_event: string, session: Session) => {
      if (!mounted) return;

      (async () => {
        if (session?.user) {
          await fetchUserRole(session.user);
        } else {
          setUser(null);
          setLoading(false);
        }
      })(); // wrapped in IIFE
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserRole, supabase]);

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error: AuthError | null }> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithMagicLink = async (email: string): Promise<void> => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  };

  const signInWithGoogle = async (): Promise<void> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  };

  const signInWithTwitter = async (): Promise<void> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "twitter",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  };

  const signOut = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  /**
   * Deletes a file from Supabase Storage using its public URL.
   * Only works in the browser (requires cookie-based auth).
   */
  const deleteFileFromSupabase = async (
    fileUrl: string | null,
    bucketName: string | null
  ): Promise<boolean> => {
    if (!fileUrl || !bucketName) {
      console.warn("Missing URL or bucket name.");
      return false;
    }

    try {
      const prefix = "/storage/v1/object/public/";
      const [_, path] = fileUrl.split(prefix);

      if (!path) {
        console.warn("Invalid Supabase URL format:", fileUrl);
        return false;
      }

      const { error } = await supabase.storage.from(bucketName).remove([path]);

      if (error) {
        console.error("Supabase delete error:", error.message);
        return false;
      }

      console.log("Deleted from Supabase:", path);
      return true;
    } catch (err) {
      console.error("Unexpected delete error:", err);
      return false;
    }
  };

  function debouncePromise<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    delay: number
  ) {
    let timer: NodeJS.Timeout | null = null;
    let lastCall: Promise<any> | null = null;

    return (...args: Parameters<T>): Promise<ReturnType<T>> => {
      if (timer) clearTimeout(timer);
      return new Promise((resolve) => {
        timer = setTimeout(() => {
          lastCall = fn(...args).then(resolve);
        }, delay);
      });
    };
  }

  const value = useMemo<AuthContextType>(() => {
    return {
      user,
      loading,
      signIn,
      signInWithMagicLink,
      signInWithGoogle,
      signInWithTwitter,
      signUp,
      signOut,
      deleteFileFromSupabase,
      debouncePromise,
      isCreator: user?.role === "creator",
      supabase,
    };
  }, [
    user,
    loading,
    supabase,
    deleteFileFromSupabase,
    signIn,
    signInWithGoogle,
    signInWithMagicLink,
    signInWithTwitter,
    signOut,
    signUp,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
