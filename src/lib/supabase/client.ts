"use client";

import { createBrowserClient as createBrowserClientBase } from "@supabase/ssr";

let supabase: ReturnType<typeof createBrowserClientBase> | null = null;

export function getSupabaseClient() {
  if (!supabase) {
    supabase = createBrowserClientBase(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookieEncoding: "base64url",
      }
    );
  }
  return supabase;
}

export type UserRole = "creator" | "public";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}
