export const demoAccounts = [
  {
    key: "user",
    label: "Demo User",
    role: "USER",
  },
  {
    key: "businessOwner",
    label: "Demo Business Owner",
    role: "BUSINESS_OWNER",
  },
  {
    key: "moderator",
    label: "Demo Moderator",
    role: "MODERATOR",
  },
  {
    key: "admin",
    label: "Demo Admin",
    role: "ADMIN",
  },
  {
    key: "fresh",
    label: "Fresh Demo User",
    role: "USER",
  },
] as const;

export type DemoAccount = (typeof demoAccounts)[number];
