import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DNF Scheduler",
  description: "DnF Roaster Management Service",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <header className="bg-white shadow">
          <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between items-center">
              <div className="flex space-x-3 md:space-x-8">
                <a href="/characters" className="inline-flex items-center px-0.5 md:px-1 pt-1 text-xs md:text-sm font-medium text-gray-900 hover:text-blue-600">
                  캐릭터
                </a>
                <a href="/adventures" className="inline-flex items-center px-0.5 md:px-1 pt-1 text-xs md:text-sm font-medium text-gray-500 hover:text-gray-900">
                  모험단
                </a>
                <a href="/schedules" className="inline-flex items-center px-0.5 md:px-1 pt-1 text-xs md:text-sm font-medium text-gray-500 hover:text-gray-900">
                  스케줄
                </a>
                <a href="/ranking" className="inline-flex items-center px-0.5 md:px-1 pt-1 text-xs md:text-sm font-medium text-gray-500 hover:text-gray-900">
                  랭킹
                </a>
              </div>
              <div className="text-sm md:text-xl font-bold tracking-tight text-blue-600">DNF Scheduler</div>
            </div>
          </nav>
        </header>
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
