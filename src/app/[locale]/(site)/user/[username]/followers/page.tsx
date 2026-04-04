import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Link } from "@/i18n/navigation";
import { UserFollowListRow } from "@/components/social/user-follow-list-row";
import { auth } from "@/auth";
import { getPublicUserByUsername } from "@/server/queries/social/get-public-user-by-username";
import { listFollowersPage } from "@/server/queries/social/follow-graph";

export const dynamic = "force-dynamic";

type FollowersPageProps = {
  params: Promise<{ locale: "de" | "tr"; username: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: FollowersPageProps): Promise<Metadata> {
  const { locale, username } = await params;
  const t = await getTranslations({ locale, namespace: "userProfile" });
  const session = await auth();
  const user = await getPublicUserByUsername(decodeURIComponent(username), {
    viewerUserId: session?.user?.id ?? null,
  });
  if (!user?.username || user.limitedForPrivateViewer) {
    return { title: t("notFoundTitle") };
  }
  return {
    title: t("followersMetaTitle", { username: user.username }),
    description: t("followersMetaDescription", { username: user.username }),
  };
}

export default async function UserFollowersPage({ params, searchParams }: FollowersPageProps) {
  const { locale, username: usernameParam } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const decoded = decodeURIComponent(usernameParam);
  const session = await auth();
  const viewerId = session?.user?.id ?? null;

  const profileUser = await getPublicUserByUsername(decoded, {
    viewerUserId: viewerId,
  });

  if (!profileUser?.username || profileUser.limitedForPrivateViewer) {
    notFound();
  }

  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const [t, data] = await Promise.all([
    getTranslations("userProfile"),
    listFollowersPage(profileUser.id, viewerId, page),
  ]);

  const handleEnc = encodeURIComponent(profileUser.username);
  const profileHref = `/user/${handleEnc}`;

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-12">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          <Link href={profileHref} className="text-brand underline-offset-2 hover:underline">
            @{profileUser.username}
          </Link>
        </p>
        <h1 className="font-display text-3xl text-foreground">{t("followersTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("followersCountLabel", { count: data.total })}
        </p>
      </div>

      {data.users.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/80 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
          {t("followersEmpty")}
        </p>
      ) : (
        <ul className="space-y-2">
          {data.users.map((row) => (
            <UserFollowListRow
              key={row.id}
              row={row}
              viewerLoggedIn={Boolean(viewerId)}
              labels={{ follow: t("follow"), unfollow: t("unfollow") }}
            />
          ))}
        </ul>
      )}

      {data.hasMore || data.page > 1 ? (
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          {data.page > 1 ? (
            <Link
              href={
                data.page === 2
                  ? `/user/${handleEnc}/followers`
                  : `/user/${handleEnc}/followers?page=${data.page - 1}`
              }
              className="text-brand underline-offset-2 hover:underline"
            >
              {t("paginationPrev")}
            </Link>
          ) : null}
          {data.hasMore ? (
            <Link
              href={`/user/${handleEnc}/followers?page=${data.page + 1}`}
              className="text-brand underline-offset-2 hover:underline"
            >
              {t("paginationNext")}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
