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
  description: "This a Pokemon App for testing porpouses",
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
        className={`${geistSans.variable} ${geistMono.variable} ${inter.className} dark: background-default`}
      >
        <nav>
          <h1 className="text-2xl">
            <Link href={"/"}>The Pokemon APP</Link>
          </h1>
        </nav>
        {children}
        <footer>
          <p>Made with ❤️ by me in Barcelona</p>
          <p>There is no CopyRight. Do as you please.</p>
        </footer>
      </body>
    </html>
  );
}
