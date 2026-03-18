// apps/web/components/theme-toggle.tsx

"use client";

import { useEffect, useState } from "react";
import IconButton from "@/components/ui/icon-button";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
    const root = document.documentElement;

    if (theme === "dark") {
        root.classList.add("dark");
        root.style.colorScheme = "dark";
    } else {
        root.classList.remove("dark");
        root.style.colorScheme = "light";
    }

    localStorage.setItem("theme", theme);
}

export default function ThemeToggle() {
    const [mounted, setMounted] = useState(false);
    const [theme, setTheme] = useState<Theme>("light");

    useEffect(() => {
        const saved = localStorage.getItem("theme") as Theme | null;
        const initialTheme: Theme = saved ?? "dark";

        setTheme(initialTheme);
        applyTheme(initialTheme);
        setMounted(true);
    }, []);

    const toggleTheme = () => {
        const nextTheme: Theme = theme === "dark" ? "light" : "dark";
        setTheme(nextTheme);
        applyTheme(nextTheme);
    };

    if (!mounted) return null;

    return (
        <IconButton onClick={toggleTheme} ariaLabel="Toggle theme">
            {theme === "dark" ? (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                </svg>
            ) : (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-slate-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path d="M21 12.79A9 9 0 0111.21 3c0 .34-.02.67-.05 1A7 7 0 1019 13.84c.33-.03.66-.05 1-.05z" />
                </svg>
            )}
        </IconButton>
    );
}