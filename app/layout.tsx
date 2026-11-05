import type { Metadata } from "next";
import "mapbox-gl/dist/mapbox-gl.css";
import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Rabalata Rides | Your Journey. Your Choice. Your Ride.",
  description: "Private shuttle rides made simple. Book, negotiate and track your ride.",
  applicationName: "Rabalata Rides"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><AppShell>{children}</AppShell></body></html>;
}
