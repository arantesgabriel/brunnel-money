import type { Metadata, Viewport } from "next";
import "geist/font/sans";
import { Toaster } from "sonner";
import { OfflineBanner } from "@/components/feedback/offline-banner";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Brunnel Finanças", template: "%s · Brunnel" },
  description:
    "Planejamento financeiro familiar claro, seguro e compartilhado.",
  applicationName: "Brunnel Finanças",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Brunnel", statusBarStyle: "default" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#147a92",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <OfflineBanner />
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
