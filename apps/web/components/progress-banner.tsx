
// apps/web/components/progress-banner.tsx

type ProgressBannerProps = {
    title: string;
    message: string;
    xp?: number;
};

export default function ProgressBanner({ title, message, xp }: ProgressBannerProps) {
    return (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="rounded-2xl border border-teal-200 bg-white/95 p-4 shadow-lg backdrop-blur dark:border-teal-500/30 dark:bg-slate-950/95">
                <p className="text-sm font-semibold text-teal-700 dark:text-teal-300">
                    {title}
                </p>

                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {message}
                </p>

                {xp ? (
                    <p className="mt-2 text-xs font-semibold text-teal-700 dark:text-teal-300">
                        +{xp} XP
                    </p>
                ) : null}
            </div>
        </div>
    );
}