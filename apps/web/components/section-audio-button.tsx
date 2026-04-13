
// apps/web/components/section-audio-button.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

const audioCache = new Map<string, string>();

function buildAudioKey(title: string, content: string, language?: string) {
    return `${language ?? "auto"}::${title}::${content}`;
}

function formatTime(seconds: number) {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    return `${mins}:${secs.toString().padStart(2, "0")}`;
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
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const ownedBlobUrlRef = useRef<string | null>(null);

    const audioKey = buildAudioKey(title, content, language);

    const progressPercent = useMemo(() => {
        if (!duration || !Number.isFinite(duration)) return 0;
        return Math.min((currentTime / duration) * 100, 100);
    }, [currentTime, duration]);

    function bindAudioEvents(audio: HTMLAudioElement) {
        audio.onloadedmetadata = () => {
            setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
        };

        audio.ontimeupdate = () => {
            setCurrentTime(audio.currentTime || 0);
            setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
        };

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

            setCurrentTime(Number.isFinite(audio.duration) ? audio.duration : 0);
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
    }

    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();

                if (activeAudio === audioRef.current) {
                    activeAudio = null;
                    activeAudioKey = null;
                }

                audioRef.current.onloadedmetadata = null;
                audioRef.current.ontimeupdate = null;
                audioRef.current.onplay = null;
                audioRef.current.onpause = null;
                audioRef.current.onended = null;
                audioRef.current.onerror = null;
                audioRef.current = null;
            }

            const ownedBlobUrl = ownedBlobUrlRef.current;
            if (ownedBlobUrl && !audioCache.has(audioKey)) {
                URL.revokeObjectURL(ownedBlobUrl);
            }

            ownedBlobUrlRef.current = null;
        };
    }, [audioKey]);

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

            let audioUrl = audioCache.get(audioKey);

            if (!audioUrl) {
                audioUrl = await fetchSectionAudio({
                    title,
                    content,
                    language,
                });

                audioCache.set(audioKey, audioUrl);
            }

            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.onloadedmetadata = null;
                audioRef.current.ontimeupdate = null;
                audioRef.current.onplay = null;
                audioRef.current.onpause = null;
                audioRef.current.onended = null;
                audioRef.current.onerror = null;
            }

            setCurrentTime(0);
            setDuration(0);

            const audio = new Audio(audioUrl);
            ownedBlobUrlRef.current = audioUrl;

            bindAudioEvents(audio);

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
        <div className={`mt-5 w-full ${className}`}>
            <div className="flex w-full items-center gap-3">
                <div className="min-w-0 flex-1">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                        <div
                            className="h-full rounded-full bg-teal-500 transition-[width] duration-150"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

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
            </div>

            {state === "error" && errorMessage ? (
                <p className="mt-1 text-[10px] text-red-500 dark:text-red-400">
                    {errorMessage}
                </p>
            ) : null}
        </div>
    );
}