
// apps/web/components/app-footer.tsx

export default function AppFooter() {
    return (
        <div className="w-full text-center text-xs text-[var(--text-soft)]">
            DeepDaily •{" "}
            <a
                href="https://www.eliacharfeig.com/"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2 hover:text-[var(--text)]"
            >
                Built by Eliachar Feig
            </a>{" "}
            •{" "}
            <a
                href="https://github.com/eliacharfe/deepdaily" // update repo
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2 hover:text-[var(--text)]"
            >
                GitHub
            </a>{" "}
            •{" "}
            <a
                href="https://www.linkedin.com/in/eliachar-feig/"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2 hover:text-[var(--text)]"
            >
                LinkedIn
            </a>
        </div>
    );
}