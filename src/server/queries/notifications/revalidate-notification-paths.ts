import { revalidatePath } from "next/cache";

export function revalidateNotificationSurfaces() {
  for (const locale of ["de", "tr"] as const) {
    revalidatePath(`/${locale}/notifications`);
  }
}
