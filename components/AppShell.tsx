"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    const timer = window.setTimeout(() => setLoading(false), 5000);
    return () => window.clearTimeout(timer);
  }, [pathname]);
  return <>
    {children}
    {loading && <div className="splash-screen" role="status" aria-label="Loading Rabalata Rides">
      <div className="splash-logo">R</div><div className="splash-name">RABALATA <b>RIDES</b></div>
      <div className="splash-tagline">YOUR JOURNEY. YOUR CHOICE. YOUR RIDE.</div>
      <div className="splash-track"><span /></div>
      <small>Getting your ride ready</small>
      <footer>DEVELOPED BY OTSILE GRAPHICS © 2026</footer>
    </div>}
  </>;
}
