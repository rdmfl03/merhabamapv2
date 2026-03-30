"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Link } from "@/i18n/navigation";
import {
  createPlaceCollection,
  deletePlaceCollection,
  idlePlaceCollectionActionState,
  updatePlaceCollection,
  type PlaceCollectionActionState,
} from "@/server/actions/collections/place-collection-actions";
import type { MyPlaceCollectionRow } from "@/server/queries/collections/list-my-place-collections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type CollectionsManageClientProps = {
  locale: "de" | "tr";
  returnPath: string;
  initialCollections: MyPlaceCollectionRow[];
  labels: {
    createTitle: string;
    createHint: string;
    titleLabel: string;
    descriptionLabel: string;
    visibilityLabel: string;
    visibilityPrivate: string;
    visibilityPublic: string;
    submitCreate: string;
    itemCount: string;
    view: string;
    edit: string;
    save: string;
    cancel: string;
    delete: string;
    deleteConfirm: string;
    listTitle: string;
    empty: string;
  };
};

export function CollectionsManageClient({
  locale,
  returnPath,
  initialCollections,
  labels,
}: CollectionsManageClientProps) {
  const router = useRouter();
  const [createState, createAction, createPending] = useActionState(
    createPlaceCollection,
    idlePlaceCollectionActionState as PlaceCollectionActionState,
  );

  useEffect(() => {
    if (createState.status === "success") {
      router.refresh();
    }
  }, [createState.status, router]);

  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-border/80 bg-card/60 p-6 shadow-sm">
        <h2 className="font-display text-xl text-foreground">{labels.createTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{labels.createHint}</p>
        <form action={createAction} className="mt-4 space-y-4">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="returnPath" value={returnPath} />
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground" htmlFor="new-collection-title">
              {labels.titleLabel}
            </label>
            <Input id="new-collection-title" name="title" maxLength={80} required />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground" htmlFor="new-collection-desc">
              {labels.descriptionLabel}
            </label>
            <Textarea id="new-collection-desc" name="description" maxLength={300} rows={3} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground" htmlFor="new-collection-vis">
              {labels.visibilityLabel}
            </label>
            <select
              id="new-collection-vis"
              name="visibility"
              className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 text-sm"
              defaultValue="PRIVATE"
            >
              <option value="PRIVATE">{labels.visibilityPrivate}</option>
              <option value="PUBLIC">{labels.visibilityPublic}</option>
            </select>
          </div>
          <Button type="submit" disabled={createPending}>
            {labels.submitCreate}
          </Button>
          {createState.status === "error" ? (
            <p className="text-sm text-destructive" role="alert">
              {createState.message}
            </p>
          ) : null}
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">{labels.listTitle}</h2>
        {initialCollections.length === 0 ? (
          <p className="text-sm text-muted-foreground">{labels.empty}</p>
        ) : (
          <ul className="space-y-4">
            {initialCollections.map((c) => (
              <CollectionRow
                key={c.id}
                row={c}
                locale={locale}
                returnPath={returnPath}
                editingId={editingId}
                setEditingId={setEditingId}
                labels={labels}
                onMutate={() => router.refresh()}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function CollectionRow({
  row,
  locale,
  returnPath,
  editingId,
  setEditingId,
  labels,
  onMutate,
}: {
  row: MyPlaceCollectionRow;
  locale: "de" | "tr";
  returnPath: string;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  labels: CollectionsManageClientProps["labels"];
  onMutate: () => void;
}) {
  const [updateState, updateAction, updatePending] = useActionState(
    updatePlaceCollection,
    idlePlaceCollectionActionState as PlaceCollectionActionState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deletePlaceCollection,
    idlePlaceCollectionActionState as PlaceCollectionActionState,
  );

  useEffect(() => {
    if (updateState.status === "success") {
      setEditingId(null);
      onMutate();
    }
  }, [updateState.status, onMutate, setEditingId]);

  useEffect(() => {
    if (deleteState.status === "success") {
      onMutate();
    }
  }, [deleteState.status, onMutate]);

  const isEditing = editingId === row.id;

  return (
    <li className="rounded-2xl border border-border/80 bg-white/90 p-4 shadow-sm">
      {!isEditing ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-semibold text-foreground">{row.title}</p>
            {row.description ? (
              <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{row.description}</p>
            ) : null}
            <p className="mt-2 text-xs text-muted-foreground">
              {row.visibility === "PUBLIC" ? labels.visibilityPublic : labels.visibilityPrivate}
              {" · "}
              {labels.itemCount.replace("{n}", String(row.itemCount))}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/collections/${row.id}`}>{labels.view}</Link>
            </Button>
            <Button variant="outline" size="sm" type="button" onClick={() => setEditingId(row.id)}>
              {labels.edit}
            </Button>
            <form action={deleteAction}>
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="returnPath" value={returnPath} />
              <input type="hidden" name="collectionId" value={row.id} />
              <Button
                variant="outline"
                size="sm"
                type="submit"
                disabled={deletePending}
                title={labels.deleteConfirm}
                className="border-destructive/50 text-destructive hover:bg-destructive/10"
              >
                {labels.delete}
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <form action={updateAction} className="space-y-3">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="returnPath" value={returnPath} />
          <input type="hidden" name="collectionId" value={row.id} />
          <div className="space-y-1">
            <label className="text-sm font-medium">{labels.titleLabel}</label>
            <Input name="title" maxLength={80} required defaultValue={row.title} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">{labels.descriptionLabel}</label>
            <Textarea name="description" maxLength={300} rows={3} defaultValue={row.description ?? ""} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">{labels.visibilityLabel}</label>
            <select
              name="visibility"
              className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 text-sm"
              defaultValue={row.visibility}
            >
              <option value="PRIVATE">{labels.visibilityPrivate}</option>
              <option value="PUBLIC">{labels.visibilityPublic}</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={updatePending}>
              {labels.save}
            </Button>
            <Button type="button" variant="outline" onClick={() => setEditingId(null)}>
              {labels.cancel}
            </Button>
          </div>
          {updateState.status === "error" ? (
            <p className="text-sm text-destructive">{updateState.message}</p>
          ) : null}
        </form>
      )}
    </li>
  );
}
