"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
function ReturnContent(){const params=useSearchParams();const [message,setMessage]=useState("Checking payment with the payment provider…");useEffect(()=>{const reference=params.get("reference");if(!reference){setMessage("Payment reference is missing.");return;}fetch(`/api/payments/verify?reference=${encodeURIComponent(reference)}`,{cache:"no-store"}).then(r=>r.json()).then(d=>setMessage(d.message||"Payment status could not be confirmed.")).catch(()=>setMessage("Could not verify payment. Please contact support."));},[params]);return <main className="auth-shell"><section className="auth-card"><div className="brand"><span className="brand-mark">R</span><span>RABALATA <b>RIDES</b></span></div><div className="eyebrow">PAYMENT UPDATE</div><h1>Card payment</h1><p className="notice">{message}</p><Link className="btn full" href="/customer">Return to customer dashboard</Link></section></main>}
export default function PaymentReturn(){return <Suspense fallback={<div className="loading">Checking payment…</div>}><ReturnContent/></Suspense>}
