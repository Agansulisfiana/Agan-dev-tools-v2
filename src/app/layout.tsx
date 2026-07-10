import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agan Dev Tools — Modern Developer Toolkit",
  description:
    "A comprehensive collection of developer tools for programmers, system administrators, and IT professionals. JSON formatter, JWT decoder, hash generator, and 15+ more tools.",
  keywords: [
    "developer tools",
    "JSON formatter",
    "JWT decoder",
    "hash generator",
    "password generator",
    "UUID generator",
    "QR code",
    "regex tester",
    "base64",
    "URL encoder",
    "developer toolkit",
  ],
  authors: [{ name: "Agan Dev Tools" }],
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔧</text></svg>",
  },
  openGraph: {
    title: "Agan Dev Tools",
    description:
      "Modern developer toolkit with 19+ productivity tools for programmers and IT professionals.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}