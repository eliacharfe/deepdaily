

"use client";

import { useRouter } from "next/navigation";

export default function HomeButton() {
    const router = useRouter();

    return (
        <button
            onClick={() => router.push("/")}
            aria-label="Go home"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white/80 shadow-sm backdrop-blur transition hover:bg-slate-100 dark:border-[#4C4541] dark:bg-[#3A3533]/80 dark:hover:bg-[#4A4441]"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-slate-700 dark:text-[#F1E7DF]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 11l9-8 9 8M4 10v10h5v-6h6v6h5V10" />
            </svg>
        </button>
    );
}