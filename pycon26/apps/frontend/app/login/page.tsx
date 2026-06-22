"use client";

import Link from "next/link";
import { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { authTitle, compactIntro, eyebrow, formInput, formLabel, primaryButton } from "../styles";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(formData.get("email") ?? ""),
          password: String(formData.get("password") ?? ""),
        }),
      });

      if (!response.ok) {
        throw new Error("Invalid email or password.");
      }

      router.push("/dashboard");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to log in.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-8">
      <section
        className="w-[min(100%,460px)] rounded-lg border border-slate-200 bg-white p-6 md:p-8"
        aria-labelledby="login-title"
      >
        <p className={eyebrow}>Welcome back</p>
        <h1 className={authTitle} id="login-title">
          Log in to Job and Skills Track.
        </h1>
        <p className={compactIntro}>
          Continue to your career pathway explorer, skill priorities, and next action plan.
        </p>

        <form className="mt-7 grid gap-4" onSubmit={handleSubmit}>
          <label className={formLabel}>
            Email
            <input className={formInput} name="email" type="email" autoComplete="email" required />
          </label>
          <label className={formLabel}>
            Password
            <input
              className={formInput}
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <div className="flex flex-col gap-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <label className="inline-flex items-center gap-2">
              <input className="size-4" name="remember" type="checkbox" />
              Remember me
            </label>
            <Link className="font-bold text-teal-900" href="/forgot-password">
              Forgot password?
            </Link>
          </div>
          {error ? <p className="text-sm font-bold text-red-700">{error}</p> : null}
          <button className={`${primaryButton} w-full`} disabled={isSubmitting} type="submit">
            {isSubmitting ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-slate-600">
          New here?{" "}
          <Link className="font-bold text-teal-900" href="/register">
            Create an account
          </Link>
        </p>
      </section>
    </main>
  );
}
