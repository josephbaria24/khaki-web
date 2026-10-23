"use client";

import { Geist } from "next/font/google";
import PageErrorFallback from "@/components/PageErrorFallback";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

/** next-themes stores the choice under "theme". Apply it before paint so the fallback matches the app. */
const themeBoot = `(function(){try{var t=localStorage.getItem("theme");var d=t==="dark"||((!t||t==="system")&&window.matchMedia("(prefers-color-scheme: dark)").matches);var e=document.documentElement;if(d)e.classList.add("dark");e.style.colorScheme=d?"dark":"light";}catch(err){}})();`;

export default function GlobalError({ error, reset }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body className={`${geistSans.variable} ${geistSans.className} font-sans antialiased`}>
        <PageErrorFallback error={error} onRetry={reset} />
      </body>
    </html>
  );
}
