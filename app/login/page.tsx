"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase, hasSupabaseConfig } from "@/lib/supabase";
import { isValidSouthAfricanId } from "@/lib/sa-id";
import WhatsAppSupport from "@/components/WhatsAppSupport";
import { ArrowLeft, Phone, ShieldCheck, LockKeyhole, CreditCard } from "lucide-react";

function LoginForm() {
  const params = useSearchParams();
  const [role, setRole] = useState(params.get("role") === "driver" ? "driver" : "customer");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [phone, setPhone] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    if (!hasSupabaseConfig()) {
      setMessage("Authentication is not connected. Add your Supabase project URL and anon key first.");
      return;
    }
    const normalizedPhone = phone.trim().replace(/[\s()-]/g, "");
    if (!/^\+?[0-9]{9,15}$/.test(normalizedPhone)) {
      setMessage("Enter a valid mobile number, including country code where needed.");
      return;
    }
    if (!isValidSouthAfricanId(idNumber)) {
      setMessage("Enter a valid 13-digit South African ID number with a correct date and check digit.");
      return;
    }
    if (password.length < 8) {
      setMessage("Your password must contain at least 8 characters.");
      return;
    }
    setBusy(true);
    if (mode === "register") {
      const { data, error } = await supabase.auth.signUp({
        phone: normalizedPhone,
        password,
        options: { data: { role, id_number: idNumber } }
      });
      if (error) {
        setMessage(error.message);
      } else if (data.user && data.session) {
        // The database trigger creates the profile from verified auth metadata.
        window.location.href = role === "driver" ? "/driver" : "/customer";
      } else {
        setMessage("Account created. To use password-only sign-in without SMS codes, disable phone confirmation in Supabase Auth settings before launch, then sign in with your phone number and password.");
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ phone: normalizedPhone, password });
      if (error) {
        setMessage(error.message);
      } else if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles").select("id_number, role").eq("id", data.user.id).single();
        if (profileError || !profile || profile.id_number !== idNumber) {
          await supabase.auth.signOut();
          setMessage("The ID number does not match this account. Check your details or contact support.");
        } else {
          window.location.href = profile.role === "driver" ? "/driver" : profile.role === "admin" ? "/admin" : "/customer";
        }
      }
    }
    setBusy(false);
  }

  return <main className="auth-shell"><Link href="/" className="back"><ArrowLeft size={16}/> Back to home</Link><section className="auth-card">
    <Link href="/" className="brand"><span className="brand-mark">R</span><span>RABALATA <b>RIDES</b></span></Link>
    <div className="eyebrow">WELCOME ABOARD</div><h1>{mode === "login" ? "Welcome back." : "Create your account."}</h1><p className="muted">Use your mobile number, South African ID and password.</p>
    <div className="role-switch"><button type="button" className={role==="customer"?"selected":""} onClick={()=>setRole("customer")}>Customer</button><button type="button" className={role==="driver"?"selected":""} onClick={()=>setRole("driver")}>Driver</button></div>
    <div className="role-switch"><button type="button" className={mode==="login"?"selected":""} onClick={()=>{setMode("login");setMessage("")}}>Sign in</button><button type="button" className={mode==="register"?"selected":""} onClick={()=>{setMode("register");setMessage("")}}>Create account</button></div>
    <form onSubmit={submit} className="form">
      <label>Mobile number<div className="field"><Phone size={17}/><input type="tel" autoComplete="tel" required placeholder="+27 00 000 0000" value={phone} onChange={e=>setPhone(e.target.value)}/></div></label>
      <label>South African ID number<div className="field"><CreditCard size={17}/><input inputMode="numeric" autoComplete="off" maxLength={13} required placeholder="13-digit ID number" value={idNumber} onChange={e=>setIdNumber(e.target.value.replace(/\D/g,""))}/></div></label>
      <label>Password<div className="field"><LockKeyhole size={17}/><input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required placeholder="At least 8 characters" value={password} onChange={e=>setPassword(e.target.value)}/></div></label>
      <p className="privacy-note">Your ID number is used as an account identity check, not as a password. Use a unique password. Phone and password sign-in is used here. Configure your Supabase phone authentication settings and SMS provider according to your preferred account-verification policy.</p>
      <button className="btn full" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in securely" : "Create account"}</button>
    </form>
    {message && <p className="notice">{message}</p>}
    <p className="muted tiny">Need help? <WhatsAppSupport/></p>
  </section></main>;
}
export default function LoginPage(){ return <Suspense fallback={<div className="loading">Loading sign-in…</div>}><LoginForm/></Suspense>; }
