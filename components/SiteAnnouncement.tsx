"use client";
import { useEffect, useState } from "react";
export default function SiteAnnouncement(){const [message,setMessage]=useState("");useEffect(()=>{fetch("/api/site").then(r=>r.json()).then(d=>{const v=d.site_announcement;if(typeof v==="string")setMessage(v);}).catch(()=>{});},[]);if(!message)return null;return <div className="site-announcement">{message}</div>}
