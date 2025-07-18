import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";
import { TranslationProvider } from '@/context/TranslationContext';
import { LanguageProvider } from "@/context/LanguageContext";
import { ThemeProvider } from "next-themes";

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
    <html lang="en" className="overflow-y-scroll">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, interactive-widget=resizes-content"
        />
      </head>

      <body
        className={`${openSans.className} antialiased`}
      >
        <ThemeProvider
          attribute="data-theme"    /* puts data-theme="light|dark" on <html> */
          defaultTheme="system"     /* follow OS by default */
          enableSystem              /* let users return to “system” */
        >

          <LanguageProvider>
            <TranslationProvider>
              {children}
            </TranslationProvider>
          </LanguageProvider>

        </ThemeProvider>
      </body>
    </html>
  );
}
