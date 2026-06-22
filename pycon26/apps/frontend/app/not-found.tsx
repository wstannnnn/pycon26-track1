import { eyebrow, heroTitle, intro, pageShell } from "./styles";

export default function NotFound() {
  return (
    <main className={pageShell}>
      <section className="grid gap-6">
        <p className={eyebrow}>Job and Skills Track</p>
        <h1 className={heroTitle}>Page not found.</h1>
        <p className={intro}>
          This pathway does not exist yet. Return to the home page to explore the starter
          experience.
        </p>
      </section>
    </main>
  );
}
