"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";

import { signIn } from "@/auth";
import { getSafeNextPath } from "@/lib/auth/safe-redirects";

export async function signInWithEmail(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const locale = String(formData.get("locale") ?? "de");
  const next = getSafeNextPath(String(formData.get("next") ?? `/${locale}`), locale);

  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result && typeof result === "object" && "error" in result && result.error) {
      redirect(`/${locale}/auth/signin?error=credentials` as Route);
    }
  } catch {
    redirect(`/${locale}/auth/signin?error=credentials` as Route);
  }

  redirect(next as Route);
}
