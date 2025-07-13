import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TranslationProvider } from '@/context/TranslationContext';
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Smart Translator",
  description: "Smart Translator is an AI-powered app that translates languages in a natural, non-literal way. Get accurate meanings, short or detailed explanations, and examples focused on expressions, idioms, and real-life usage.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, interactive-widget=resizes-content"
        />
      </head>

      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="data-theme"    /* puts data-theme="light|dark" on <html> */
          defaultTheme="system"     /* follow OS by default */
          enableSystem              /* let users return to “system” */
        >

          <TranslationProvider>
            {children}
          </TranslationProvider>

        </ThemeProvider>
      </body>
    </html>
  );
}
