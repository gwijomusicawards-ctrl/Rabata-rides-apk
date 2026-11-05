import Link from "next/link";
import { CarFront, MapPin, ShieldCheck, Wallet, ArrowRight, Clock3, Users } from "lucide-react";
import SiteAnnouncement from "@/components/SiteAnnouncement";
import SiteSlogan from "@/components/SiteSlogan";

export default function Home() {
  return (
    <main>
      <nav className="nav wrap">
        <Link href="/" className="brand"><span className="brand-mark">R</span><span>RABALATA <b>RIDES</b></span></Link>
        <div className="nav-links"><a href="#how">How it works</a><a href="#drivers">Drive with us</a><Link className="btn btn-small" href="/login">Sign in <ArrowRight size={15}/></Link></div>
      </nav>
      <SiteAnnouncement/><section className="hero wrap">
        <div className="hero-copy">
          <div className="eyebrow"><span className="pulse"/> PRIVATE SHUTTLE BOOKINGS</div>
          <h1>Your journey.<br/><em>Your choice.</em><br/>Your ride.</h1>
          <p className="lead">Book a private shuttle, agree on a fair fare and follow your driver’s journey in real time.</p>
          <div className="actions"><Link className="btn" href="/login">Book a ride <ArrowRight size={17}/></Link><Link className="btn btn-outline" href="/login?role=driver">Become a driver</Link></div>
          <div className="trust"><span><ShieldCheck size={17}/> Driver approval process</span><span><MapPin size={17}/> Live trip tracking</span></div>
        </div>
        <div className="hero-art">
          <div className="art-glow"/>
          <div className="route-line"><i/><i/><i/></div>
          <div className="car-card"><div className="car-top"><span>RABALATA FLEET</span><span className="live">● READY FOR THE ROAD</span></div>
            <div className="car-visual"><CarFront size={190} strokeWidth={1.1}/></div>
            <div className="car-bottom"><div><small>YOUR RIDE, YOUR WAY</small><strong>Private shuttle service</strong></div><span className="gold-chip">R</span></div>
          </div>
          <div className="floating-tag tag-one"><MapPin size={16}/><span><b>Track your ride</b><small>Live driver location</small></span></div>
          <div className="floating-tag tag-two"><Wallet size={17}/><span><b>Agree your fare</b><small>Negotiable pricing</small></span></div>
        </div>
      </section>
      <section className="stats wrap"><div><strong>01</strong><span>Request a ride</span></div><div><strong>02</strong><span>Agree on your price</span></div><div><strong>03</strong><span>Track your driver</span></div><div><strong>04</strong><span>Arrive with confidence</span></div></section>
      <section className="section wrap" id="how"><div className="section-head"><div className="eyebrow">A BETTER WAY TO TRAVEL</div><h2>Every trip, made simpler.</h2></div>
        <div className="feature-grid">
          <article className="feature"><MapPin/><h3>Live trip map</h3><p>Once a driver accepts, both sides can follow the same trip map and see the latest shared location.</p></article>
          <article className="feature"><Wallet/><h3>Negotiable fares</h3><p>Request a price, receive driver offers and confirm the fare that works for both of you.</p></article>
          <article className="feature"><ShieldCheck/><h3>Driver verification</h3><p>Driver ID, selfie and vehicle documents are submitted for administrator review before activation.</p></article>
          <article className="feature"><Clock3/><h3>Clear trip status</h3><p>Follow each stage from requested and accepted to pickup, in progress and completed.</p></article>
        </div>
      </section>
      <section className="driver-band wrap" id="drivers"><div><div className="eyebrow">FOR PROFESSIONAL DRIVERS</div><h2>Turn your vehicle into an opportunity.</h2><p>Register your details and vehicle, submit documents for review and manage approved trips from your driver dashboard.</p></div><Link className="btn" href="/login?role=driver">Register as a driver <ArrowRight size={17}/></Link></section>
      <footer className="footer wrap"><Link href="/" className="brand"><span className="brand-mark">R</span><span>RABALATA <b>RIDES</b></span></Link><span><SiteSlogan/></span><span>© 2026 Otsile Graphics</span></footer>
    </main>
  );
}
