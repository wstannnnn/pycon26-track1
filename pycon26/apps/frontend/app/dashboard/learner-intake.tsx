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
        throw new Error("Unable to analyze this profile yet.");
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
    <section className="mt-8 grid items-start gap-4 lg:grid-cols-[minmax(0,420px)_1fr]">
      <Card className="h-fit">
        <CardHeader>
          <p className="text-sm font-bold uppercase text-sky-700 dark:text-sky-200">Profile input</p>
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
                className="flex cursor-pointer items-center py-2 file:mr-3 file:min-h-8 file:cursor-pointer file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-bold file:text-slate-700 file:transition hover:file:bg-slate-200 focus:file:bg-slate-200 dark:file:bg-slate-800 dark:file:text-slate-100 dark:hover:file:bg-slate-700"
                disabled={isUploadingResume}
                type="file"
                onChange={(event) => handleResumeUpload(event.target.files?.[0])}
              />
            </Label>
            {isUploadingResume ? (
              <p className="text-sm font-bold text-sky-700 dark:text-sky-200">Extracting resume profile...</p>
            ) : null}
            {uploadStatus ? (
              <p className="text-sm text-slate-600 dark:text-slate-400">{uploadStatus}</p>
            ) : null}
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
              {isSubmitting ? "Analyzing..." : "Analyze profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        {analysis ? (
          <>
            <CardHeader>
              <p className="text-sm font-bold uppercase text-sky-700 dark:text-sky-200">
                Profile analysis
              </p>
              <CardTitle>Recommended next steps.</CardTitle>
              <CardDescription>
                Review the suggested roles, priority skills, and actions generated from your
                profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid gap-4 xl:grid-cols-3">
                <ResultList
                  title="Where can I go next?"
                  values={analysis.recommendation.next_roles}
                />
                <ResultList
                  title="What skills matter most?"
                  values={analysis.recommendation.priority_skills}
                />
                <ResultList
                  title="What should I do today?"
                  values={analysis.recommendation.actions_today}
                />
              </div>

              <CardDescription className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
                {analysis.recommendation.explanation}
              </CardDescription>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Similarity evidence
                </h3>
                <div className="mt-3 divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                  {analysis.similar_matches.map((match) => (
                    <div className="p-4" key={match.id}>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {match.payload.role ?? match.payload.skill ?? match.id}
                        </p>
                        <ScoreBar score={match.score} />
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                        {evidenceDescription(match.payload)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </>
        ) : (
          <CardContent className="grid min-h-96 place-items-center text-center">
            <div>
              <p className="text-sm font-bold uppercase text-sky-700 dark:text-sky-200">Awaiting profile</p>
              <CardTitle className="mt-2">Your roadmap will appear here.</CardTitle>
              <CardDescription className="mt-2 max-w-lg">
                Upload a resume PDF or fill in your role, target interest, skills, and resume text
                to generate skill priorities, next actions, and similarity evidence.
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

function ScoreBar({ score }: { score: number }) {
  const percent = Math.max(0, Math.min(100, Math.round(score * 100)));

  return (
    <div className="w-full shrink-0 sm:w-36">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase text-sky-700 dark:text-sky-200">Match</span>
        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
          {score.toFixed(2)}
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-slate-800 dark:bg-sky-400"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function ResultList({ title, values }: { title: string; values: string[] }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
      <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
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
