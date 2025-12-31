import type { Metadata, Viewport } from "next";
import { Bai_Jamjuree } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "sonner";
import { ServiceWorkerRegister } from "./sw-register";
import { Suspense } from "react";
import { TokenHandler } from "@/components/auth/token-handler";

const baiJamjuree = Bai_Jamjuree({
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "KhataX - Mess Management System",
  description: "SaaS Mess Management System for tracking deposits and expenses",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "KhataX",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "KhataX",
  },
};

export const viewport: Viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
       className={`${baiJamjuree.className} bg-white   antialiased` } 
      >
        <Suspense fallback={null}>
          <TokenHandler />
        </Suspense>
        <QueryProvider>{children}</QueryProvider>
        <Toaster position="top-center" richColors />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
