
// apps/web/components/ui/level-dropdown.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import type { TopicLevel } from "@/types/topic";

type Option = {
    value: TopicLevel;
    label: string;
};

type Props = {
    value: TopicLevel;
    onChange: (value: TopicLevel) => void;
    disabled?: boolean;
};

const OPTIONS: Option[] = [
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
];

export default function LevelDropdown({
    value,
    onChange,
    disabled = false,
}: Props) {
    const [open, setOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

    const containerRef = useRef<HTMLDivElement | null>(null);
    const buttonRef = useRef<HTMLButtonElement | null>(null);

    const selectedOption =
        OPTIONS.find((option) => option.value === value) ?? OPTIONS[0];

    // Detect theme
    useEffect(() => {
        const updateTheme = () => {
            setIsDarkMode(document.documentElement.classList.contains("dark"));
        };

        updateTheme();

        const observer = new MutationObserver(updateTheme);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (!containerRef.current) return;
            if (!containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }

        function handleEscape(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setOpen(false);
                buttonRef.current?.focus();
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    function handleToggle() {
        if (disabled) return;
        setOpen((prev) => !prev);
    }

    function handleSelect(nextValue: TopicLevel) {
        onChange(nextValue);
        setOpen(false);
        buttonRef.current?.focus();
    }

    function handleButtonKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
        if (disabled) return;

        if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen(true);
        }
    }

    function handleOptionKeyDown(
        event: React.KeyboardEvent<HTMLButtonElement>,
        optionValue: TopicLevel
    ) {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleSelect(optionValue);
        }
    }

    return (
        <div ref={containerRef} className="relative w-full sm:w-[150px]">
            {/* BUTTON */}
            <button
                ref={buttonRef}
                type="button"
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label="Select learning level"
                onClick={handleToggle}
                onKeyDown={handleButtonKeyDown}
                className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-50 ${isDarkMode ? "text-slate-200" : "text-slate-800"
                    }`}
                style={
                    isDarkMode
                        ? {
                            border: "1px solid rgba(120, 149, 164, 0.22)",
                            background: "rgba(255,255,255,0.05)",
                            boxShadow: open
                                ? "0 0 0 1px rgba(45,212,191,0.18), 0 0 20px rgba(45,212,191,0.08)"
                                : "none",
                        }
                        : {
                            border: "1px solid rgba(203, 213, 225, 0.95)",
                            background:
                                "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(244,248,251,0.96) 100%)",
                            boxShadow: open
                                ? "0 0 0 1px rgba(20,184,166,0.15)"
                                : "none",
                        }
                }
            >
                <span>{selectedOption.label}</span>

                <ChevronDown
                    size={16}
                    className={`shrink-0 ${isDarkMode ? "text-slate-400" : "text-slate-500"
                        } transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                />
            </button>

            {/* DROPDOWN */}
            {open && (
                <div
                    className="absolute bottom-full left-0 right-0 z-50 mb-2 overflow-hidden rounded-2xl border backdrop-blur-xl"
                    style={{
                        borderColor: isDarkMode
                            ? "rgba(45,212,191,0.18)"
                            : "rgba(203,213,225,0.95)",
                        background: isDarkMode
                            ? "linear-gradient(180deg, rgba(8,18,27,0.96) 0%, rgba(9,20,30,0.94) 100%)"
                            : "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(244,248,251,0.98) 100%)",
                        boxShadow: isDarkMode
                            ? "0 18px 50px rgba(0,0,0,0.32)"
                            : "0 12px 30px rgba(15,23,42,0.08)",
                    }}
                >
                    <div className="py-1" role="listbox" aria-label="Learning level options">
                        {OPTIONS.map((option) => {
                            const isSelected = option.value === value;

                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    role="option"
                                    aria-selected={isSelected}
                                    onClick={() => handleSelect(option.value)}
                                    onKeyDown={(event) =>
                                        handleOptionKeyDown(event, option.value)
                                    }
                                    className="flex w-full items-center justify-between px-4 py-3 text-left text-sm transition"
                                    style={{
                                        color: isSelected
                                            ? isDarkMode
                                                ? "#ffffff"
                                                : "#0f172a"
                                            : isDarkMode
                                                ? "rgb(203 213 225)"
                                                : "rgb(71 85 105)",
                                        background: isSelected
                                            ? "rgba(45,212,191,0.12)"
                                            : "transparent",
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isSelected) {
                                            e.currentTarget.style.background = isDarkMode
                                                ? "rgba(255,255,255,0.04)"
                                                : "rgba(15,23,42,0.04)";
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = isSelected
                                            ? "rgba(45,212,191,0.12)"
                                            : "transparent";
                                    }}
                                >
                                    <span>{option.label}</span>

                                    {isSelected && (
                                        <Check size={16} className="text-teal-500 dark:text-teal-300" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}