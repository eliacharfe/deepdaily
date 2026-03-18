// apps/web/app/layout.tsx

import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import AppShell from "@/components/app-shell";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "DeepDaily",
  description: "Learn any topic deeply, one day at a time.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  try {
    const saved = localStorage.getItem('theme');
    const theme = saved ? saved : 'dark';
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  } catch (e) {}
})();
`,
          }}
        />
      </head>

      <body>
        <Toaster richColors position="top-center" />

        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}