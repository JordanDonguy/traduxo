import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";
import AppProvider from "@/contexts/AppProvider.web";
import AppHeaderSuspenseWrapper from "@/components/menu/AppHeaderSuspenseWrapper";
const openSans = Open_Sans({
  variable: "--font-open_sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Traduxo",
  description: "Traduxo is an AI-powered app that translates languages in a natural, non-literal way. Get accurate meanings, short or detailed explanations, and examples focused on expressions, idioms, and real-life usage.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="overflow-y-hidden bg-[var(--bg)]">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, interactive-widget=resizes-content"
        />
      </head>

      <body
        className={`${openSans.className} antialiased bg-[var(--bg)]`}
      >
        <AppProvider>
          <AppHeaderSuspenseWrapper />
          <h1 className="sr-only">Traduxo – AI-Powered Translations and Expression Suggestions</h1>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
