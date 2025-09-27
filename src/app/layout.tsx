import type { Metadata } from "next";
import Navbar from "./components/Navbar/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Todo List",
  description: "A simple todo app built with Next.js and TypeScript",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
