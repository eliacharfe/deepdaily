// apps/web/components/ui/icon-button.tsx


type Props = {
    onClick?: () => void;
    children: React.ReactNode;
    ariaLabel: string;
};

export default function IconButton({ onClick, children, ariaLabel }: Props) {
    return (
        <button
            onClick={onClick}
            aria-label={ariaLabel}
            className="
                flex h-10 w-10 items-center justify-center
                rounded-full
                border border-teal-400/30
                bg-teal-500/10
                shadow-sm backdrop-blur
                transition

                hover:bg-teal-500/20
                hover:border-teal-400/50

                dark:bg-teal-400/10
                dark:hover:bg-teal-400/20
            "
        >
            <span className="text-teal-500 dark:text-teal-300">
                {children}
            </span>
        </button>
    );
}