import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppQueryProvider } from "@/providers/QueryClientProvider";
import { Suspense } from "react"; // ✅ Import Suspense
import FullScreenLoader from "@/components/utils/FullScreenLoader";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Homekeyy Admin",
  description: "Homekeyy Admin",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body suppressHydrationWarning className="antialiased">
        <Suspense fallback={<FullScreenLoader />}>
          <AppQueryProvider>
            {children}
          </AppQueryProvider>
        </Suspense>
      </body>
    </html>
  );
}
