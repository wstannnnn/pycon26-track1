"use client";

import Link from "next/link";
import { FormEvent } from "react";
import { useRouter } from "next/navigation";

import { authTitle, compactIntro, eyebrow, formInput, formLabel, primaryButton } from "../styles";

export default function ForgotPasswordPage() {
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push("/login");
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-8">
      <section
        className="w-[min(100%,460px)] rounded-lg border border-slate-200 bg-white p-6 md:p-8"
        aria-labelledby="reset-title"
      >
        <p className={eyebrow}>Password reset</p>
        <h1 className={authTitle} id="reset-title">
          Recover access to your account.
        </h1>
        <p className={compactIntro}>
          Enter your email and we will send password reset instructions when authentication is wired.
        </p>

        <form className="mt-7 grid gap-4" onSubmit={handleSubmit}>
          <label className={formLabel}>
            Email
            <input className={formInput} name="email" type="email" autoComplete="email" required />
          </label>
          <button className={`${primaryButton} w-full`} type="submit">
            Send reset link
          </button>
        </form>

        <p className="mt-6 text-center text-slate-600">
          Remembered it?{" "}
          <Link className="font-bold text-teal-900" href="/login">
            Back to login
          </Link>
        </p>
      </section>
    </main>
  );
}
