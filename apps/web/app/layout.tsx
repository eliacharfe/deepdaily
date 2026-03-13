//apps/web/app/layout.tsx

import type { Metadata } from "next";
import "./globals.css";
import ThemeToggle from "@/components/theme-toggle";
import { AuthProvider } from "@/components/providers/auth-provider";
import AppShell from "@/components/app-shell";

export const metadata: Metadata = {
  title: "DeepDaily",
  description: "Learn any topic deeply, one day at a time."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>

        <AuthProvider>
          <ThemeToggle />
          <AppShell>{children}</AppShell>
        </AuthProvider>

      </body>
    </html>
  );
}