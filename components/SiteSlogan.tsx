"use client";
import { useEffect, useState } from "react";
export default function SiteSlogan(){const [slogan,setSlogan]=useState("Your Journey. Your Choice. Your Ride.");useEffect(()=>{fetch("/api/site").then(r=>r.json()).then(d=>{if(typeof d.site_slogan==="string"&&d.site_slogan.trim())setSlogan(d.site_slogan);}).catch(()=>{});},[]);return <>{slogan}</>}
