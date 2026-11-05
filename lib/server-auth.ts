import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

export function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Server database credentials are not configured.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function authenticatedUser(request: NextRequest) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;
  const admin = serviceClient();
  const { data, error } = await admin.auth.getUser(token);
  return error || !data.user ? null : data.user;
}

export async function requireAdmin(request: NextRequest) {
  const user = await authenticatedUser(request);
  if (!user) return { user: null, admin: null, error: "Sign in is required." };
  const admin = serviceClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { user, admin: null, error: "Administrator access is required." };
  return { user, admin, error: null };
}
