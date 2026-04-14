"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FaArrowRight, FaBolt, FaRandom, FaRobot, FaSearch, FaStar, FaUsers } from "react-icons/fa";

const highlights = [
    { label: "Secure AI", value: "Origin-checked streaming chat" },
    { label: "Deep data", value: "Details, evolution, and enrichment" },
    { label: "Product signal", value: "Search, filters, and team building" },
];

const featureCards = [
    {
        title: "Catalog browsing",
        body: "Fast discovery with filters, pagination, and list/grid preferences that persist.",
    },
    {
        title: "AI assistance",
        body: "Ask the assistant or chat with a Pokémon while keeping the stream and markdown experience safe.",
    },
    {
        title: "Team builder",
        body: "Assemble a six-Pokémon roster, inspect coverage, and keep a local draft ready to iterate on.",
    },
];

const ctas = [
    {
        href: "/pokedex/1",
        label: "Open Pokédex",
        icon: FaSearch,
        tone: "from-sky-400 to-cyan-500",
    },
    {
        href: "/team-builder",
        label: "Build a Team",
        icon: FaUsers,
        tone: "from-amber-400 to-orange-500",
    },
    {
        href: "/random-pokemon",
        label: "Random Pokémon",
        icon: FaRandom,
        tone: "from-emerald-400 to-teal-500",
    },
];

export default function LandingPage() {
    return (
        <main className="relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.16),_transparent_30%)]" />
            <section className="mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-screen-xl flex-col justify-center px-4 py-12 sm:px-8">
                <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="space-y-8"
                    >
                        <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-white/5 px-4 py-2 text-sm text-sky-100 shadow-lg backdrop-blur">
                            <FaBolt className="text-sky-300" />
                            Built for speed, safety, and a touch of sparkle.
                        </div>
                        <div className="space-y-5">
                            <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-7xl">
                                Explore the Pokédex, chat with AI, and build a team that feels real.
                            </h1>
                            <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                                This app combines fast browsing, rich Pokémon detail pages, secure streaming AI routes, and a team-builder workflow designed to feel natural and engaging.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {ctas.map((cta) => {
                                const Icon = cta.icon;
                                return (
                                    <Link
                                        key={cta.href}
                                        href={cta.href}
                                        className={`group inline-flex items-center gap-3 rounded-full bg-gradient-to-r ${cta.tone} px-5 py-3 font-semibold text-slate-950 shadow-lg transition-transform duration-200 hover:-translate-y-0.5`}
                                    >
                                        <Icon />
                                        {cta.label}
                                        <FaArrowRight className="transition-transform group-hover:translate-x-1" />
                                    </Link>
                                );
                            })}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            {highlights.map((item) => (
                                <div key={item.label} className="rounded-3xl border border-white/10 bg-slate-950/50 p-4 shadow-lg backdrop-blur">
                                    <p className="text-xs uppercase tracking-[0.3em] text-sky-300/80">{item.label}</p>
                                    <p className="mt-2 text-sm text-white">{item.value}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.55, ease: "easeOut", delay: 0.1 }}
                        className="relative"
                    >
                        <div className="absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-br from-sky-500/20 via-transparent to-amber-400/20 blur-2xl" />
                        <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
                            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">What stands out</p>
                                    <h2 className="mt-2 text-2xl font-semibold text-white">Main features:</h2>
                                </div>
                                <FaStar className="text-amber-300" />
                            </div>

                            <div className="mt-5 space-y-4">
                                {featureCards.map((card, index) => (
                                    <div key={card.title} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                                        <p className="text-xs uppercase tracking-[0.3em] text-sky-300/80">0{index + 1}</p>
                                        <h3 className="mt-2 text-lg font-semibold text-white">{card.title}</h3>
                                        <p className="mt-1 text-sm leading-6 text-slate-300">{card.body}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                <Link href="/pokedex/1" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10">
                                    Browse the catalog
                                </Link>
                                <Link href="/team-builder" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300">
                                    Open the team builder
                                </Link>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-400">
                            <FaRobot className="text-sky-300" />
                            Assistant chat is available from the catalog and details pages.
                        </div>
                    </motion.div>
                </div>
            </section>
        </main>
    );
}
