import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import { dashboardShell, eyebrow, heroTitle, intro } from "../styles";
import { LearnerIntake } from "./learner-intake";
import { LogoutButton } from "./logout-button";
import { PathwayGenerator } from "./pathway-generator";

const questions = [
  {
    prompt: "Where can I go next?",
    title: "Pathway explorer",
    body: "Compare adjacent roles, progression paths, transition effort, and evidence for each suggested move.",
  },
  {
    prompt: "What skills matter most?",
    title: "Role-to-skill map",
    body: "Prioritise skills by demand, transferability, learner goals, and credible labour-market signals.",
  },
  {
    prompt: "What should I do today?",
    title: "Action roadmap",
    body: "Convert gaps into learning tasks, practice projects, courses, and measurable next steps.",
  },
];

const modules = [
  "Skills-gap analyser",
  "Reskilling recommendation engine",
  "Personalised learning roadmap",
  "Explainable evidence dashboard",
];

export default function DashboardPage() {
  return (
    <main className={dashboardShell}>
      <section className="grid items-start gap-8 md:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <p className={eyebrow}>Learner dashboard</p>
          <h1 className={heroTitle}>Your career direction cockpit.</h1>
          <p className={intro}>
            Start with a current role, a target role, or a skill you want to grow. Each
            recommendation should stay grounded in credible data and explain why it matters.
          </p>
        </div>
        <div className="grid gap-3">
          <LogoutButton />
          <PathwayGenerator />
        </div>
      </section>

      <LearnerIntake />

      <section className="mt-8 grid gap-4 md:grid-cols-3" aria-label="Learner questions">
        {questions.map((question) => (
          <Card className="min-h-56" key={question.prompt}>
            <CardContent>
              <p className="mb-2.5 text-sm font-bold text-teal-900">{question.prompt}</p>
              <h2 className="mb-3 text-lg font-bold text-slate-900">{question.title}</h2>
              <p className="m-0 leading-6 text-slate-600">{question.body}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mt-6 flex flex-wrap gap-2.5" aria-label="Build modules">
        {modules.map((module) => (
          <Badge key={module}>{module}</Badge>
        ))}
      </section>
    </main>
  );
}
