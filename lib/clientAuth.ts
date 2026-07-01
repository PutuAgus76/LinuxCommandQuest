"use client";

// Simple client-side auth helpers for development/mock mode

const TOKEN_KEY = "linux-quest:auth-token";
const USERNAME_KEY = "linux-quest:linux-username";

export function getClientToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setClientToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  // Extract username from mock token if applicable
  const match = token.match(/^mock_user_([a-z0-9_-]{3,20})$/);
  if (match) {
    localStorage.setItem(USERNAME_KEY, match[1]);
  }
  window.dispatchEvent(new Event("auth-state-change"));
}

export function getLinuxUsername(): string {
  if (typeof window === "undefined") return "guest";
  return localStorage.getItem(USERNAME_KEY) || "guest";
}

export function setLinuxUsername(username: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USERNAME_KEY, username);
  // Keep token synced if it was mock
  const token = getClientToken();
  if (token && token.startsWith("mock_user_")) {
    localStorage.setItem(TOKEN_KEY, `mock_user_${username}`);
  }
  window.dispatchEvent(new Event("auth-state-change"));
}

export function logoutClient(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
  window.dispatchEvent(new Event("auth-state-change"));
}
