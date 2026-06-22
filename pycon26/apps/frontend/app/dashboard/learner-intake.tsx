"use client";

import { FormEvent, useState } from "react";

import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";

type LearnerAnalysis = {
  similar_matches: Array<{
    id: string;
    score: number;
    payload: {
      role?: string;
      skill?: string;
      description?: string;
      document?: string;
      skills?: string[];
      source?: string;
    };
  }>;
  recommendation: {
    next_roles: string[];
    priority_skills: string[];
    actions_today: string[];
    explanation: string;
  };
  llm_provider: string;
};

type ResumeUploadResult = {
  current_role: string;
  skillset: string;
  compressed_resume_text: string;
  raw_text_chars: number;
  llm_provider: string;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export function LearnerIntake() {
  const [analysis, setAnalysis] = useState<LearnerAnalysis | null>(null);
  const [currentRole, setCurrentRole] = useState("");
  const [targetInterest, setTargetInterest] = useState("");
  const [skillset, setSkillset] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [error, setError] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const payload = {
      current_role: currentRole,
      target_interest: targetInterest,
      skillset,
      resume_text: resumeText,
    };

    try {
      const response = await fetch(`${apiBaseUrl}/learner/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Unable to analyse this profile yet.");
      }

      setAnalysis((await response.json()) as LearnerAnalysis);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResumeUpload(file: File | undefined) {
    if (!file) {
      return;
    }

    setError("");
    setUploadStatus("");
    setIsUploadingResume(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${apiBaseUrl}/learner/resume/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Unable to extract profile fields from this resume.");
      }

      const result = (await response.json()) as ResumeUploadResult;
      setCurrentRole(result.current_role);
      setSkillset(result.skillset);
      setResumeText(result.compressed_resume_text);
      setUploadStatus(`Resume processed from ${result.raw_text_chars.toLocaleString()} characters.`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Resume upload failed.");
    } finally {
      setIsUploadingResume(false);
    }
  }

  return (
    <section className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,420px)_1fr]">
      <Card>
        <CardHeader>
          <p className="text-sm font-bold uppercase text-teal-900">Profile input</p>
          <CardTitle>Share your skills or resume.</CardTitle>
          <CardDescription>
            Upload a PDF resume or enter your profile details to generate role and skill guidance.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <Label>
              Upload resume PDF
              <Input
                accept="application/pdf"
                className="flex cursor-pointer items-center py-2 file:mr-3 file:min-h-8 file:cursor-pointer file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-bold file:text-slate-700 file:transition hover:file:bg-slate-200 focus:file:bg-slate-200"
                disabled={isUploadingResume}
                type="file"
                onChange={(event) => handleResumeUpload(event.target.files?.[0])}
              />
            </Label>
            {isUploadingResume ? (
              <p className="text-sm font-bold text-teal-900">Extracting resume profile...</p>
            ) : null}
            {uploadStatus ? <p className="text-sm text-slate-600">{uploadStatus}</p> : null}
            <Label>
              Current role
              <Input
                name="current-role"
                placeholder="e.g. Customer Support Specialist"
                value={currentRole}
                onChange={(event) => setCurrentRole(event.target.value)}
              />
            </Label>
            <Label>
              Target interest
              <Input
                name="target-interest"
                placeholder="e.g. Data Analyst"
                value={targetInterest}
                onChange={(event) => setTargetInterest(event.target.value)}
              />
            </Label>
            <Label>
              Skillset
              <Textarea
                name="skillset"
                placeholder="e.g. SQL, Excel, Python basics, stakeholder interviews"
                value={skillset}
                onChange={(event) => setSkillset(event.target.value)}
              />
            </Label>
            <Label>
              Resume text
              <Textarea
                className="min-h-36"
                name="resume-text"
                placeholder="Paste resume summary, work history, projects, or learning notes"
                value={resumeText}
                onChange={(event) => setResumeText(event.target.value)}
              />
            </Label>

            {error ? <p className="text-sm font-bold text-red-700">{error}</p> : null}

            <Button className="w-full" disabled={isSubmitting || isUploadingResume} type="submit">
              {isSubmitting ? "Analysing..." : "Analyse profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        {analysis ? (
          <CardContent className="grid gap-6">
            <ResultList title="Where can I go next?" values={analysis.recommendation.next_roles} />
            <ResultList
              title="What skills matter most?"
              values={analysis.recommendation.priority_skills}
            />
            <ResultList
              title="What should I do today?"
              values={analysis.recommendation.actions_today}
            />

            <div>
              <h3 className="text-lg font-bold text-slate-900">Similarity evidence</h3>
              <div className="mt-3 grid gap-3">
                {analysis.similar_matches.map((match) => (
                  <Card className="p-3" key={match.id}>
                    <p className="font-bold text-slate-900">
                      {match.payload.role ?? match.payload.skill ?? match.id}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {evidenceDescription(match.payload)}
                    </p>
                    <p className="mt-2 text-xs font-bold uppercase text-teal-900">
                      Score {match.score.toFixed(2)}
                    </p>
                  </Card>
                ))}
              </div>
            </div>

            <CardDescription className="rounded-lg bg-slate-50 p-3">
              {analysis.recommendation.explanation}
            </CardDescription>
          </CardContent>
        ) : (
          <CardContent className="grid min-h-96 place-items-center text-center">
            <div>
              <p className="text-sm font-bold uppercase text-teal-900">Awaiting profile</p>
              <CardTitle className="mt-2">Your roadmap will appear here.</CardTitle>
              <CardDescription className="mt-2 max-w-lg">
                Submit skills or resume text to see mock role paths, skill priorities, daily
                actions, and similarity evidence.
              </CardDescription>
            </div>
          </CardContent>
        )}
      </Card>
    </section>
  );
}

function evidenceDescription(payload: LearnerAnalysis["similar_matches"][number]["payload"]) {
  return payload.description || payload.document || "No description available for this match.";
}

function ResultList({ title, values }: { title: string; values: string[] }) {
  return (
    <div>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      <ul className="mt-3 flex flex-wrap gap-2">
        {values.map((value) => (
          <li key={value}>
            <Badge>{value}</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
