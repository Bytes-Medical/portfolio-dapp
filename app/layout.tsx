import type { Metadata, Viewport } from "next";
import { Courier_Prime, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const courierPrime = Courier_Prime({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-courier",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "byte portfolio",
  description:
    "Capture a clinical learning moment in a minute. Byte Portfolio maps it to RCPCH Progress+ and drafts the entry. Nothing identifiable leaves your device.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // cover = let content extend under the notch/home indicator so the
  // env(safe-area-inset-*) values resolve; the chrome pads itself back in.
  viewportFit: "cover",
  themeColor: "#FBFAF7",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${courierPrime.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
