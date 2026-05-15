
// apps/web/app/training/page.tsx

import PageShell from "@/components/page-shell";
import TrainingPageClient from "@/components/training-page-client";

export default function TrainingPage() {
    return (
        <PageShell
            showBack
            showHome
            showAuth
            showThemeToggle
        >
            <TrainingPageClient />
        </PageShell>
    );
}