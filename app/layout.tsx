import type {Metadata} from "next";
import Link from "next/link";
import localFont from "next/font/local";
import "./globals.css";

const appSans = localFont({
    src: [
        {
            path: "../public/assets/font/CentraNo2-Book.ttf",
            weight: "400",
            style: "normal",
        },
        {
            path: "../public/assets/font/CentraNo2-Medium.ttf",
            weight: "500",
            style: "normal",
        },
        {
            path: "../public/assets/font/CentraNo2-Bold.ttf",
            weight: "700",
            style: "normal",
        },
    ],
    variable: "--font-geist-sans",
    display: "swap",
});

const appMono = localFont({
    src: [
        {
            path: "../public/assets/font/CentraNo2-Medium.ttf",
            weight: "500",
            style: "normal",
        },
    ],
    variable: "--font-geist-mono",
    display: "swap",
});

export const metadata: Metadata = {
    title: "The Pokemon App",
    description: "Interactive Pokemon application featuring detailed information, assistance to locate pokemons and chat with Pokemon characters.",
    icons: {
        icon: "/favicon.ico", // Path to the favicon in the `public` directory
    },

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
            className={`${appSans.variable} ${appMono.variable} background-default bg-gray-100`}
        >
        <nav>
            <h1 className="text-2xl text-white">
                <Link href={"/"}>The Pokemon APP</Link>
            </h1>
        </nav>
        {children}
        <footer className="py-8">
            <p>Made with ❤️ by <a href="https://enricfitaram.dev" target="_blank" rel="noopener noreferrer"
                                  className="underline">Christian Fita</a> in Barcelona</p>
            <p>There is no CopyRight. Do as you please.</p>
        </footer>
        </body>
        </html>
    );
}
