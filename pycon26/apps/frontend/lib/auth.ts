export const authCookieName = "job_skills_auth";
export const authEmailCookieName = "job_skills_email";
export const authUserStorageKey = "job_skills_user";

export type AuthUser = {
  email: string;
  fullName?: string;
};

export function setAuthCookie(remember: boolean) {
  const maxAge = remember ? "; max-age=2592000" : "";
  document.cookie = `${authCookieName}=1; path=/; samesite=lax${maxAge}`;
}

export function clearAuthCookie() {
  document.cookie = `${authCookieName}=; path=/; samesite=lax; max-age=0`;
  document.cookie = `${authEmailCookieName}=; path=/; samesite=lax; max-age=0`;
}

export function setAuthUser(user: AuthUser, remember: boolean) {
  const maxAge = remember ? "; max-age=2592000" : "";

  window.localStorage.setItem(authUserStorageKey, JSON.stringify(user));
  document.cookie = `${authEmailCookieName}=${encodeURIComponent(user.email)}; path=/; samesite=lax${maxAge}`;
}

export function getAuthUser() {
  const rawUser = window.localStorage.getItem(authUserStorageKey);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as AuthUser;
  } catch {
    window.localStorage.removeItem(authUserStorageKey);
    return null;
  }
}

export function clearAuthUser() {
  window.localStorage.removeItem(authUserStorageKey);
}
