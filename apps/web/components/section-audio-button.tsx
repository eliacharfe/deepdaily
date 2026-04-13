
// apps/web/components/section-audio-button.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Pause, Play, Volume2 } from "lucide-react";
import { config } from "@/lib/config";

type Props = {
    title: string;
    content: string;
    language?: string;
    className?: string;
};

type AudioState = "idle" | "loading" | "playing" | "paused" | "error";

let activeAudio: HTMLAudioElement | null = null;
let activeAudioKey: string | null = null;

function buildAudioKey(title: string, content: string, language?: string) {
    return `${language ?? "auto"}::${title}::${content}`;
}

async function fetchSectionAudio(params: {
    title: string;
    content: string;
    language?: string;
}): Promise<string> {
    const token = await import("@/lib/firebase").then(async (mod) => {
        const auth = mod.auth;
        const user = auth.currentUser;

        if (!user) {
            throw new Error("You must be signed in");
        }

        return user.getIdToken();
    });

    const response = await fetch(`${config.apiBaseUrl}/audio/section`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(params),
    });

    if (!response.ok) {
        let message = "Failed to generate audio";

        try {
            const errorData = await response.json();
            message = errorData.detail || message;
        } catch {
            // keep fallback message
        }

        throw new Error(message);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
}

export default function SectionAudioButton({
    title,
    content,
    language,
    className = "",
}: Props) {
    const [state, setState] = useState<AudioState>("idle");
    const [errorMessage, setErrorMessage] = useState("");
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const audioKey = buildAudioKey(title, content, language);

    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();

                if (activeAudio === audioRef.current) {
                    activeAudio = null;
                    activeAudioKey = null;
                }

                audioRef.current = null;
            }
        };
    }, []);

    async function handleClick() {
        try {
            setErrorMessage("");

            if (state === "playing" && audioRef.current) {
                audioRef.current.pause();
                setState("paused");
                return;
            }

            if (state === "paused" && audioRef.current) {
                if (activeAudio && activeAudio !== audioRef.current) {
                    activeAudio.pause();
                }

                activeAudio = audioRef.current;
                activeAudioKey = audioKey;

                await audioRef.current.play();
                setState("playing");
                return;
            }

            setState("loading");

            if (activeAudio && activeAudioKey !== audioKey) {
                activeAudio.pause();
            }

            const audioUrl = await fetchSectionAudio({
                title,
                content,
                language,
            });

            const audio = new Audio(audioUrl);

            audio.onplay = () => {
                activeAudio = audio;
                activeAudioKey = audioKey;
                setState("playing");
            };

            audio.onpause = () => {
                if (!audio.ended) {
                    setState("paused");
                }
            };

            audio.onended = () => {
                if (activeAudio === audio) {
                    activeAudio = null;
                    activeAudioKey = null;
                }
                setState("idle");
            };

            audio.onerror = () => {
                if (activeAudio === audio) {
                    activeAudio = null;
                    activeAudioKey = null;
                }
                setState("error");
                setErrorMessage("Failed to play audio");
            };

            audioRef.current = audio;
            await audio.play();
        } catch (error) {
            console.error("[section-audio] failed", error);
            setState("error");
            setErrorMessage(
                error instanceof Error ? error.message : "Failed to load audio"
            );
        }
    }

    const label =
        state === "loading"
            ? "Loading audio"
            : state === "playing"
                ? "Pause audio"
                : state === "paused"
                    ? "Resume audio"
                    : "Play audio";

    return (
        <div className={`flex flex-col items-end gap-1 ${className}`}>
            <button
                type="button"
                onClick={handleClick}
                aria-label={label}
                title={label}
                className="dd-surface-soft inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-slate-700 transition hover:border-teal-200 hover:text-teal-700 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-200 dark:hover:border-teal-500/20 dark:hover:text-teal-300"
                disabled={state === "loading"}
            >
                {state === "loading" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : state === "playing" ? (
                    <Pause className="h-4 w-4" />
                ) : state === "paused" ? (
                    <Play className="h-4 w-4" />
                ) : (
                    <Volume2 className="h-4 w-4" />
                )}
            </button>

            {state === "error" && errorMessage ? (
                <p className="max-w-[180px] text-right text-[10px] text-red-500 dark:text-red-400">
                    {errorMessage}
                </p>
            ) : null}
        </div>
    );
}