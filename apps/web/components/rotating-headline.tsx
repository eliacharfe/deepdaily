// apps/web/components/rotating-headline.tsx

"use client";

import { useEffect, useState } from "react";

const headlines = [
    {
        id: 0,
        content: (
            <>
                Stop jumping between resources. Learn any topic{" "}
                <span className="dd-accent-text">step by step</span>.
            </>
        ),
    },
    {
        id: 1,
        content: (
            <>
                Learn any topic <span className="dd-accent-text">deeply</span>, one day
                at a time.
            </>
        ),
    },
];

export default function RotatingHeadline() {
    const [index, setIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const interval = window.setInterval(() => {
            setIsVisible(false);

            window.setTimeout(() => {
                setIndex((prev) => (prev + 1) % headlines.length);
                setIsVisible(true);
            }, 350);
        }, 5000);

        return () => window.clearInterval(interval);
    }, []);

    return (
        <div className="max-w-4xl overflow-hidden">
            <h1
                className={[
                    "text-3xl font-semibold tracking-tight sm:text-6xl",
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