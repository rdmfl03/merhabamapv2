"use server";

import { redirect } from "next/navigation";

import { signIn } from "@/auth";

function getSafeNextPath(value: string, locale: string) {
  if (!value.startsWith("/")) {
    return `/${locale}`;
  }

  if (value.startsWith("//")) {
    return `/${locale}`;
  }

  return value;
}

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
      redirect(`/${locale}/auth/signin?error=credentials`);
    }
  } catch {
    redirect(`/${locale}/auth/signin?error=credentials`);
  }

  redirect(next);
}
