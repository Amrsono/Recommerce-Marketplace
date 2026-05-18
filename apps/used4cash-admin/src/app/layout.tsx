import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ThemeBody from "@/components/ThemeBody";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "used4cash: Don't trash it, cash it",
  description: "AI-Powered Electronics Marketplace - Get instant cash for your old devices.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>
        <ThemeProvider>
          <ThemeBody>
            <LanguageProvider>
              <AuthProvider>
                {children}
              </AuthProvider>
            </LanguageProvider>
          </ThemeBody>
        </ThemeProvider>
      </body>
    </html>
  );
}
