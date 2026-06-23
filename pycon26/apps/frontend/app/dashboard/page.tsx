import { cookies } from "next/headers";

import { authEmailCookieName } from "@/lib/auth";

import { dashboardShell, intro } from "../styles";
import { DashboardTabs } from "./dashboard-tabs";
import { LogoutButton } from "./logout-button";
import { ThemeToggle } from "./theme-toggle";
import { UserProfile } from "./user-profile";

const heroSignals = ["Skills graph", "Role signals", "Learning actions"];

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const email = cookieStore.get(authEmailCookieName)?.value;
  const displayEmail = email ? decodeURIComponent(email) : "john.doe@johndoe.com";

  return (
    <main className={dashboardShell}>
      <header className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="m-0 text-xs font-bold uppercase text-sky-700 dark:text-sky-200">
            Career planning
          </p>
          <h2 className="m-0 mt-1 text-xl font-bold text-slate-900 dark:text-white">
            Pathway Hub
          </h2>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
          <ThemeToggle />
          <UserProfile email={displayEmail} />
          <LogoutButton size="sm" />
        </div>
      </header>

      <section className="relative overflow-hidden rounded-lg bg-slate-950 px-5 py-5 text-white md:px-8 md:py-6">
        <div
          className="absolute inset-0 bg-[linear-gradient(135deg,rgba(15,23,42,0.92),rgba(14,165,233,0.34)),url('/images/career-pathway-hero.png')] bg-cover bg-center"
          aria-hidden="true"
        />
        <div
          className="absolute -left-24 bottom-0 size-72 rounded-full bg-cyan-400/25 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute right-10 top-8 h-px w-48 bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent shadow-[0_0_24px_rgba(34,211,238,0.75)]"
          aria-hidden="true"
        />
        <div className="relative z-10 grid min-h-64 max-w-3xl items-end">
          <div className="self-end pb-8 md:pb-10">
            <div className="mb-4 flex flex-wrap gap-2">
              {heroSignals.map((signal) => (
                <span
                  className="rounded-full border border-cyan-200/70 bg-cyan-300/15 px-3 py-1 text-xs font-bold text-white shadow-[0_0_18px_rgba(34,211,238,0.28)] backdrop-blur"
                  key={signal}
                >
                  {signal}
                </span>
              ))}
            </div>
            <h1 className="m-0 mt-3 max-w-3xl text-4xl leading-none text-white drop-shadow-md md:text-6xl">
              Plan your next career move.
            </h1>
            <p className={`${intro} mt-4 text-white drop-shadow-sm`}>
              Start with a current role, a target role, or a skill you want to grow. Each
              recommendation should stay grounded in credible data and explain why it matters.
            </p>
          </div>
        </div>
      </section>

      <DashboardTabs />
    </main>
  );
}
