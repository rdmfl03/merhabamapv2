import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { CollectionsManageClient } from "@/components/collections/collections-manage-client";
import { listMyPlaceCollections } from "@/server/queries/collections/list-my-place-collections";

export const dynamic = "force-dynamic";

type CollectionsPageProps = {
  params: Promise<{ locale: "de" | "tr" }>;
};

export async function generateMetadata({ params }: CollectionsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "collections" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function CollectionsPage({ params }: CollectionsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/signin?next=${encodeURIComponent(`/${locale}/collections`)}`);
  }

  const [t, rows] = await Promise.all([
    getTranslations("collections"),
    listMyPlaceCollections(session.user.id),
  ]);

  const returnPath = `/${locale}/collections`;

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-12">
      <div className="space-y-2">
        <h1 className="font-display text-3xl text-foreground md:text-4xl">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <CollectionsManageClient
        locale={locale}
        returnPath={returnPath}
        initialCollections={rows}
        labels={{
          createTitle: t("createTitle"),
          createHint: t("createHint"),
          titleLabel: t("titleLabel"),
          descriptionLabel: t("descriptionLabel"),
          visibilityLabel: t("visibilityLabel"),
          visibilityPrivate: t("visibilityPrivate"),
          visibilityPublic: t("visibilityPublic"),
          submitCreate: t("submitCreate"),
          itemCount: t("itemCount"),
          view: t("view"),
          edit: t("edit"),
          save: t("save"),
          cancel: t("cancel"),
          delete: t("delete"),
          deleteConfirm: t("deleteConfirm"),
          listTitle: t("listTitle"),
          empty: t("empty"),
        }}
      />
    </div>
  );
}
