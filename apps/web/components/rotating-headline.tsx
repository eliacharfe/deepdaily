// apps/web/components/rotating-headline.tsx

"use client";

import { useEffect, useState } from "react";

const headlines = [
    {
        id: 0,
        content: (
            <>
                Learn any topic <span className="dd-accent-text">deeply</span>, one day
                at a time.
            </>
        ),
    },
    {
        id: 1,
        content: (
            <>
                Stop jumping between{" "}
                <span className="dd-accent-text">resources</span>.
            </>
        ),
    },
    {
        id: 2,
        content: (
            <>
                Start your next topic{" "}
                <span className="dd-accent-text">step by step</span>.
            </>
        ),
    },
];

export default function RotatingHeadline() {
    const [index, setIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        console.log("headline index:", index);
    }, [index]);

    useEffect(() => {
        let timeout: number;

        function cycle() {
            setIsVisible(false);

            timeout = window.setTimeout(() => {
                setIndex((prev) => (prev + 1) % headlines.length);
                setIsVisible(true);

                timeout = window.setTimeout(cycle, 5000); // next cycle
            }, 450); // animation duration
        }

        timeout = window.setTimeout(cycle, 5000);

        return () => window.clearTimeout(timeout);
    }, []);

    return (
        <div className="max-w-4xl overflow-hidden">
            <h1
                className={[
                    "min-h-[96px] text-3xl font-semibold tracking-tight sm:min-h-[144px] sm:text-6xl",
                    "transform transition-all duration-500 will-change-transform",
                    isVisible
                        ? "translate-x-0 opacity-100"
                        : "-translate-x-8 opacity-0",
                ].join(" ")}
            >
                {headlines[index].content}
            </h1>
        </div>
    );
}