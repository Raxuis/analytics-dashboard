"use client";
import dynamic from "next/dynamic";
import { spreadCount } from "./travel-content";
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
  Scan,
  X,
} from "lucide-react";
import {
  destinations,
  trackDestination,
  type DestinationId,
} from "./destinations";

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
  const [open, setOpen] = useState(false),
    [page, setPage] = useState(0),
    [uv, setUv] = useState(false);
  const [progress, setProgress] = useState(0),
    [ready, setReady] = useState(false),
    [failed, setFailed] = useState(false);
  const [reduced, setReduced] = useState(false),
    [mounted, setMounted] = useState(false),
    [simpleMode, setSimpleMode] = useState(false);
  const [uvFull, setUvFull] = useState(false);
  const [turning, setTurning] = useState(false);
  const [city, setCity] = useState<
    (CityMarker & { clientX: number; clientY: number }) | null
  >(null);
  const onBusy = useCallback((value: boolean) => setTurning(value), []);
  const onCity = useCallback(
    (value: (CityMarker & { clientX: number; clientY: number }) | null) =>
      setCity(value),
    [],
  );
  const onTurn = useCallback((value: number) => {
    setPage(value);
    setSelected(null);
    setCity(null);
  }, []);
  const [selected, setSelected] = useState<DestinationId | null>(null),
    [showLinks, setShowLinks] = useState(false);
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
  const chosen = destinations.find((d) => d.id === selected);
  return (
    <main
      className={`passport-site ${uv ? "is-uv" : ""} ${simpleMode || failed ? "is-simple" : ""}`}
    >
      <a
        className="skip-link"
        href="#direct-links"
        onClick={() => setShowLinks(true)}
      >
        Accéder aux liens
      </a>
      <header className="site-header">
        <a href="/" className="wordmark" aria-label="Raxuis, accueil">
          <Image
            src="/identity/raxuis-logo.png"
            alt=""
            width={28}
            height={28}
          />
          <span>Raxuis</span>
        </a>
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
          <Link2 size={16} />
          Liens
        </button>
      </header>
      <h1 className="sr-only">Raphaël Raclot</h1>
      <section
        className="passport-stage"
        aria-label="Passeport interactif de Raphaël Raclot"
      >
        <div
          className={`scene-canvas ${ready && !failed && !simpleMode ? "is-ready" : ""}`}
          aria-hidden="true"
        >
          {mounted && !failed && !simpleMode && (
            <SceneBoundary onError={onError}>
              <PassportScene
                open={open}
                page={page}
                uv={uv}
                uvFull={uvFull}
                reduced={reduced}
                selected={selected}
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
            <p>{progress >= 100 ? "Finalisation…" : "Chargement…"}</p>
            <div className="loading-meter">
              <progress
                aria-label="Chargement du passeport"
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
      {ready && !failed && !simpleMode && (
        <div
          className="document-controls"
          role="group"
          aria-label="Commandes du passeport"
        >
          <button
            className={`uv-button ${uv ? "active" : ""}`}
            aria-pressed={uv}
            onClick={() => setUv((v) => !v)}
            title="Lumière UV"
          >
            <Scan size={17} />
            <span>UV</span>
          </button>
          {uv && (
            <button
              className="uv-scope"
              aria-pressed={uvFull}
              onClick={() => setUvFull((v) => !v)}
              title={
                uvFull ? "Revenir à la lampe mobile" : "Révéler toute la page"
              }
            >
              {uvFull ? "Lampe" : "Tout éclairer"}
            </button>
          )}
          {open ? (
            <>
              <button
                aria-label="Page précédente"
                onClick={() => {
                  if (page === 0) close();
                  else onTurn(page - 1);
                  setSelected(null);
                }}
                disabled={turning}
                title={
                  page === 0 ? "Première de couverture" : "Page précédente"
                }
              >
                <ArrowLeft size={17} />
              </button>
              <span className="page-counter">
                {page === spreadCount
                  ? "Couverture"
                  : `${page + 1} sur ${spreadCount}`}
              </span>
              <button
                aria-label="Page suivante"
                onClick={() => {
                  onTurn(Math.min(spreadCount, page + 1));
                  setSelected(null);
                }}
                disabled={page === spreadCount || turning}
              >
                <ArrowRight size={17} />
              </button>
              <button
                aria-label="Fermer le passeport"
                onClick={close}
                title="Fermer"
              >
                <X size={17} />
              </button>
            </>
          ) : (
            <button className="control-open" onClick={onOpen}>
              Ouvrir <ArrowRight size={16} />
            </button>
          )}
        </div>
      )}
      <nav
        id="direct-links"
        className="links-panel"
        ref={menu}
        hidden={!showLinks}
        aria-label="Liens de Raphaël Raclot"
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
            {simpleMode || failed ? "Vue interactive" : "Vue simple"}
          </button>
          <a href="/analytics">Statistiques</a>
        </div>
      </nav>
      {chosen && open && !failed && !simpleMode && (
        <aside className="destination-peek" aria-label="Lien sélectionné">
          <button
            className="peek-close"
            onClick={() => {
              setSelected(null);
              menuButton.current?.focus();
            }}
            aria-label="Fermer l’aperçu"
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
          >
            Ouvrir <ArrowUpRight size={16} />
          </a>
        </aside>
      )}
      <noscript>
        <nav className="no-script-links" aria-label="Liens directs">
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
          <strong>{city.city.name}</strong>
          <small>{city.country}</small>
          {(uv && city.city.uvNote ? city.city.uvNote : city.city.note) && (
            <p>{uv && city.city.uvNote ? city.city.uvNote : city.city.note}</p>
          )}
        </aside>
      )}
      <div className="sr-only" aria-live="polite">
        {simpleMode || failed
          ? "Vue simple du passeport."
          : ready
            ? "Le passeport est prêt."
            : ""}{" "}
        {open
          ? page === spreadCount
            ? "Quatrième de couverture."
            : `Passeport ouvert, double page ${page + 1} sur ${spreadCount}.`
          : ""}{" "}
        {uv ? "Lumière UV activée." : ""}
      </div>
    </main>
  );
}
