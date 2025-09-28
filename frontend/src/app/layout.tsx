import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs'
import { AppProvider } from '@/contexts/AppContext'
import { Toaster } from '@/components/ui/sonner'
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CuraRx - Care, made clear",
  description: "Bridging the gap between healthcare providers and patients with smart prescriptions, insurance coverage, and plain-language summaries",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <AppProvider>
            {children}
            <Toaster />
          </AppProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
