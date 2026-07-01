import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "sweetalert2/dist/sweetalert2.min.css";
import { Navbar } from "@/components/navbar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Linux Command Quest - Belajar Command Linux dari Nol",
  description: "Platform e-learning interaktif untuk belajar command line Linux, manajemen file, dan permission secara bertahap dengan terminal simulator.",
};

import { AuthProvider } from "@/components/providers/auth-provider";
import { AuthGate } from "@/components/providers/auth-gate";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FAFAFA] text-gray-800 font-sans">
        <AuthProvider>
          <TooltipProvider>
            <Navbar />
            <AuthGate>
              <main className="flex-1 flex flex-col">
                {children}
              </main>
            </AuthGate>
            <footer className="border-t border-gray-200 bg-white py-6 mt-auto">
              <div className="container mx-auto px-4 text-center text-sm text-gray-500 font-sans">
                &copy; {new Date().getFullYear()} Linux Command Quest. Built for learning operating systems.
              </div>
            </footer>
            <Toaster position="top-right" closeButton richColors />
          </TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
