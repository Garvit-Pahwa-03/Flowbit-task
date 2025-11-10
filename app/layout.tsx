import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header"; // Import the new Header

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Flowbit Analytics Dashboard",
  description: "Internship Task by Garvit Pahwa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
          <Sidebar />
          <div className="flex flex-col">
            <Header /> {/* Add the Header here */}
            <main className="flex flex-1 flex-col gap-6 p-6 bg-gray-50/50">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}