import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";
import type { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: Role;
      onboardingCompletedAt: Date | null;
      preferredLocale?: "de" | "tr" | null;
    };
  }

  interface User {
    role: Role;
    onboardingCompletedAt: Date | null;
    preferredLocale?: "de" | "tr" | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role?: Role;
    onboardingCompletedAt?: string | null;
    preferredLocale?: "de" | "tr" | null;
  }
}
