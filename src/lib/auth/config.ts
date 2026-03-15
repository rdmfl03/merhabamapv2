import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { isDemoCredentialsEnabled } from "@/lib/dev/runtime";
import { env, isProduction } from "@/lib/env";
import { logger } from "@/lib/logger";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60,
  },
  trustHost: true,
  useSecureCookies: isProduction(),
  cookies: {
    sessionToken: {
      name: isProduction()
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProduction(),
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

        if (!isDemoCredentialsEnabled()) {
          logger.warn("credentials_sign_in_rejected", {
            reason: "demo_credentials_disabled",
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
          logger.info("credentials_sign_in_failed", {
            reason: "user_not_found",
          });
          return null;
        }

        if (!verifyPassword(parsed.data.password, user.hashedPassword)) {
          logger.info("credentials_sign_in_failed", {
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
        const allowedBase = new URL(env.APP_URL);

        if (target.origin !== allowedBase.origin) {
          return baseUrl;
        }

        return target.toString();
      } catch {
        return baseUrl;
      }
    },
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role;
        session.user.onboardingCompletedAt = user.onboardingCompletedAt ?? null;
        session.user.preferredLocale = user.preferredLocale ?? null;
      }

      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
} satisfies NextAuthConfig;
