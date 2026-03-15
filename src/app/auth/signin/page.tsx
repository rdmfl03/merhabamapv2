import { redirect } from "next/navigation";

import { routing } from "@/i18n/routing";

export default function RootSignInRedirectPage() {
  redirect(`/${routing.defaultLocale}/auth/signin`);
}
