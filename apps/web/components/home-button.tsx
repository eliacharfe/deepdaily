

"use client";

import { useRouter } from "next/navigation";
import IconButton from "@/components/ui/icon-button";

export default function HomeButton() {
    const router = useRouter();

    return (
        <IconButton
            onClick={() => router.push("/")}
            ariaLabel="Go home"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 11l9-8 9 8M4 10v10h5v-6h6v6h5V10" />
            </svg>
        </IconButton>
    );
}