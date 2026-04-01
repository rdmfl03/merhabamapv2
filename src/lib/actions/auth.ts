"use server";

import type { Route } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { signIn } from "@/auth";
import { getSafeNextPath } from "@/lib/auth/safe-redirects";
import { prisma } from "@/lib/prisma";
import { LOCALE_COOKIE_NAME } from "@/i18n/locale";

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

  if (next === `/${locale}`) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        preferredLocale: true,
        onboardingCompletedAt: true,
        onboardingCity: {
          select: {
            slug: true,
          },
        },
      },
    });

    const targetLocale = user?.preferredLocale ?? locale;
    const cookieStore = await cookies();
    cookieStore.set(LOCALE_COOKIE_NAME, targetLocale, {
      path: "/",
      sameSite: "lax",
      httpOnly: false,
    });

    if (user?.onboardingCompletedAt) {
      redirect(`/${targetLocale}/home` as Route);
    }

    redirect(`/${targetLocale}` as Route);
  }

  redirect(next as Route);
}
