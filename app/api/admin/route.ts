import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-auth";

export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error || !auth.admin) return NextResponse.json({ error: auth.error }, { status: auth.user ? 403 : 401 });
  const db = auth.admin;
  const [{ data: vehicles }, { data: rides }, { data: users }, { data: settings }] = await Promise.all([
    db.from("vehicles").select("id,driver_id,make,model,colour,registration_number,year,approval_status,created_at,photo_paths").order("created_at", { ascending: false }).limit(100),
    db.from("rides").select("id,status,pickup_text,destination_text,customer_offer_cents,agreed_fare_cents,created_at").order("created_at", { ascending: false }).limit(100),
    db.from("profiles").select("id,role,phone,full_name,id_verified,selfie_path,id_document_path,created_at").eq("role", "driver").order("created_at", { ascending: false }).limit(100),
    db.from("platform_settings").select("key,value")
  ]);
  const driverDocs = await Promise.all((users || []).map(async (u) => {
    const [idDoc, selfie] = await Promise.all([
      u.id_document_path ? db.storage.from("driver-private").createSignedUrl(u.id_document_path, 300) : Promise.resolve({ data: null }),
      u.selfie_path ? db.storage.from("driver-private").createSignedUrl(u.selfie_path, 300) : Promise.resolve({ data: null })
    ]);
    return { driver_id: u.id, id_url: idDoc.data?.signedUrl || null, selfie_url: selfie.data?.signedUrl || null };
  }));
  return NextResponse.json({ vehicles: vehicles || [], rides: rides || [], users: users || [], driverDocs, settings: settings || [] });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error || !auth.admin) return NextResponse.json({ error: auth.error }, { status: auth.user ? 403 : 401 });
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  if (body.action === "vehicle" && typeof body.id === "string" && ["approved", "rejected", "suspended"].includes(body.status)) {
    const { error } = await auth.admin.from("vehicles").update({ approval_status: body.status }).eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }
  if (body.action === "driver_verification" && typeof body.id === "string" && typeof body.verified === "boolean") {
    const { error } = await auth.admin.from("profiles").update({ id_verified: body.verified }).eq("id", body.id).eq("role", "driver");
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }
  if (body.action === "site_content" && typeof body.key === "string" && ["site_announcement", "site_slogan", "support_phone"].includes(body.key) && typeof body.value === "string" && body.value.length <= 240) {
    const { error } = await auth.admin.from("platform_settings").upsert({ key: body.key, value: body.value, updated_by: auth.user!.id, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }
  if (body.action === "maintenance" && typeof body.enabled === "boolean") {
    const { error } = await auth.admin.from("platform_settings").upsert({ key: "maintenance_mode", value: body.enabled, updated_by: auth.user!.id, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unsupported admin action." }, { status: 400 });
}
