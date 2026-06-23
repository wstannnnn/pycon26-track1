"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";

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
      record_type?: string;
      skills?: string[];
      track?: string;
      tracks?: string[];
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
const targetInterestPattern = "[A-Za-z0-9 +#&/.,()'-]*[A-Za-z][A-Za-z0-9 +#&/.,()'-]*";

export function LearnerIntake() {
  const [analysis, setAnalysis] = useState<LearnerAnalysis | null>(null);
  const [currentRole, setCurrentRole] = useState("");
  const [targetInterest, setTargetInterest] = useState("");
  const [skillset, setSkillset] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [selectedResumeFileName, setSelectedResumeFileName] = useState("No file selected");
  const [error, setError] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const currentSkillSignals = extractSkillSignals(skillset);
  const missingPrioritySkills = analysis
    ? findMissingSkills(analysis.recommendation.priority_skills, currentSkillSignals)
    : [];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const targetInterestValidationError = validateTargetInterest(targetInterest);
    if (targetInterestValidationError) {
      setError(targetInterestValidationError);
      return;
    }

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
        throw new Error(await responseErrorMessage(response, "Unable to analyze this profile yet."));
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

    setSelectedResumeFileName(file.name);
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
            <div className="grid gap-2">
              <span className="text-sm font-bold leading-none text-slate-900 dark:text-slate-100">
                Upload resume PDF
              </span>
              <div className="flex min-h-11 items-center gap-4 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
                <label
                  className="inline-flex min-h-8 shrink-0 cursor-pointer items-center rounded-md bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                  htmlFor="resume-upload"
                >
                  Choose file
                </label>
                <span className="min-w-0 flex-1 truncate text-slate-600 dark:text-slate-300">
                  {selectedResumeFileName}
                </span>
                <input
                  id="resume-upload"
                  accept="application/pdf"
                  className="sr-only"
                  disabled={isUploadingResume}
                  type="file"
                  onChange={(event) => handleResumeUpload(event.target.files?.[0])}
                />
              </div>
            </div>
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
              <span>
                Target interest <span className="text-red-600 dark:text-red-400">*</span>
              </span>
              <Input
                required
                aria-required="true"
                name="target-interest"
                minLength={3}
                maxLength={160}
                pattern={targetInterestPattern}
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

            <Button
              className="w-full dark:bg-sky-400 dark:text-white dark:hover:bg-sky-300 dark:focus-visible:ring-sky-300"
              disabled={isSubmitting || isUploadingResume}
              type="submit"
            >
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
              <div className="grid gap-3">
                <SkillSignalPanel
                  title="Current skill signals"
                  emptyText="Add skills or upload a resume to show current skill signals."
                  values={currentSkillSignals}
                />
                <SkillSignalPanel
                  title="Skill gaps to close"
                  emptyText="No obvious gaps found against the priority skills."
                  values={missingPrioritySkills}
                />
              </div>

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
                          {match.payload.skill ?? match.payload.role ?? match.id}
                        </p>
                        <ScoreBar score={match.score} />
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                        {evidenceDescription(match.payload)}
                      </p>
                      <EvidenceMeta payload={match.payload} />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </>
        ) : (
          <CardContent className="grid min-h-96 place-items-center text-center">
            <div>
              <Image
                alt=""
                aria-hidden="true"
                className="mx-auto mb-4 h-32 w-32 object-contain"
                height={128}
                src="/images/profile-empty-state.png"
                width={128}
              />
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

async function responseErrorMessage(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { detail?: unknown };
    return typeof payload.detail === "string" ? payload.detail : fallback;
  } catch {
    return fallback;
  }
}

function evidenceDescription(payload: LearnerAnalysis["similar_matches"][number]["payload"]) {
  return payload.description || payload.document || "No description available for this match.";
}

function EvidenceMeta({ payload }: { payload: LearnerAnalysis["similar_matches"][number]["payload"] }) {
  const track = payload.track || payload.tracks?.[0] || "";
  const meta = [
    formatRecordType(payload.record_type),
    track ? `Track: ${track}` : "",
  ].filter(Boolean);

  if (!meta.length) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {meta.map((item) => (
        <Badge
          className="rounded-md border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          key={item}
        >
          {item}
        </Badge>
      ))}
    </div>
  );
}

function validateTargetInterest(value: string) {
  const targetInterest = value.trim();
  if (targetInterest.length < 3) {
    return "Enter a target interest with at least 3 characters.";
  }
  if (!/[A-Za-z]/.test(targetInterest)) {
    return "Target interest must include a role or skill name.";
  }
  if (!new RegExp(`^${targetInterestPattern}$`).test(targetInterest)) {
    return "Target interest can only include letters, numbers, spaces, and common role-title punctuation.";
  }
  return "";
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
          <li className="max-w-full" key={value}>
            <Badge className="max-w-full whitespace-normal break-words rounded-md p-2 text-left leading-6">
              {value}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SkillSignalPanel({
  emptyText,
  title,
  values,
}: {
  emptyText: string;
  title: string;
  values: string[];
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-3.5 dark:bg-slate-950">
      <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
      {values.length ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {values.map((value) => (
            <li className="max-w-full" key={value}>
              <Badge className="max-w-full whitespace-normal break-words rounded-md p-2 text-left leading-6">
                {value}
              </Badge>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1.5 text-sm leading-6 text-emerald-700 dark:text-emerald-300">
          {emptyText}
        </p>
      )}
    </div>
  );
}

function extractSkillSignals(value: string) {
  return value
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function findMissingSkills(prioritySkills: string[], currentSkills: string[]) {
  const current = currentSkills.map(normalizeSkill);
  return prioritySkills.filter((skill) => {
    const normalized = normalizeSkill(skill);
    return !current.some(
      (currentSkill) => currentSkill.includes(normalized) || normalized.includes(currentSkill),
    );
  });
}

function normalizeSkill(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9+#]+/g, " ").trim();
}

function formatRecordType(value: string | undefined) {
  if (!value) {
    return "";
  }
  return value
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
