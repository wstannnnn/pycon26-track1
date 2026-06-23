import Link from "next/link";

import { card, eyebrow, heroTitle, intro, pageShell, primaryButton, secondaryButton } from "./styles";

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
      <section className="grid gap-6">
        <p className={eyebrow}>Job and Skills Track</p>
        <h1 className={heroTitle}>Career direction, skill priorities, and next actions.</h1>
        <p className={intro}>
          Build grounded pathway explorers, role-to-skill maps, skills-gap analyzers,
          recommendation engines, learning roadmaps, and explainable dashboards.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link className={primaryButton} href="/login">
            Log in
          </Link>
          <Link className={secondaryButton} href="/register">
            Create account
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3" aria-label="Product questions">
        {questions.map((question) => (
          <article className={card} key={question.title}>
            <h2 className="mb-3 text-lg font-bold text-slate-900">{question.title}</h2>
            <p className="m-0 leading-6 text-slate-600">{question.body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
