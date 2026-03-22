// apps/web/app/page.tsx

import TopicGeneratorForm from "@/components/topic-generator-form";
import { getHealth } from "@/lib/api";
import PageShell from "@/components/page-shell";
import AppFooter from "@/components/app-footer";
import RotatingHeadline from "@/components/rotating-headline";

export default async function HomePage() {
  let apiStatus = "unreachable";

  try {
    const health = await getHealth();
    apiStatus = `${health.status} (${health.service})`;
  } catch {
    apiStatus = "offline";
  }

  return (
    <PageShell showHome={false}>
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 pt-4 pb-16 text-center sm:min-h-[calc(100vh-6rem)]">

        <p className="dd-accent-text mb-3 text-sm font-semibold uppercase tracking-[0.24em]">
          DeepDaily
        </p>

        <RotatingHeadline />

        <p className="mt-2 max-w-2xl text-base leading-7 text-(--text-soft) sm:text-lg">
          DeepDaily turns any topic into a structured, day-by-day learning path —
          so you always know what to learn next and actually stay consistent.
        </p>

        <TopicGeneratorForm />

        <div className="pt-4">
          <AppFooter />
        </div>
      </section>
    </PageShell>
  );
}