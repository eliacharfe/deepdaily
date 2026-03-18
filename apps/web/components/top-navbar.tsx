// apps/web/components/top-navbar.tsx

"use client";

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
    return (
        <div className="fixed inset-x-0 top-0 z-40">
            <div className="border-b border-white/10 bg-[linear-gradient(180deg,rgba(3,25,28,0.82),rgba(5,20,24,0.58))] backdrop-blur-xl">
                <div className="flex h-20 items-center justify-between px-5 sm:px-6">
                    <NavbarBrand />

                    <div className="flex items-center gap-3">
                        {showBack && backLessonId ? (
                            <BackButton lessonId={backLessonId} />
                        ) : null}

                        {showHome ? <HomeButton /> : null}

                        {showAuth ? (
                            <div className="mr-2">
                                <AuthButton />
                            </div>
                        ) : null}

                        {showThemeToggle ? <ThemeToggle /> : null}
                    </div>
                </div>
            </div>
        </div>
    );
}