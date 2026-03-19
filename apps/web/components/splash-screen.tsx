
// apps/web/components/splash-screen.tsx

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const SHOW_ONCE_PER_SESSION = false;

export default function SplashScreen() {
    const [mounted, setMounted] = useState(false);
    const [visible, setVisible] = useState(false);
    const [fadeOut, setFadeOut] = useState(false);

    useEffect(() => {
        setMounted(true);

        if (SHOW_ONCE_PER_SESSION) {
            const alreadySeen = sessionStorage.getItem("deepdaily_splash_seen");
            if (alreadySeen) return;
            sessionStorage.setItem("deepdaily_splash_seen", "true");
        }

        setVisible(true);

        const fadeTimer = window.setTimeout(() => {
            setFadeOut(true);
        }, 2200);

        const removeTimer = window.setTimeout(() => {
            setVisible(false);
        }, 3000);

        return () => {
            window.clearTimeout(fadeTimer);
            window.clearTimeout(removeTimer);
        };
    }, []);

    if (!mounted || !visible) return null;

    return (
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-700 ${fadeOut ? "opacity-0 scale-110" : "opacity-100 scale-100"
                }`}
            style={{
                background: "rgba(7, 32, 35, 0.56)",
                backdropFilter: "blur(16px) saturate(145%)",
                WebkitBackdropFilter: "blur(16px) saturate(145%)",
            }}
        >
            <div className="relative flex items-center justify-center">
                <div
                    className={`absolute rounded-full bg-teal-400/15 blur-3xl transition-all duration-700 ${fadeOut
                            ? "h-56 w-56 scale-150 opacity-0"
                            : "h-36 w-36 sm:h-44 sm:w-44 md:h-56 md:w-56 lg:h-72 lg:w-72 scale-100 opacity-100"
                        }`}
                />

                <div
                    className={`relative 
        h-28 w-28 
        sm:h-32 sm:w-32 
        md:h-40 md:w-40 
        lg:h-48 lg:w-48 
        overflow-hidden rounded-full border border-teal-300/30 
        bg-[#0b1f22]/70 
        shadow-[0_0_40px_rgba(45,212,191,0.16)] ${fadeOut
                            ? "animate-[logoExit_0.8s_ease-in-out_forwards]"
                            : "animate-[logoEntrance_2.1s_ease-in-out_forwards]"
                        }`}
                >
                    <Image
                        src="/deepdaily-logo.png"
                        alt="DeepDaily"
                        fill
                        priority
                        className="object-cover"
                        sizes="112px"
                    />
                </div>
            </div>
        </div>
    );
}