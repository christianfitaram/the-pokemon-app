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
            <div className="mx-auto flex w-full max-w-screen-xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
                <Link href="/" className="flex flex-col text-left">
                    <span className="text-xs uppercase tracking-[0.35em] text-sky-300/80">The Pokemon App</span>
                    <span className="text-lg font-semibold text-white">Explore, compare, and build teams</span>
                </Link>
                <div className="flex items-center gap-2 text-sm text-white/90 sm:gap-3">
                    <Link href="/pokedex/1" className="rounded-full border border-white/10 px-3 py-2 transition hover:bg-white/10">
                        Pokédex
                    </Link>
                    <Link href="/team-builder" className="rounded-full border border-white/10 px-3 py-2 transition hover:bg-white/10">
                        Team Builder
                    </Link>
                </div>
            </div>
        </nav>
        {children}
        <footer className="py-8">
            <p>Made with ❤️ by <a href="https://enricfitaram.dev" target="_blank" rel="noopener noreferrer"
                                  className="underline">Christian Fita</a> in Barcelona</p>
            <p>Pokemon is a trademark of Nintendo, Game Freak, and The Pokemon Company.</p>
        </footer>
        </body>
        </html>
    );
}
