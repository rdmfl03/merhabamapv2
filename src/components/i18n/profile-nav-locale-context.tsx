"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { AppLocale } from "@/i18n/routing";

const ProfileNavLocaleContext = createContext<AppLocale | null>(null);

/**
 * When set (logged-in user), all {@link NavLink} navigations use this locale prefix,
 * so a temporary UI language (URL `/tr/...`) resets to profile language on the next in-app link.
 * `null` for guests → links follow the current URL locale.
 */
export function ProfileNavLocaleProvider({
  value,
  children,
}: {
  value: AppLocale | null;
  children: ReactNode;
}) {
  return (
    <ProfileNavLocaleContext.Provider value={value}>{children}</ProfileNavLocaleContext.Provider>
  );
}

export function useProfileNavLocale() {
  return useContext(ProfileNavLocaleContext);
}
