"use client";

import Link from "next/link";
import { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { authTitle, compactIntro, eyebrow, formInput, formLabel, primaryButton } from "../styles";
import { ThemeToggle } from "../dashboard/theme-toggle";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirm-password") ?? "");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: String(formData.get("name") ?? ""),
          email: String(formData.get("email") ?? ""),
          password,
        }),
      });

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error("An account with this email already exists.");
        }

        throw new Error("Unable to create account.");
      }

      router.push("/login");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to create account.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  }

  return (
    <main className="relative grid min-h-screen place-items-center px-4 py-8">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <section
        className="w-[min(100%,460px)] rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8"
        aria-labelledby="register-title"
      >
        <p className={eyebrow}>Start learning with direction</p>
        <h1 className={authTitle} id="register-title">
          Create your learner account.
        </h1>
        <p className={compactIntro}>
          Set up a profile for role exploration, skills-gap analysis, and learning roadmaps.
        </p>

        <form className="mt-7 grid gap-4" onSubmit={handleSubmit}>
          <label className={formLabel}>
            Full name
            <input className={formInput} name="name" type="text" autoComplete="name" required />
          </label>
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
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
          <label className={formLabel}>
            Confirm password
            <input
              className={formInput}
              name="confirm-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
          {error ? (
            <p className="text-sm font-bold text-red-700" role="alert">
              {error}
            </p>
          ) : null}
          <button className={`${primaryButton} w-full`} disabled={isSubmitting} type="submit">
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
          <button
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-5 font-bold text-slate-800 transition hover:border-slate-800 focus-visible:ring-4 focus-visible:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-sky-100 dark:hover:border-sky-400"
            type="button"
            onClick={handleBack}
          >
            Go back
          </button>
        </form>

        <p className="mt-6 text-center text-slate-600 dark:text-slate-300">
          Already have an account?{" "}
          <Link className="font-bold text-sky-700 dark:text-sky-200" href="/login">
            Log in
          </Link>
        </p>
      </section>
    </main>
  );
}
