
// apps/web/components/back-button.tsx

"use client";

import { useRouter } from "next/navigation";
import IconButton from "@/components/ui/icon-button";

type Props = {
    lessonId: string;
};

export default function BackButton({ lessonId }: Props) {
    const router = useRouter();

    return (
        <IconButton
            onClick={() => router.push(`/lessons/${lessonId}`)}
            ariaLabel="Back to lesson"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
        </IconButton>
    );
}