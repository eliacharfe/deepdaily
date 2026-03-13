//apps/web/app/page.tsx

import TopicGeneratorForm from "@/components/topic-generator-form";
import { getHealth } from "@/lib/api";

export default async function HomePage() {
  let apiStatus = "unreachable";

  try {
    const health = await getHealth();
    apiStatus = `${health.status} (${health.service})`;
  } catch {
    apiStatus = "offline";
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-[#2D2B2B] dark:text-[#F1E7DF]">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-16 text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-[#B9AAA0]">
          DeepDaily
        </p>

        <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-6xl dark:text-[#FFF7F1]">
          Learn any topic deeply, one day at a time.
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg dark:text-[#D5C6BC]">
          DeepDaily turns any topic into a structured learning path with clear
          explanations, curated resources, and guided next steps.
        </p>

        <TopicGeneratorForm />

        {/* <div className="mt-8 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 dark:border-[#4C4541] dark:bg-[#3A3533] dark:text-[#D8C9BF]">
          API status:{" "}
          <span className="font-medium text-slate-900 dark:text-[#FFF7F1]">
            {apiStatus}
          </span>
        </div> */}
      </section>
    </main>
  );
}