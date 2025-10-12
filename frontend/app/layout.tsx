// app/layout.tsx - FINAL VERSION (WITH ALL FIXES)

import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/context/Authcontext";

// 1. Import the font from next/font/google
import { Cinzel } from "next/font/google";

// 2. Configure the font
const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-serif", // This connects it to your CSS variable
});

export const metadata: Metadata = {
  title: "The Hunter's Task List",
  description: "A task manager forged in the dark streets of Yharnam.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* 3. Apply the font class and the min-height class to the body */}
      <body className={`${cinzel.variable} min-h-screen`}>
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
