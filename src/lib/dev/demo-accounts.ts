export const demoAccounts = [
  {
    label: "Demo User",
    email: "demo.user@example.com",
    password: "DemoPass!123",
    role: "USER",
  },
  {
    label: "Demo Business Owner",
    email: "demo.business@example.com",
    password: "DemoPass!123",
    role: "BUSINESS_OWNER",
  },
  {
    label: "Demo Moderator",
    email: "demo.moderator@example.com",
    password: "DemoPass!123",
    role: "MODERATOR",
  },
  {
    label: "Demo Admin",
    email: "demo.admin@example.com",
    password: "DemoPass!123",
    role: "ADMIN",
  },
  {
    label: "Fresh Demo User",
    email: "demo.fresh@example.com",
    password: "DemoPass!123",
    role: "USER",
  },
] as const;

export type DemoAccount = (typeof demoAccounts)[number];
