
// apps/web/components/training-page-client.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Save, Trash2 } from "lucide-react";
import DayCompleteBurst from "@/components/day-complete-burst";

import {
    createTrainingTemplate,
    deleteTrainingTemplate,
    getTrainingLog,
    getTrainingLogsForMonth,
    getTrainingTemplates,
    saveTrainingLog,
    TrainingExerciseInput,
    TrainingLog,
    TrainingTemplate,
} from "@/lib/training";


const EXERCISES = [
    // Bodyweight / Calisthenics
    "Push-ups",
    "Sit-ups",
    "Crunches",
    "Bicycle crunches",
    "Leg raises",
    "Hollow body hold",
    "Plank",
    "Side plank",
    "Mountain climbers",
    "Burpees",
    "Squats",
    "Jump squats",
    "Lunges",
    "Walking lunges",
    "Glute bridges",
    "Calf raises",
    "Pull-ups",
    "Chin-ups",
    "Dips",
    "Superman hold",

    // Strength / Gym
    "Bench press",
    "Incline bench press",
    "Shoulder press",
    "Arnold press",
    "Bicep curls",
    "Hammer curls",
    "Tricep dips",
    "Tricep extensions",
    "Deadlift",
    "Romanian deadlift",
    "Bent-over rows",
    "Lat pulldown",
    "Leg press",
    "Leg curls",
    "Leg extensions",
    "Chest fly",
    "Lateral raises",

    // Cardio / Conditioning
    "Running",
    "Cycling",
    "Jump rope",
    "Rowing",
    "Swimming",
    "High knees",
    "Stair climbing"
];

const EXERCISE_VIDEOS: Record<string, string> = {
    // Bodyweight / Calisthenics
    "Push-ups": "IODxDxX7oi4",
    "Sit-ups": "1fbU_MkV7NE",
    // "Crunches": "Xyd_fa5zoEU",
    "Crunches": "cQ5JKgEZCU4",
    "Bicycle crunches": "eqg47ZuGZXQ",
    // "Leg raises": "JB2oyawG9KI",
    "Leg raises": "gjZxVEuCUPw",
    "Hollow body hold": "LlDNef_Ztsc",
    "Plank": "pSHjTRCQxIw",
    "Side plank": "pitOuJxdyI0",
    "Mountain climbers": "nmwgirgXLYM",
    "Burpees": "TU8QYVW0gDU",
    "Squats": "YaXPRqUwItQ",
    "Jump squats": "CVaEhXotL7M",
    "Lunges": "QOVaHwm-Q6U",
    "Walking lunges": "Pbmj6xPo-Hw",
    "Glute bridges": "wPM8icPu6H8",
    "Calf raises": "YMmgqO8Jo-k",
    "Pull-ups": "eGo4IYlbE5g",
    "Chin-ups": "brhRXlOhsAM",
    "Dips": "2z8JmcrW-As",
    "Superman hold": "z6PJMT2y8GQ",

    // Strength / Gym
    "Bench press": "rT7DgCr-3pg",
    "Incline bench press": "8iPEnn-ltC8",
    "Shoulder press": "0JfYxMRsUCQ",
    "Arnold press": "6Z15_WdXmVw",
    "Bicep curls": "ykJmrZ5v0Oo",
    "Hammer curls": "zC3nLlEvin4",
    "Tricep dips": "Rea9_yRXWmU",
    "Tricep extensions": "YbX7Wd8jQ-Q",
    "Deadlift": "ytGaGIn3SjE",
    "Romanian deadlift": "2SHsk9AzdjA",
    "Bent-over rows": "FWJR5Ve8bnQ",
    "Lat pulldown": "CAwf7n6Luuc",
    "Leg press": "IZxyjW7MPJQ",
    "Leg curls": "1Tq3QdYUuHs",
    "Leg extensions": "YyvSfVjQeL0",
    "Chest fly": "eozdVDA78K0",
    "Lateral raises": "3VcKaXpzqRo",

    // Cardio / Conditioning
    "Running": "brFHyOtTwH4",
    "Cycling": "1VYhyppWTDc",
    "Jump rope": "1BZM2Vre5oc",
    "Rowing": "ZN0J6qKCIrI",
    "Swimming": "A53R6bVCU3U",
    "High knees": "lR3cpCVBjPM",
    "Stair climbing": "lfc75qEuKsc",
};

const TIMED_EXERCISES = ["Plank", "Hollow body hold"];

function isTimedExercise(name: string) {
    return TIMED_EXERCISES.includes(name);
}

function toIsoDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function startOfMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getCalendarDays(monthDate: Date) {
    const firstDay = startOfMonth(monthDate);
    const startWeekDay = firstDay.getDay();
    const days: Date[] = [];

    const start = new Date(firstDay);
    start.setDate(firstDay.getDate() - startWeekDay);

    for (let i = 0; i < 42; i++) {
        const day = new Date(start);
        day.setDate(start.getDate() + i);
        days.push(day);
    }

    return days;
}

export default function TrainingPageClient() {
    const today = new Date();

    const [selectedDate, setSelectedDate] = useState(toIsoDate(today));
    const [visibleMonth, setVisibleMonth] = useState(startOfMonth(today));

    const [exercises, setExercises] = useState<TrainingExerciseInput[]>([]);
    const [distanceKm, setDistanceKm] = useState("");
    const [timeMinutes, setTimeMinutes] = useState("");
    const [timeSeconds, setTimeSeconds] = useState("");

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [monthlyLogs, setMonthlyLogs] = useState<TrainingLog[]>([]);
    const [templates, setTemplates] = useState<TrainingTemplate[]>([]);
    const [templateName, setTemplateName] = useState("");

    const [saveBurstTrigger, setSaveBurstTrigger] = useState(0);
    const [showSavedPopup, setShowSavedPopup] = useState(false);

    const calendarDays = useMemo(
        () => getCalendarDays(visibleMonth),
        [visibleMonth]
    );

    const monthTitle = visibleMonth.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
    });

    const visibleMonthKey = `${visibleMonth.getFullYear()}-${String(
        visibleMonth.getMonth() + 1
    ).padStart(2, "0")}`;

    useEffect(() => {
        async function loadMonthLogs() {
            try {
                const logs = await getTrainingLogsForMonth(visibleMonthKey);
                setMonthlyLogs(logs);
            } catch (error) {
                console.error("Failed loading monthly training logs", error);
                setMonthlyLogs([]);
            }
        }

        loadMonthLogs();
    }, [visibleMonthKey]);

    useEffect(() => {
        async function loadTemplates() {
            try {
                const result = await getTrainingTemplates();
                setTemplates(result);
            } catch (error) {
                console.error("Failed loading training templates", error);
            }
        }

        loadTemplates();
    }, []);

    const pace = useMemo(() => {
        const distance = Number(distanceKm);
        const minutes = Number(timeMinutes);

        if (!distance || !minutes) return null;

        const paceMinutes = minutes / distance;
        const min = Math.floor(paceMinutes);
        const sec = Math.round((paceMinutes - min) * 60)
            .toString()
            .padStart(2, "0");

        return `${min}:${sec} / km`;
    }, [distanceKm, timeMinutes]);

    useEffect(() => {
        async function loadLog() {
            setLoading(true);

            try {
                const log = await getTrainingLog(selectedDate);

                setExercises(log?.exercises ?? []);
                setDistanceKm(log?.running?.distanceKm?.toString() ?? "");

                const totalMinutes = log?.running?.timeMinutes;

                setTimeMinutes(
                    totalMinutes != null
                        ? Math.floor(totalMinutes).toString()
                        : ""
                );

                setTimeSeconds(
                    totalMinutes != null
                        ? Math.round(
                            (totalMinutes - Math.floor(totalMinutes)) * 60
                        ).toString()
                        : ""
                );
            } catch (error) {
                console.error("Failed loading training log", error);
                setExercises([]);
                setDistanceKm("");
                setTimeMinutes("");
            } finally {
                setLoading(false);
            }
        }

        loadLog();
    }, [selectedDate]);

    function addExercise() {
        const name = EXERCISES[0];

        setExercises((current) => [
            ...current,
            {
                exerciseId: name.toLowerCase().replaceAll(" ", "-"),
                exerciseName: name,
                sets: 3,
                reps: 10,
            },
        ]);
    }

    function updateExercise(index: number, patch: Partial<TrainingExerciseInput>) {
        setExercises((current) =>
            current.map((exercise, i) =>
                i === index ? { ...exercise, ...patch } : exercise
            )
        );
    }

    function removeExercise(index: number) {
        setExercises((current) => current.filter((_, i) => i !== index));
    }

    async function handleSave() {
        setSaving(true);

        try {
            await saveTrainingLog(selectedDate, {
                exercises,
                running:
                    distanceKm && (timeMinutes || timeSeconds)
                        ? {
                            distanceKm: Number(distanceKm),
                            timeMinutes:
                                Number(timeMinutes || 0) + Number(timeSeconds || 0) / 60,
                        }
                        : null,
            });

            setSaveBurstTrigger((current) => current + 1);
            setShowSavedPopup(true);

            window.setTimeout(() => {
                setShowSavedPopup(false);
            }, 2200);

            const logs = await getTrainingLogsForMonth(visibleMonthKey);
            setMonthlyLogs(logs);
        } finally {
            setSaving(false);
        }
    }

    function moveMonth(direction: number) {
        setVisibleMonth(
            new Date(
                visibleMonth.getFullYear(),
                visibleMonth.getMonth() + direction,
                1
            )
        );
    }

    function applyTemplate(template: TrainingTemplate) {
        setExercises(template.exercises);
    }

    async function handleSaveTemplate() {
        const name = templateName.trim();

        if (!name || exercises.length === 0) return;

        const template = await createTrainingTemplate({
            name,
            exercises,
        });

        setTemplates((current) => [template, ...current]);
        setTemplateName("");
    }

    async function handleDeleteTemplate(id: string) {
        await deleteTrainingTemplate(id);
        setTemplates((current) => current.filter((template) => template.id !== id));
    }

    return (
        <main className="mx-auto max-w-5xl px-4 py-8">
            <div className="mb-6">
                <p className="text-sm font-medium text-teal-600 dark:text-teal-300">
                    Training
                </p>
                <h1 className="text-3xl font-bold text-slate-950 dark:text-white">
                    Training Calendar
                </h1>
                <p className="mt-2 text-slate-600 dark:text-slate-300">
                    Select a day, then log strength exercises and running.
                </p>
            </div>

            <section className="dd-surface-soft rounded-2xl border p-5">
                <div className="mb-6 flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={() => moveMonth(-1)}
                        aria-label="Previous month"
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-900/40 text-slate-200 transition hover:border-teal-400 hover:text-teal-300"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <h2 className="text-xl sm:text-2xl font-bold text-slate-950 dark:text-white text-center">
                        {monthTitle}
                    </h2>

                    <button
                        type="button"
                        onClick={() => moveMonth(1)}
                        aria-label="Next month"
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-900/40 text-slate-200 transition hover:border-teal-400 hover:text-teal-300"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-400">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                        <div key={day}>{day}</div>
                    ))}
                </div>

                <div className="mt-2 grid grid-cols-7 gap-2">
                    {calendarDays.map((day) => {
                        const iso = toIsoDate(day);
                        const isSelected = iso === selectedDate;
                        const isCurrentMonth =
                            day.getMonth() === visibleMonth.getMonth();

                        return (
                            <button
                                key={iso}
                                type="button"
                                onClick={() => setSelectedDate(iso)}
                                className={[
                                    "h-14 rounded-xl border text-sm transition",
                                    isSelected
                                        ? "border-teal-300 bg-teal-600 text-white"
                                        : "border-slate-700 bg-slate-950/40 text-slate-200 hover:border-teal-400/60",
                                    !isCurrentMonth ? "opacity-35" : "",
                                ].join(" ")}
                            >
                                <div className="flex h-full flex-col items-center justify-center gap-1">
                                    <span>{day.getDate()}</span>

                                    {(() => {
                                        const log = monthlyLogs.find((item) => item.date === iso);
                                        if (!log) return null;

                                        const hasExercises = log.exercises.length > 0;
                                        const hasRunning = !!log.running;

                                        return (
                                            <div className="flex gap-1">
                                                {hasExercises ? (
                                                    <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                                                ) : null}

                                                {hasRunning ? (
                                                    <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                                                ) : null}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </section>

            <section className="mt-5 dd-surface-soft rounded-2xl border p-5">
                <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
                    Quick templates
                </h2>

                {templates.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-500">
                        No templates yet. Build a workout below, then save it as a template.
                    </p>
                ) : (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {templates.map((template) => (
                            <div
                                key={template.id}
                                className="inline-flex items-center overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700"
                            >
                                <button
                                    type="button"
                                    onClick={() => applyTemplate(template)}
                                    className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-700 dark:text-slate-200 dark:hover:bg-teal-950/30 dark:hover:text-teal-300"
                                >
                                    {template.name}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleDeleteTemplate(template.id)}
                                    className="border-l border-slate-200 px-3 py-2 text-red-500 hover:bg-red-50 dark:border-slate-700 dark:hover:bg-red-950/20"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <input
                        value={templateName}
                        onChange={(event) => setTemplateName(event.target.value)}
                        placeholder="Template name, e.g. Morning Core"
                        className="min-w-0 flex-1 rounded-xl border px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
                    />

                    <button
                        type="button"
                        onClick={handleSaveTemplate}
                        disabled={!templateName.trim() || exercises.length === 0}
                        className="rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
                    >
                        Save current as template
                    </button>
                </div>
            </section>

            <section className="mt-5 dd-surface-soft rounded-2xl border p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
                        {selectedDate} workout
                    </h2>

                    <button
                        type="button"
                        onClick={addExercise}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
                    >
                        <Plus size={16} />
                        Add
                    </button>
                </div>

                {loading ? (
                    <p className="text-sm text-slate-500">Loading...</p>
                ) : exercises.length === 0 ? (
                    <p className="rounded-xl border border-dashed p-4 text-sm text-slate-500 dark:border-slate-700">
                        No strength exercises logged for this day.
                    </p>
                ) : (
                    <div className="space-y-4">
                        {exercises.map((exercise, index) => {
                            const timed = isTimedExercise(exercise.exerciseName);

                            return (
                                <div
                                    key={index}
                                    className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
                                >
                                    <div className="grid gap-3 md:grid-cols-[1.5fr_0.7fr_0.7fr_auto] md:items-end">
                                        <div>
                                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                Exercise
                                            </label>

                                            <select
                                                value={exercise.exerciseName}
                                                onChange={(event) => {
                                                    const name = event.target.value;

                                                    updateExercise(index, {
                                                        exerciseName: name,
                                                        exerciseId: name.toLowerCase().replaceAll(" ", "-"),
                                                        reps: isTimedExercise(name) ? 60 : 10,
                                                    });
                                                }}
                                                className="w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                                            >
                                                {EXERCISES.map((name) => (
                                                    <option key={name}>{name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                Sets
                                            </label>

                                            <input
                                                type="number"
                                                min={1}
                                                value={exercise.sets}
                                                onChange={(event) =>
                                                    updateExercise(index, {
                                                        sets: Number(event.target.value),
                                                    })
                                                }
                                                placeholder="Sets"
                                                className="w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                {timed ? "Seconds" : "Reps"}
                                            </label>

                                            <input
                                                type="number"
                                                min={1}
                                                value={exercise.reps ?? ""}
                                                onChange={(event) =>
                                                    updateExercise(index, {
                                                        reps: Number(event.target.value),
                                                    })
                                                }
                                                placeholder={timed ? "Seconds" : "Reps"}
                                                className="w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                                            />
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => removeExercise(index)}
                                            aria-label="Remove exercise"
                                            className="flex h-11 w-full items-center justify-center rounded-lg border px-3 py-2 text-red-500 hover:bg-red-50 dark:border-slate-700 dark:hover:bg-red-950/20 md:w-12"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    {EXERCISE_VIDEOS[exercise.exerciseName] ? (
                                        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                                            <iframe
                                                className="aspect-video w-full"
                                                src={`https://www.youtube.com/embed/${EXERCISE_VIDEOS[exercise.exerciseName]}`}
                                                title={`${exercise.exerciseName} technique video`}
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        </div>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            <section className="mt-5 dd-surface-soft rounded-2xl border p-5">
                <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
                    Running
                </h2>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Distance in KM
                        </label>
                        <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={distanceKm}
                            onChange={(event) => setDistanceKm(event.target.value)}
                            placeholder="Example: 1.6"
                            className="w-full rounded-xl border px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Minutes
                        </label>
                        <input
                            type="number"
                            min={0}
                            step="1"
                            value={timeMinutes}
                            onChange={(event) => setTimeMinutes(event.target.value)}
                            placeholder="Example: 7"
                            className="w-full rounded-xl border px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Seconds
                        </label>
                        <input
                            type="number"
                            min={0}
                            max={59}
                            step="1"
                            value={timeSeconds}
                            onChange={(event) => setTimeSeconds(event.target.value)}
                            placeholder="Example: 30"
                            className="w-full rounded-xl border px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
                        />
                    </div>
                </div>

                {/* <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Distance in KM
                        </label>
                        <input
                            type="number"
                            min={0}
                            step="0.1"
                            value={distanceKm}
                            onChange={(event) => setDistanceKm(event.target.value)}
                            placeholder="Example: 5"
                            className="w-full rounded-xl border px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Time in minutes
                        </label>
                        <input
                            type="number"
                            min={0}
                            step="1"
                            value={timeMinutes}
                            onChange={(event) => setTimeMinutes(event.target.value)}
                            placeholder="Example: 28"
                            className="w-full rounded-xl border px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
                        />
                    </div>
                </div> */}

                {pace ? (
                    <p className="mt-3 text-sm font-medium text-teal-600 dark:text-teal-300">
                        Pace: {pace}
                    </p>
                ) : null}
            </section>

            <div className="relative mt-6">
                <DayCompleteBurst trigger={saveBurstTrigger} />

                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
                >
                    <Save size={18} />
                    {saving ? "Saving..." : "Save training log"}
                </button>
            </div>

            {showSavedPopup ? (
                <div className="fixed bottom-6 right-6 z-[300] w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl border border-teal-400/30 bg-[#08111D]/95 px-5 py-4 text-white shadow-2xl backdrop-blur-md">
                    <p className="text-lg font-bold">Training saved 🎉</p>
                    <p className="mt-1 text-sm text-teal-100">
                        Another step forward. Keep building momentum.
                    </p>
                </div>
            ) : null}
        </main>
    );
}