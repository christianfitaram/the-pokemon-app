import type { Metadata } from "next";
import Link from 'next/link';
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className}>
        <nav>
          <h1 className='text-2xl'> <Link href={"/"}>The Pokemon APP</Link></h1>
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
