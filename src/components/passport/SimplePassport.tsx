/* eslint-disable @next/next/no-img-element -- Native local images keep the non-WebGL document independent of the canvas loader. */
import { useLanguage } from "@/i18n/LanguageProvider";
import React, { useState } from "react";
import { CountryFlag } from "./CountryFlag";
import { identityMachineLines } from "./identity-data";
import {
  travelPages,
  countryName,
  type TravelMemory,
  type TravelCity,
} from "./travel-content";
import { visaPapers, visaAccents } from "./passport-layout";
import { cityMarkers, TRAVEL_MAP } from "./travel-layout";
import {
  destinations,
  trackDestination,
  type DestinationId,
} from "./destinations";

type Props = {
  error?: boolean;
  /** Restrict the native document to one printed page for the full-screen reader. */
  pageIndex?: number;
  uv?: boolean;
  onUv?: () => void;
  onInteractive?: () => void;
  onTrack?: (id: DestinationId) => void;
};
function TravelPage({
  memory,
  index,
  uv,
}: {
  memory: TravelMemory;
  uv: boolean;
  index: number;
}) {
  const { t } = useLanguage();
  const [selected, setSelected] = useState<TravelCity | null>(null);
  return (
    <section
      className="simple-page simple-travel"
      aria-labelledby={`travel-title-${index}`}
    >
      <div className="simple-page-header">
        <h2 id={`travel-title-${index}`}>{t("Voyages")}</h2>
        <span>{t(countryName(memory.country))}</span>
      </div>
      <div className="simple-travel-map">
        <img src={`/identity/countries/${memory.country}.svg`} alt="" />
        {cityMarkers(memory).map((marker) => (
          <button
            className="city-point"
            key={t(marker.city.name)}
            aria-label={`${t(marker.city.name)}, ${t(marker.country)}`}
            aria-describedby={`city-${index}-${marker.city.name.replace(/\s+/g, "-")}`}
            data-align={marker.x > 600 ? "right" : "left"}
            style={{
              left: `${((marker.x - TRAVEL_MAP.x) / TRAVEL_MAP.width) * 100}%`,
              top: `${((marker.y - TRAVEL_MAP.y) / TRAVEL_MAP.height) * 100}%`,
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") e.currentTarget.blur();
            }}
          >
            <svg viewBox="0 0 48 48" aria-hidden="true">
              <circle cx="24" cy="24" r="3" fill="currentColor" />
              <circle cx="24" cy="24" r="10" />
              <circle cx="24" cy="24" r="17" />
              <circle cx="24" cy="24" r="23" />
            </svg>
            <span
              className="city-note"
              role="tooltip"
              id={`city-${index}-${marker.city.name.replace(/\s+/g, "-")}`}
            >
              <strong>{t(marker.city.name)}</strong>
              <small>{t(marker.country)}</small>
              {(uv && marker.city.uvNote
                ? marker.city.uvNote
                : marker.city.note) && (
                <span>
                  {t(uv && marker.city.uvNote
                    ? marker.city.uvNote
                    : marker.city.note)}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>
      {!!memory.cities?.length && (
        <div className="city-index" role="group" aria-label={t("Villes visitées")}>
          {memory.cities.map((city) => (
            <button
              key={t(city.name)}
              type="button"
              aria-expanded={selected?.name === city.name}
              aria-controls={`city-detail-${index}`}
              onClick={() =>
                setSelected(selected?.name === city.name ? null : city)
              }
              onKeyDown={(e) => {
                if (e.key === "Escape") setSelected(null);
              }}
            >
              {t(city.name)}
            </button>
          ))}
        </div>
      )}
      <div
        id={`city-detail-${index}`}
        className="city-detail"
        role="status"
        hidden={!selected}
      >
        {selected && (
          <>
            <strong>{t(selected.name)}</strong>
            <p>
              {t((uv && selected.uvNote ? selected.uvNote : selected.note) ??
                countryName(memory.country))}
            </p>
          </>
        )}
      </div>
      {uv && (
        <div className="simple-uv-memory">
          <strong>
            {memory.visits
              ? t(`${memory.visits} ${memory.visits === 1 ? "séjour" : "séjours"}`)
              : t("Visité")}
          </strong>
          {memory.uvNote && <p>{t(memory.uvNote)}</p>}
        </div>
      )}
      <div className="simple-travel-sticker">
        <h3 className="country-name"><CountryFlag code={memory.country} />{t(countryName(memory.country))}</h3>
        <p>
          {memory.visits
            ? t(`${memory.visits} ${memory.visits === 1 ? "visite" : "visites"}`)
            : t("Visité")}
        </p>
        {memory.places && (
          <p className="memory-places">{memory.places.map((place) => t(place)).join(", ")}</p>
        )}
      </div>
      <span className="simple-page-folio" aria-hidden="true">
        {String(index + 3).padStart(2, "0")}
      </span>
    </section>
  );
}

export function SimplePassport({
  error = false,
  pageIndex,
  uv = false,
  onUv,
  onInteractive,
  onTrack,
}: Props) {
  const { t } = useLanguage();
  return (
    <div className="simple-view-document">
      {onUv && (
        <button className="simple-uv-toggle" aria-pressed={uv} onClick={onUv}>{t("Lumière UV")}</button>
      )}
      {error && (
        <p className="simple-error" role="status">{t("La vue 3D est indisponible. Les liens restent accessibles ci-dessous.")}</p>
      )}
      <div
        className="simple-passport"
        aria-label={t("Passeport personnel de Raphaël Raclot")}
      >
        {(pageIndex === undefined || pageIndex === 0) && (
          <section
            className="simple-page simple-identity"
            aria-labelledby="simple-identity-title"
          >
            <div className="simple-page-header">
              <h2 id="simple-identity-title">{t("Passeport personnel")}</h2>
              <span>{t("Identité")}</span>
            </div>
            <div className="simple-biodata">
              <img
                src="/avatar.jpg"
                alt="Raphaël Raclot"
                width="116"
                height="153"
              />
              <dl>
                <div>
                  <dt>{t("Nom")}</dt>
                  <dd>RACLOT</dd>
                </div>
                <div>
                  <dt>{t("Prénom")}</dt>
                  <dd>RAPHAËL</dd>
                </div>
                <div>
                  <dt>{t("Pseudonyme")}</dt>
                  <dd>RAXUIS</dd>
                </div>
              </dl>
            </div>
            <dl className="simple-site">
              <dt>{t("Site")}</dt>
              <dd>raphaelraclot.dev</dd>
            </dl>
            <div className="simple-mrz" aria-hidden="true">
              {identityMachineLines.map((row, index) => (
                <span className="simple-mrz-line" key={index}>
                  {[...row].map((letter, column) => (
                    <span key={column}>{letter}</span>
                  ))}
                </span>
              ))}
            </div>
            <span className="simple-page-folio" aria-hidden="true">
              01
            </span>
          </section>
        )}
        {(pageIndex === undefined || pageIndex === 1) && (
          <section
            className="simple-page simple-visas"
            aria-labelledby="simple-visas-title"
          >
            <div className="simple-page-header">
              <h2 id="simple-visas-title">{t("Visas")}</h2>
              <span>Raxuis</span>
            </div>
            <nav
              className="simple-destinations"
              aria-label={t("Destinations du passeport")}
            >
              {destinations.map((d) => (
                <a
                  key={d.id}
                  style={
                    {
                      "--visa-paper": visaPapers[d.id],
                      "--visa-accent": visaAccents[d.id],
                    } as React.CSSProperties
                  }
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    onTrack ? onTrack(d.id) : trackDestination(d.id, "direct")
                  }
                >
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
                </a>
              ))}
            </nav>
            <span className="simple-page-folio" aria-hidden="true">
              02
            </span>
          </section>
        )}
        {travelPages.map((page, index) =>
          pageIndex === undefined || pageIndex === index + 2 ? (
            <TravelPage
              key={`${page.memory.country}-${index}`}
              memory={page.memory}
              uv={uv}
              index={index}
            />
          ) : null,
        )}
      </div>
      {onInteractive && (
        <button className="simple-return" onClick={onInteractive}>{t("Revenir à la vue interactive")}</button>
      )}
    </div>
  );
}
