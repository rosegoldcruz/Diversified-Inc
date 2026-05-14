import "../globals.css";
import type { Metadata, Viewport } from "next";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export const metadata: Metadata = {
  title: "Diversified OS",
  description: "Internal Operations Platform for Diversified Inc.",
  applicationName: "Diversified OS",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/divco-static.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: [{ url: "/divco-static.svg", type: "image/svg+xml" }],
    apple: [{ url: "/divco-static.svg", type: "image/svg+xml" }],
    other: [{ rel: "mask-icon", url: "/divco-static.svg", color: "#0b1a3a" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0b1a3a" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1a3a" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full dark">
      <body className="h-full bg-bgDark text-textPrimary antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('theme');var d=t?t==='dark':true;document.documentElement.classList.toggle('dark',d)}catch(e){document.documentElement.classList.add('dark')}",
          }}
        />
        <DashboardShell>{children}</DashboardShell>
      </body>
    </html>
  );
}
