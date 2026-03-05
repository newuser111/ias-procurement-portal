import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/SessionProvider";
import { PostHogProvider } from "./providers";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "IAS Procurement Portal",
  description: "It's A Secret Med Spa — Internal Procurement & Purchasing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} antialiased`}>
        <AuthProvider>
          <PostHogProvider>
            {children}
          </PostHogProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
