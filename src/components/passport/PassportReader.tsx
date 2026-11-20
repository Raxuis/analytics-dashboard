"use client";
import { measure } from "@/lib/measurement/client";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Minimize2, Scan } from "lucide-react";
import { SimplePassport } from "./SimplePassport";
import { travelPages } from "./travel-content";
import { trackDestination } from "./destinations";

export function PassportReader({
  initialPage,
  uv,
  onUv,
  onExit,
}: {
  initialPage: number;
  uv: boolean;
  onUv: () => void;
  onExit: (page: number) => void;
}) {
  const { t } = useLanguage();
  const [page, setPage] = useState(initialPage);
  const dialog = useRef<HTMLDialogElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const count = 2 + travelPages.length;
  useEffect(() => {
    if (page >= 2) measure("spread_view", { detail: String(Math.floor(page / 2)) });
  }, [page]);
  const title =
    page === 0
      ? t("Identité")
      : page === 1
        ? t("Visas")
        : t(travelPages[page - 2]!.title);
  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    return () => node?.close();
  }, []);
  useEffect(() => {
    body.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [page]);
  return (
    <dialog
      ref={dialog}
      className={`page-reader ${uv ? "is-uv" : ""}`}
      aria-labelledby="reader-title"
      onCancel={(event) => {
        event.preventDefault();
        onExit(page);
      }}
    >
      <header className="reader-heading">
        <h2 id="reader-title">{title}</h2>
        <button
          onClick={() => onExit(page)}
          aria-label={t("Revenir à la double page")}
          title={t("Revenir au passeport")}
        >
          <Minimize2 size={19} />
        </button>
      </header>
      <div className="reader-body" ref={body}>
        <SimplePassport
          key={page}
          pageIndex={page}
          uv={uv}
          onTrack={(id) => trackDestination(id, "scene")}
        />
      </div>
      <footer className="reader-controls" aria-label={t("Commandes de lecture")}>
        <button
          aria-pressed={uv}
          onClick={onUv}
          title={t("Révéler les souvenirs UV")}
        >
          <Scan size={17} />
          <span>UV</span>
        </button>
        <button
          aria-label={t("Page précédente en lecture")}
          disabled={page === 0}
          onClick={() => setPage((p) => p - 1)}
        >
          <ArrowLeft size={18} />
        </button>
        <span aria-live="polite">
          {t(`${page + 1} sur ${count}`)}
        </span>
        <button
          aria-label={t("Page suivante en lecture")}
          disabled={page === count - 1}
          onClick={() => setPage((p) => p + 1)}
        >
          <ArrowRight size={18} />
        </button>
      </footer>
    </dialog>
  );
}
