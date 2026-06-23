async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    throw new Error(
      "Playwright is required to capture snapshots. Install it with `npm install playwright`.",
    );
  }
}

const playwright = await loadPlaywright();
const { chromium } = playwright.default ?? playwright;

const frontendUrl = "http://localhost:3000";
const backendUrl = "http://127.0.0.1:8000";
const outputDir = new URL("./", import.meta.url).pathname;
const demoUser = {
  email: "snapshot@example.com",
  fullName: "Snapshot User",
  password: "snapshot-password",
};

async function ensureDemoUser() {
  const response = await fetch(`${backendUrl}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: demoUser.email,
      full_name: demoUser.fullName,
      password: demoUser.password,
    }),
  });

  if (!response.ok && response.status !== 409) {
    throw new Error(`Unable to create demo user: ${response.status} ${await response.text()}`);
  }
}

async function screenshot(page, name) {
  await page.screenshot({
    path: `${outputDir}${name}`,
    fullPage: true,
  });
}

async function main() {
  await ensureDemoUser();

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  });

  await page.goto(frontendUrl, { waitUntil: "networkidle" });
  await screenshot(page, "01-landing.png");

  await page.getByRole("link", { name: "Log in" }).click();
  await page.waitForURL("**/login");
  await screenshot(page, "02-login.png");

  await page.getByLabel("Email").fill(demoUser.email);
  await page.getByLabel("Password").fill(demoUser.password);
  await screenshot(page, "03-login-filled.png");

  await page.context().addCookies([
    {
      name: "job_skills_auth",
      value: "1",
      domain: "localhost",
      path: "/",
      sameSite: "Lax",
    },
    {
      name: "job_skills_email",
      value: encodeURIComponent(demoUser.email),
      domain: "localhost",
      path: "/",
      sameSite: "Lax",
    },
  ]);
  await page.goto(`${frontendUrl}/dashboard`, { waitUntil: "networkidle" });
  await screenshot(page, "04-dashboard-pathway-empty.png");

  await page.locator('#pathway-panel input[name="current-role"]').fill("Customer Support Specialist");
  await page.locator('#pathway-panel input[name="target-interest"]').fill("Data Analyst");
  await page.getByRole("button", { name: "Generate pathway" }).click();
  await page.getByText("Data Analyst pathway", { exact: false }).waitFor({ timeout: 30000 });
  await screenshot(page, "05-pathway-result.png");

  await page.getByRole("tab", { name: "Analyze My Profile" }).click();
  await page.getByText("Your roadmap will appear here.").waitFor({ timeout: 10000 });
  await screenshot(page, "06-profile-analysis-empty.png");

  await page.locator('#analysis-panel input[name="current-role"]').fill("Customer Support Specialist");
  await page.locator('#analysis-panel input[name="target-interest"]').fill("Data Analyst");
  await page.locator('#analysis-panel textarea[name="skillset"]').fill(
    "Excel, SQL basics, customer support reporting, stakeholder communication",
  );
  await page.locator('#analysis-panel textarea[name="resume-text"]').fill(
    "Supported customer operations, prepared weekly reports, investigated ticket trends, and coordinated with product teams.",
  );
  await screenshot(page, "07-profile-analysis-form.png");

  await Promise.all([
    page.waitForResponse(
      (response) => response.url().includes("/learner/analyze") && response.status() === 200,
      { timeout: 120000 },
    ),
    page.getByRole("button", { name: "Analyze profile" }).click(),
  ]);
  await page.waitForTimeout(2000);
  await screenshot(page, "08-profile-analysis-result.png");

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
