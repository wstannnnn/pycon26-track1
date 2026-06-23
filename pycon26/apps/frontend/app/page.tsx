import Link from "next/link";

import { card, intro, pageShell, primaryButton, secondaryButton } from "./styles";
import { ThemeToggle } from "./dashboard/theme-toggle";

const questions = [
  {
    title: "Where can I go next?",
    body: "Explore adjacent roles, career pathways, and credible transitions from a learner's current experience.",
  },
  {
    title: "What skills matter most?",
    body: "Map target roles to high-signal skills, evidence sources, and importance scores.",
  },
  {
    title: "What should I do today?",
    body: "Turn skills gaps into practical next actions, learning steps, and reskilling recommendations.",
  },
];

export default function Home() {
  return (
    <main className={pageShell}>
      <div className="mb-4 flex justify-end">
        <ThemeToggle />
      </div>
      <section className="relative overflow-hidden rounded-lg bg-slate-950 px-5 py-8 text-white md:px-8 md:py-10">
        <div
          className="absolute inset-0 bg-[linear-gradient(135deg,rgba(15,23,42,0.94),rgba(14,165,233,0.36)),url('/images/career-pathway-hero.png')] bg-cover bg-center"
          aria-hidden="true"
        />
        <div className="relative z-10 grid min-h-[420px] items-end">
          <div className="max-w-4xl pb-8">
            <p className="m-0 text-sm font-bold uppercase text-sky-100">Job and Skills Track</p>
            <h1 className="m-0 mt-4 max-w-4xl text-5xl leading-none text-white drop-shadow-md md:text-7xl">
              Career direction, skill priorities, and next actions.
            </h1>
            <p className={`${intro} mt-5 text-white drop-shadow-sm`}>
              Build grounded pathway explorers, role-to-skill maps, skills-gap analyzers,
              recommendation engines, learning roadmaps, and explainable dashboards.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link className={primaryButton} href="/login">
                Log in
              </Link>
              <Link className={secondaryButton} href="/register">
                Create account
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3" aria-label="Product questions">
        {questions.map((question) => (
          <article className={card} key={question.title}>
            <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">
              {question.title}
            </h2>
            <p className="m-0 leading-6 text-slate-600 dark:text-slate-400">{question.body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
