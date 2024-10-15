import type { Metadata } from "next";
// import localFont from "next/font/local";
import { GeistSans } from 'geist/font/sans';

import "./globals.css";

// const geistSans = localFont({
//   src: "./fonts/GeistVF.woff",
//   variable: "--font-geist-sans",
//   weight: "100 900",
// });
// const geistMono = localFont({
//   src: "./fonts/GeistMonoVF.woff",
//   variable: "--font-geist-mono",
//   weight: "100 900",
// });

export const metadata: Metadata = {
  title: "BrowserGPT",
  description: "BrowserGPT is a chat interface that allows you to search the web and get answers to your questions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${GeistSans.className} antialiased`}>
        
        {children}
      </body>
    </html>
  );
}
