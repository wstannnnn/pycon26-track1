"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PathwayLevel = {
  level: number;
  stage: string;
  title: string;
  focus: string;
  actions: string[];
};

type CareerPathway = {
  pathway_name: string;
  levels: PathwayLevel[];
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export function PathwayGenerator() {
  const [pathway, setPathway] = useState<CareerPathway | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch(`${apiBaseUrl}/roles/pathway`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_role: String(formData.get("current-role") ?? ""),
          target_interest: String(formData.get("target-interest") ?? ""),
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to generate a pathway yet.");
      }

      setPathway((await response.json()) as CareerPathway);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,420px)_1fr]">
      <Card className="h-fit">
        <CardHeader>
          <p className="text-sm font-bold uppercase text-sky-700 dark:text-sky-200">Pathway explorer</p>
          <CardTitle>Generate a role pathway.</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3.5" onSubmit={handleSubmit}>
            <Label>
              Current role
              <Input name="current-role" placeholder="e.g. Customer Support Specialist" />
            </Label>
            <Label>
              Target interest
              <Input name="target-interest" placeholder="e.g. Data Analyst" />
            </Label>
            {error ? (
              <p className="text-sm font-bold text-red-700" role="alert">
                {error}
              </p>
            ) : null}
            <Button className="w-full" disabled={isSubmitting} type="submit">
              {isSubmitting ? (
                <>
                  <span
                    className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                    aria-hidden="true"
                  />
                  Generating...
                </>
              ) : (
                "Generate pathway"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        {pathway ? (
          <>
            <CardHeader>
              <CardTitle className="text-lg">{pathway.pathway_name}</CardTitle>
              <CardDescription>
                {pathway.levels.length} steps from your current role toward the target path.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="grid gap-6">
                {pathway.levels.map((level) => (
                  <li
                    className="relative border-l border-slate-300 pb-1 pl-8 dark:border-slate-700"
                    key={level.level}
                  >
                    <span
                      className="absolute -left-3 top-0 grid size-6 place-items-center rounded-full bg-slate-800 text-xs font-bold text-white dark:bg-sky-500"
                      aria-hidden="true"
                    >
                      {level.level}
                    </span>
                    <p className="text-xs font-bold uppercase text-sky-700 dark:text-sky-200">
                      {level.stage}
                    </p>
                    <h2 className="mt-1 font-bold text-slate-900 dark:text-white">
                      {level.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                      {level.focus}
                    </p>
                    {level.actions.length ? (
                      <ul className="mt-3 grid gap-1.5">
                        {level.actions.map((action) => (
                          <li
                            className="text-sm leading-6 text-slate-600 dark:text-slate-300"
                            key={action}
                          >
                            {action}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ol>
            </CardContent>
          </>
        ) : (
          <CardContent className="grid min-h-72 place-items-center text-center">
            <div>
              <p className="text-sm font-bold uppercase text-sky-700 dark:text-sky-200">Awaiting pathway</p>
              <CardTitle className="mt-2">Your progression map will appear here.</CardTitle>
              <CardDescription className="mt-2 max-w-lg">
                Enter your current role and target interest to generate a step-by-step pathway.
              </CardDescription>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
