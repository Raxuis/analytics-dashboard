"use client";
import { usePassportMeasurement } from "./usePassportMeasurement";
import { measure } from "@/lib/measurement/client";
import { LanguageSwitch } from "@/i18n/LanguageSwitch";
import { useLanguage } from "@/i18n/LanguageProvider";
import dynamic from "next/dynamic";
import { spreadCount, travelPages } from "./travel-content";
import type { CityMarker } from "./travel-layout";
import Image from "next/image";
import {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Box,
  Github,
  Linkedin,
  Link2,
  Maximize2,
  Scan,
  X,
} from "lucide-react";
import {
  destinations,
  trackDestination,
  type DestinationId,
} from "./destinations";

import { usePassportDiscovery } from "./usePassportDiscovery";
import { PassportReader } from "./PassportReader";
import { SimplePassport } from "./SimplePassport";

const PassportScene = dynamic(() => import("./PassportScene"), { ssr: false });
class SceneBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
function DestinationIcon({ id }: { id: DestinationId }) {
  if (id === "github") return <Github size={19} />;
  if (id === "linkedin") return <Linkedin size={19} />;
  if (id === "portfolio") return <Box size={19} />;
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M4 3h4l12 18h-4L4 3Zm0 18L20 3" />
    </svg>
  );
}
export default function PassportExperience() {
  const { locale, t } = useLanguage();
  const [open, setOpen] = useState(false),
    [page, setPage] = useState(0),
    [uv, setUv] = useState(false);
  const [progress, setProgress] = useState(0),
    [ready, setReady] = useState(false),
    [failed, setFailed] = useState(false);
  const [reduced, setReduced] = useState(false),
    [mounted, setMounted] = useState(false),
    [simpleMode, setSimpleMode] = useState(false);
  const [exploredCity, setExploredCity] = useState(false);
  const [coarsePointer, setCoarsePointer] = useState(false);
  const [readingIndex, setReadingIndex] = useState<number | null>(null);
  const readerButton = useRef<HTMLButtonElement>(null);
  const readerFocusPending = useRef(false);
  const [uvFull, setUvFull] = useState(false);
  const [turning, setTurning] = useState(false);
  const [city, setCity] = useState<
    (CityMarker & { clientX: number; clientY: number }) | null
  >(null);
  const onBusy = useCallback((value: boolean) => {
    setTurning(value);
    if (value) {
      setSelected(null);
      setCity(null);
    } else if (readerFocusPending.current) {
      readerFocusPending.current = false;
      requestAnimationFrame(() =>
        readerButton.current?.focus({ preventScroll: true }),
      );
    }
  }, []);
  const onCity = useCallback(
    (value: (CityMarker & { clientX: number; clientY: number }) | null) => {
      setCity(value);
      if (value) {
        setExploredCity(true);
      }
    },
    [],
  );
  const cityName = city?.city.name;
  useEffect(() => {
    if (cityName) measure("city_view", { detail: cityName });
  }, [cityName]);
  const onTurn = useCallback((value: number) => {
    setPage(value);
    setSelected(null);
    setCity(null);
  }, []);
  const [selected, setSelected] = useState<DestinationId | null>(null),
    [showLinks, setShowLinks] = useState(false);
  usePassportMeasurement({ ready, failed, open, page, uv, showLinks, simpleMode, readingIndex });
  const discovery = usePassportDiscovery({
    ready: ready && !failed && !simpleMode,
    open, page, exploredCity, uv,
    hasCities: travelPages.slice((page - 1) * 2, page * 2).some(({ memory }) => !!memory.cities?.length),
    paused: turning || (open && page >= spreadCount) || showLinks || !!selected || readingIndex !== null || !!city || uv,
  });
  const discoveryText = discovery.cue === "cover"
    ? coarsePointer ? t("Touchez la couverture pour ouvrir le passeport.") : t("Cliquez sur la couverture pour ouvrir le passeport.")
    : discovery.cue === "turn"
      ? t("Faites glisser les pages pour les tourner.")
      : discovery.cue === "city"
        ? coarsePointer ? t("Touchez une ville pour la découvrir.") : t("Survolez une ville pour la découvrir.")
        : t("Activez UV pour révéler les souvenirs cachés.");
  const menuButton = useRef<HTMLButtonElement>(null),
    menu = useRef<HTMLElement>(null),
    peekLink = useRef<HTMLAnchorElement>(null);
  const onError = useCallback(() => {
    setFailed(true);
    setShowLinks(false);
    setSelected(null);
  }, []);
  const onReady = useCallback(() => setReady(true), []),
    onProgress = useCallback((n: number) => setProgress(n), []);
  const onOpen = useCallback(() => setOpen(true), []);
  const onSelect = useCallback((id: DestinationId) => {
    setSelected(id);
    setShowLinks(false);
  }, []);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(media.matches);
    change();
    media.addEventListener("change", change);
    setCoarsePointer(matchMedia("(pointer: coarse)").matches);
    setMounted(true);
    return () => media.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    if (ready || failed || simpleMode) return;
    const timer = setTimeout(onError, 20000);
    return () => clearTimeout(timer);
  }, [ready, failed, simpleMode, onError]);
  useEffect(() => {
    if (showLinks)
      menu.current?.querySelector("a")?.focus({ preventScroll: true });
  }, [showLinks]);
  useEffect(() => {
    if (selected) peekLink.current?.focus({ preventScroll: true });
  }, [selected]);
  useEffect(() => {
    function escape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setCity(null);
      if (showLinks || selected) {
        setShowLinks(false);
        setSelected(null);
        menuButton.current?.focus();
      }
    }
    function outside(event: PointerEvent) {
      if (
        showLinks &&
        event.target instanceof Node &&
        !menu.current?.contains(event.target) &&
        !menuButton.current?.contains(event.target)
      )
        setShowLinks(false);
    }
    window.addEventListener("keydown", escape);
    window.addEventListener("pointerdown", outside);
    return () => {
      window.removeEventListener("keydown", escape);
      window.removeEventListener("pointerdown", outside);
    };
  }, [showLinks, selected]);
  const close = useCallback(() => {
    setOpen(false);
    setPage(0);
    setCity(null);
    setTurning(false);
    setSelected(null);
    setUv(false);
  }, []);
  function simple() {
    const next = !(simpleMode || failed);
    setSimpleMode(next);
    setFailed(false);
    setReady(false);
    setProgress(0);
    setShowLinks(false);
    setSelected(null);
    setOpen(false);
    setPage(0);
    setUv(false);
  }
  const exitReader = (index: number) => {
    const spread = Math.floor(index / 2);
    const moving = spread !== page && !failed && !simpleMode;
    readerFocusPending.current = moving;
    setReadingIndex(null);
    onTurn(spread);
    if (!moving)
      requestAnimationFrame(() => {
        const target = readerButton.current?.disabled
          ? menuButton.current
          : (readerButton.current ?? menuButton.current);
        target?.focus({ preventScroll: true });
      });
  };
  const chosen = destinations.find((d) => d.id === selected);
  return (
    <main
      className={`passport-site ${uv ? "is-uv" : ""} ${simpleMode || failed ? "is-simple" : ""}`}
    >
      <a
        className="skip-link"
        href="#direct-links"
        onClick={() => setShowLinks(true)}
      >{t("Accéder aux liens")}</a>
      <header className="site-header">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- A full document load resets the passport and records a real page load. */}
        <a href="/" className="wordmark" aria-label={t("Raxuis, accueil")}>
          <Image
            src="/identity/raxuis-logo.png"
            alt=""
            width={28}
            height={28}
          />
          <span>Raxuis</span>
        </a>
        <div className="header-actions">
        <LanguageSwitch />
        <button
          ref={menuButton}
          className="links-button"
          aria-expanded={showLinks}
          aria-controls="direct-links"
          onClick={() => {
            setShowLinks((v) => !v);
            setSelected(null);
          }}
        >
          <Link2 size={16} />{t("Liens")}</button>
        </div>
      </header>
      <h1 className="sr-only">Raphaël Raclot</h1>
      <section
        className="passport-stage"
        aria-label={t("Passeport interactif de Raphaël Raclot")}
      >
        <div
          className={`scene-canvas ${ready && !failed && !simpleMode ? "is-ready" : ""}`}
          aria-hidden="true"
        >
          {mounted && !failed && !simpleMode && (
            <SceneBoundary onError={onError}>
              <PassportScene
                locale={locale}
                open={open}
                page={page}
                uv={uv}
                uvFull={uvFull}
                reduced={reduced}
                selected={selected}
                discovery={discovery.cue}
                onDiscoveryInteraction={discovery.dismiss}
                onOpen={onOpen}
                onClose={close}
                onSelect={onSelect}
                onTurn={onTurn}
                onBusy={onBusy}
                onCity={onCity}
                onProgress={onProgress}
                onReady={onReady}
                onError={onError}
              />
            </SceneBoundary>
          )}
        </div>
        {!ready && !failed && !simpleMode && (
          <div className="scene-loading" role="status">
            <p>{progress >= 100 ? t("Finalisation…") : t("Chargement…")}</p>
            <div className="loading-meter">
              <progress
                aria-label={t("Chargement du passeport")}
                value={progress}
                max={100}
              />
              <span>{Math.round(progress)} %</span>
            </div>
          </div>
        )}
        {(simpleMode || failed) && (
          <SimplePassport
            error={failed}
            onInteractive={simple}
            uv={uv}
            onUv={() => setUv((v) => !v)}
          />
        )}
      </section>
      {discovery.cue && (
        <div className="discovery-note" role="status" key={discovery.cue}>
          <span>{discoveryText}</span>
          <button onClick={discovery.dismiss} aria-label={t("Masquer cette indication")}>
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      )}
      {ready && !failed && !simpleMode && (
        <div
          className="document-controls"
          role="group"
          aria-label={t("Commandes du passeport")}
        >
          <button
            className={`uv-button ${uv ? "active" : ""}`}
            aria-pressed={uv}
            aria-label={t("Lumière UV")}
            disabled={turning}
            onClick={() => setUv((v) => !v)}
            title={t("Lumière UV")}
          >
            <Scan size={17} />
            <span>UV</span>
          </button>
          {uv && (
            <button
              className="uv-scope"
              aria-pressed={uvFull}
              disabled={turning}
              onClick={() => setUvFull((v) => !v)}
              title={
                uvFull ? t("Revenir à la lampe mobile") : t("Révéler toute la page")
              }
            >
              {uvFull ? t("Lampe") : t("Tout éclairer")}
            </button>
          )}
          {open && page < spreadCount && (
            <button
              ref={readerButton}
              className="reader-open"
              disabled={turning}
              onClick={() => {
                setCity(null);
                setSelected(null);
                setReadingIndex(page * 2);
              }}
              aria-label={t("Lire une page en plein écran")}
              title={t("Lire une page")}
            >
              <Maximize2 size={17} />
              <span>{t("Lire")}</span>
            </button>
          )}
          {open ? (
            <>
              <button
                aria-label={t("Page précédente")}
                onClick={() => {
                  if (page === 0) close();
                  else onTurn(page - 1);
                  setSelected(null);
                }}
                disabled={turning}
                title={
                  page === 0 ? t("Première de couverture") : t("Page précédente")
                }
              >
                <ArrowLeft size={17} />
              </button>
              <span className="page-counter">
                {page === spreadCount
                  ? t("Couverture")
                  : t(`${page + 1} sur ${spreadCount}`)}
              </span>
              <button
                aria-label={t("Page suivante")}
                onClick={() => {
                  onTurn(Math.min(spreadCount, page + 1));
                  setSelected(null);
                }}
                disabled={page === spreadCount || turning}
              >
                <ArrowRight size={17} />
              </button>
              <button
                aria-label={t("Fermer le passeport")}
                onClick={close}
                disabled={turning}
                title={t("Fermer")}
              >
                <X size={17} />
              </button>
            </>
          ) : (
            <button
              className="control-open"
              onClick={onOpen}
              disabled={turning}
            >{t("Ouvrir")}<ArrowRight size={16} />
            </button>
          )}
        </div>
      )}
      <nav
        id="direct-links"
        className="links-panel"
        ref={menu}
        hidden={!showLinks}
        aria-label={t("Liens de Raphaël Raclot")}
      >
        {destinations.map((d) => (
          <a
            className="destination-row"
            key={d.id}
            href={d.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackDestination(d.id, "direct")}
          >
            <DestinationIcon id={d.id} />
            <span>
              <strong>{d.label}</strong>
              <small>
                {d.id === "github"
                  ? "github.com/Raxuis"
                  : d.id === "linkedin"
                    ? "Raphaël Raclot"
                    : d.id === "x"
                      ? "@I_Haruki_I"
                      : d.domain}
              </small>
            </span>
            <ArrowUpRight size={16} />
          </a>
        ))}
        <div className="links-utilities">
          <button onClick={simple}>
            {simpleMode || failed ? t("Vue interactive") : t("Vue simple")}
          </button>
          <a href={locale === "en" ? "/en/analytics" : "/analytics"}>{t("Statistiques")}</a>
        </div>
      </nav>
      {chosen && open && !failed && !simpleMode && (
        <aside className="destination-peek" aria-label={t("Lien sélectionné")}>
          <button
            className="peek-close"
            onClick={() => {
              setSelected(null);
              menuButton.current?.focus();
            }}
            aria-label={t("Fermer l’aperçu")}
          >
            <X size={15} />
          </button>
          <DestinationIcon id={chosen.id} />
          <h2>{chosen.label}</h2>
          <p>{chosen.domain}</p>
          <a
            ref={peekLink}
            href={chosen.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackDestination(chosen.id, "scene")}
          >{t("Ouvrir")}<ArrowUpRight size={16} />
          </a>
        </aside>
      )}
      {readingIndex !== null && (
        <PassportReader
          initialPage={readingIndex}
          uv={uv}
          onUv={() => setUv((v) => !v)}
          onExit={exitReader}
        />
      )}
      <noscript>
        <nav className="no-script-links" aria-label={t("Liens directs")}>
          {destinations.map((d) => (
            <a
              key={d.id}
              href={d.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {d.label}
            </a>
          ))}
        </nav>
      </noscript>
      {city && !turning && !simpleMode && !failed && (
        <aside
          className="city-tooltip"
          role="tooltip"
          style={{
            left: Math.min(
              Math.max(12, city.clientX + 14),
              window.innerWidth - 244,
            ),
            top: Math.min(
              Math.max(12, city.clientY + 18),
              window.innerHeight - 145,
            ),
          }}
        >
          <strong>{t(city.city.name)}</strong>
          <small>{t(city.country)}</small>
          {(uv && city.city.uvNote ? city.city.uvNote : city.city.note) && (
            <p>{t(uv && city.city.uvNote ? city.city.uvNote : city.city.note)}</p>
          )}
        </aside>
      )}
      <div className="sr-only" aria-live="polite">
        {simpleMode || failed
          ? t("Vue simple du passeport.")
          : ready
            ? t("Le passeport est prêt.")
            : ""}{" "}
        {open
          ? page === spreadCount
            ? t("Quatrième de couverture.")
            : t(`Passeport ouvert, double page ${page + 1} sur ${spreadCount}.`)
          : ""}{" "}
        {uv ? t("Lumière UV activée.") : ""}
      </div>
    </main>
  );
}
