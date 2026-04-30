
// apps/web/components/day-complete-burst.tsx

type Props = {
    trigger: number;
};

export default function DayCompleteBurst({ trigger }: Props) {
    if (!trigger) return null;

    const particles = Array.from({ length: 18 });

    return (
        <div className="pointer-events-none absolute inset-0 z-50 overflow-visible">
            {particles.map((_, i) => {
                const left = 40 + Math.random() * 20;
                const delay = Math.random() * 150;
                const duration = 900 + Math.random() * 500;

                return (
                    <span
                        key={`${trigger}-${i}`}
                        className="absolute text-2xl"
                        style={{
                            left: `${left}%`,
                            bottom: "0%",
                            animation: `burstUp ${duration}ms ease-out ${delay}ms forwards`,
                        }}
                    >
                        🎉
                    </span>
                );
            })}
        </div>
    );
}