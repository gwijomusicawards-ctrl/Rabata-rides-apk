import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path.startsWith("/api/") || path.startsWith("/admin") || path.startsWith("/login") || path.startsWith("/maintenance") || path.startsWith("/_next") || path === "/favicon.ico") return NextResponse.next();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return NextResponse.next();
  try {
    const response = await fetch(`${url}/rest/v1/platform_settings?key=eq.maintenance_mode&select=value`, {
      headers: { apikey: anon, Authorization: `Bearer ${anon}` },
      cache: "no-store"
    });
    if (response.ok) {
      const rows = await response.json();
      if (rows?.[0]?.value === true || rows?.[0]?.value === "true") return NextResponse.rewrite(new URL("/maintenance", request.url));
    }
  } catch { /* Keep the public app available if settings lookup is temporarily unavailable. */ }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!.*\\.).*)"] };
