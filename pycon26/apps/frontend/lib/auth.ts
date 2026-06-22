export const authCookieName = "job_skills_auth";

export function setAuthCookie(remember: boolean) {
  const maxAge = remember ? "; max-age=2592000" : "";
  document.cookie = `${authCookieName}=1; path=/; samesite=lax${maxAge}`;
}

export function clearAuthCookie() {
  document.cookie = `${authCookieName}=; path=/; samesite=lax; max-age=0`;
}
