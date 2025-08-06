import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Pokemon App",
  description: "Interactive Pokemon application featuring detailed information, assistance to locate pokemons and chat with Pokemon characters.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning={true}
        className={`${geistSans.variable} ${geistMono.variable} ${inter.className}  background-default bg-gray-100`}
      >
        <nav>
          <h1 className="text-2xl text-white">
            <Link href={"/"}>The Pokemon APP</Link>
          </h1>
        </nav>
        {children}
        <footer className="py-8">
          <p>Made with ❤️ by <a href="https://enricfitaram.dev" target="_blank" rel="noopener noreferrer" className="underline">Christian Fita</a> in Barcelona</p>
          <p>There is no CopyRight. Do as you please.</p>
        </footer>
      </body>
    </html>
  );
}
