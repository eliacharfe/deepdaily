// apps/web/app/layout.tsx

import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import AppShell from "@/components/app-shell";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "DeepDaily",
  description: "Learn any topic deeply, one day at a time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Toaster richColors position="top-center" />

        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
