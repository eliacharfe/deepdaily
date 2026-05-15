// apps/web/components/top-navbar.tsx

"use client";

import Link from "next/link";
import { Dumbbell, Menu, X, Home } from "lucide-react";
import { useState } from "react";

import HomeButton from "@/components/home-button";
import AuthButton from "@/components/auth/auth-button";
import ThemeToggle from "@/components/theme-toggle";
import BackButton from "@/components/back-button";
import NavbarBrand from "@/components/navbar-brand";

type Props = {
    showBack?: boolean;
    backLessonId?: string;
    showHome?: boolean;
    showAuth?: boolean;
    showThemeToggle?: boolean;
};

export default function TopNavbar({
    showBack = false,
    backLessonId,
    showHome = true,
    showAuth = true,
    showThemeToggle = true,
}: Props) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    return (
        <div className="fixed inset-x-0 top-0 z-40">
            <div className="border-b border-white/10 bg-[linear-gradient(180deg,rgba(3,25,28,0.82),rgba(5,20,24,0.58))] backdrop-blur-xl">
                <div className="flex h-20 items-center justify-between px-5 sm:px-6">
                    <NavbarBrand />

                    <div className="flex items-center gap-3">
                        {showBack ? (
                            <BackButton lessonId={backLessonId} />
                        ) : null}

                        {showHome ? (
                            <div className="hidden sm:block">
                                <HomeButton />
                            </div>
                        ) : null}

                        <Link
                            href="/training"
                            className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white/85 transition hover:border-teal-300/40 hover:bg-teal-400/10 hover:text-teal-200 sm:inline-flex"
                        >
                            <Dumbbell className="h-4 w-4" />
                            Training
                        </Link>

                        {showAuth ? (
                            <div className="mr-2 hidden sm:block">
                                <AuthButton />
                            </div>
                        ) : null}

                        {showThemeToggle ? <ThemeToggle /> : null}

                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen((prev) => !prev)}
                            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 text-white sm:hidden"
                        >
                            {mobileMenuOpen ? (
                                <X className="h-5 w-5" />
                            ) : (
                                <Menu className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                </div>

                {mobileMenuOpen ? (
                    <>
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(false)}
                            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] sm:hidden"
                        />

                        <div className="fixed right-0 top-20 z-50 h-[calc(100vh-5rem)] w-72 border-l border-slate-200 bg-white p-5 text-slate-900 shadow-2xl dark:border-white/10 dark:bg-[#08111D]/98 dark:text-white sm:hidden">
                            <div className="flex h-full flex-col">
                                <div className="flex flex-col gap-3">
                                    {showHome ? (
                                        <Link
                                            href="/"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-800 transition hover:bg-slate-100 dark:text-white/90 dark:hover:bg-white/5"
                                        >
                                            <Home className="h-5 w-5" />
                                            Home
                                        </Link>
                                    ) : null}

                                    <Link
                                        href="/training"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-800 transition hover:bg-slate-100 dark:text-white/90 dark:hover:bg-white/5"
                                    >
                                        <Dumbbell className="h-5 w-5" />
                                        Training
                                    </Link>
                                </div>

                                {showAuth ? (
                                    <div className="mt-auto border-t border-slate-200 pt-5 dark:border-white/10">
                                        <div className="rounded-xl border border-white/10 bg-[#08111D]/98 p-3 text-white shadow-lg">
                                            <AuthButton />
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </>
                ) : null}


            </div>
        </div>
    );
}