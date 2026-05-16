import type { Metadata } from "next";
import { Outfit, Poppins } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-poppins" });

export const metadata: Metadata = {
  title: "AI Resume Analyzer",
  description: "Elevate your professional trajectory with intelligent resume analysis, automated job matching, and technical interview preparation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${poppins.variable}`}>
      <body className="min-h-screen font-sans flex flex-col">
        {children}
      </body>
    </html>
  );
}

