// apps/web/app/page.tsx

import { getHealth } from "@/lib/api";
import PageShell from "@/components/page-shell";
import AppFooter from "@/components/app-footer";
import RotatingHeadline from "@/components/rotating-headline";
import HomePageClient from "@/components/home-page-client";

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
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 pt-4 pb-4 text-center sm:min-h-[calc(100vh-6rem)]">
        <div className="animate-[fadeUp_0.5s_ease-out_forwards]">
          <p className="dd-accent-text mb-3 text-sm font-semibold uppercase tracking-[0.24em]">
            DeepDaily
          </p>
        </div>

        <div className="animate-[fadeUp_0.6s_ease-out_forwards]">
          <RotatingHeadline />
        </div>

        <div className="animate-[fadeUp_0.7s_ease-out_forwards]">
          <p className="max-w-2xl text-base leading-7 text-(--text-soft) sm:text-lg">
            DeepDaily turns any topic into a structured, day-by-day learning path —
            so you always know what to learn next and actually stay consistent.
          </p>
        </div>

        <div className="animate-[fadeUp_0.8s_ease-out_forwards]">
          <HomePageClient />
        </div>

        <div className="pt-6">
          <AppFooter />
        </div>
      </section>
    </PageShell>
  );
}