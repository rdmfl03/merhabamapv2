import type { Role } from "@prisma/client";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export function isProductionRuntime() {
  return process.env.APP_ENV === "production" || process.env.NODE_ENV === "production";
}

export function readBooleanEnv(name: string, defaultValue: boolean) {
  const value = process.env[name];

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return defaultValue;
}

function serializeNullableDate(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function parseNullableDate(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function isUserRegistrationEnabled() {
  return isProductionRuntime()
    ? readBooleanEnv("AUTH_ALLOW_SIGNUP", false)
    : readBooleanEnv("AUTH_ALLOW_SIGNUP", true);
}

export const authConfig = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  trustHost: true,
  useSecureCookies: isProductionRuntime(),
  cookies: {
    sessionToken: {
      name: isProductionRuntime()
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProductionRuntime(),
      },
    },
  },
  providers: [
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);

        if (!parsed.success) {
          return null;
        }

        if (!readBooleanEnv("AUTH_ENABLE_PASSWORD_LOGIN", true)) {
          console.warn("credentials_sign_in_rejected", {
            reason: "password_login_disabled",
          });
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            role: true,
            preferredLocale: true,
            onboardingCompletedAt: true,
            hashedPassword: true,
          },
        });

        if (!user) {
          console.info("credentials_sign_in_failed", {
            reason: "user_not_found",
          });
          return null;
        }

        if (!verifyPassword(parsed.data.password, user.hashedPassword)) {
          console.info("credentials_sign_in_failed", {
            reason: "invalid_password",
          });
          return null;
        }

        return user;
      },
    }),
  ],
  callbacks: {
    redirect({ url, baseUrl }) {
      try {
        const target = new URL(url, baseUrl);
        const allowedAppUrl = process.env.APP_URL;

        if (!allowedAppUrl) {
          return baseUrl;
        }

        const allowedBase = new URL(allowedAppUrl);

        if (target.origin !== allowedBase.origin) {
          return baseUrl;
        }

        return target.toString();
      } catch {
        return baseUrl;
      }
    },
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.onboardingCompletedAt = serializeNullableDate(user.onboardingCompletedAt);
        token.preferredLocale = user.preferredLocale ?? null;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as Role | undefined) ?? "USER";
        session.user.onboardingCompletedAt = parseNullableDate(
          token.onboardingCompletedAt,
        );
        session.user.preferredLocale =
          (token.preferredLocale as "de" | "tr" | null | undefined) ?? null;
      }

      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
} satisfies NextAuthConfig;
