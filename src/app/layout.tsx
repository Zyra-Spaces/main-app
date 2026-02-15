import type { Metadata } from "next";
import {
  Nunito_Sans,
  Inconsolata,
} from "next/font/google";
import { GeistMono } from "geist/font/mono";
import { GeistPixelSquare } from "geist/font/pixel";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-nunito-sans",
  display: "swap",
});

const inconsolata = Inconsolata({
  subsets: ["latin"],
  variable: "--font-inconsolata",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Zyra — Where Founders Build With Fellow Builders",
  description:
    "Join the early access waitlist for Zyra. Connect with open-source projects, track contributions with GitHub, share ideas, and build products together.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${nunitoSans.variable} ${inconsolata.variable} ${GeistMono.variable} ${GeistPixelSquare.variable}`}
    >
      <body className="min-h-screen font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
