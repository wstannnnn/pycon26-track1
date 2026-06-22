"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
    <div className="grid gap-3">
      <Card>
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

      {pathway ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{pathway.pathway_name}</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="grid gap-3">
              {pathway.levels.map((level) => (
                <li className="border-l-2 border-teal-700 pl-3" key={level.level}>
                  <p className="text-xs font-bold uppercase text-teal-900">
                    {level.level}. {level.stage}
                  </p>
                  <h2 className="mt-1 font-bold text-slate-900">{level.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{level.focus}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
