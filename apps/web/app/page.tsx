// apps/web/app/page.tsx

import TopicGeneratorForm from "@/components/topic-generator-form";
import { getHealth } from "@/lib/api";
import PageShell from "@/components/page-shell";

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
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-16 text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-(--accent)">
          DeepDaily
        </p>

        <h1 className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl">
          Learn any topic <span className="text-(--accent)">deeply</span>, one day
          at a time.
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-7 text-(--text-soft) sm:text-lg">
          DeepDaily turns any topic into a structured learning path with clear
          explanations, curated resources, and guided next steps.
        </p>

        <TopicGeneratorForm />

        {/*
                <div className="mt-8 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                    API status:{" "}
                    <span className="font-medium text-slate-900">{apiStatus}</span>
                </div>
                */}
      </section>
    </PageShell>
  );
}