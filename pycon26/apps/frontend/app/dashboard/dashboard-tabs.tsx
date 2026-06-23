"use client";

import { useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { LearnerIntake } from "./learner-intake";
import { PathwayGenerator } from "./pathway-generator";

const tabs = [
  {
    id: "pathway",
    label: "Explore Pathways",
  },
  {
    id: "analysis",
    label: "Analyze My Profile",
  },
] as const;

type DashboardTab = (typeof tabs)[number]["id"];

const questions: Array<{
  prompt: string;
  title: string;
  body: string;
}> = [
  {
    prompt: "Where can I go next?",
    title: "Pathway explorer",
    body: "Compare adjacent roles, progression paths, transition effort, and evidence for each suggested move.",
  },
  {
    prompt: "What skills matter most?",
    title: "Role-to-skill map",
    body: "Prioritize skills by demand, transferability, learner goals, and credible labor-market signals.",
  },
  {
    prompt: "What should I do today?",
    title: "Action roadmap",
    body: "Convert gaps into learning tasks, practice projects, courses, and measurable next steps.",
  },
];

export function DashboardTabs() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("pathway");

  return (
    <>
      <section className="mt-8 grid gap-4 md:grid-cols-3" aria-label="Learner questions">
        {questions.map((question) => (
          <article
            className="min-h-40 rounded-lg border border-slate-200 bg-white p-5 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            key={question.prompt}
          >
            <p className="mb-2.5 text-sm font-bold text-sky-700 dark:text-sky-200">
              {question.prompt}
            </p>
            <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">
              {question.title}
            </h2>
            <p className="m-0 leading-6 text-slate-600 dark:text-slate-400">{question.body}</p>
          </article>
        ))}
      </section>

      <section className="mt-8">
        <div className="mb-4 grid gap-1 pl-1 sm:pl-2">
          <p className="m-0 text-xs font-bold uppercase leading-none text-sky-700 dark:text-sky-200">
            Choose a starting point
          </p>
          <h2 className="m-0 text-2xl font-bold leading-tight text-slate-900 dark:text-white">
            What would you like to do?
          </h2>
        </div>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as DashboardTab)}>
          <TabsList aria-label="Dashboard tools">
            {tabs.map((tab) => (
              <TabsTrigger
                id={`${tab.id}-tab`}
                key={tab.id}
                value={tab.id}
                aria-controls={`${tab.id}-panel`}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent id="pathway-panel" value="pathway" aria-labelledby="pathway-tab">
            <PathwayGenerator />
          </TabsContent>
          <TabsContent id="analysis-panel" value="analysis" aria-labelledby="analysis-tab">
            <LearnerIntake />
          </TabsContent>
        </Tabs>
      </section>
    </>
  );
}
