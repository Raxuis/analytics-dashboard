/* eslint-disable @next/next/no-img-element -- Native local images keep the non-WebGL document independent of the canvas loader. */
import React from "react";
import { travelPages, countryName } from "./travel-content";
import { cityMarkers, TRAVEL_MAP } from "./travel-layout";
import {
  destinations,
  trackDestination,
  type DestinationId,
} from "./destinations";

type Props = {
  error?: boolean;
  onInteractive?: () => void;
  onTrack?: (id: DestinationId) => void;
};
export function SimplePassport({
  error = false,
  onInteractive,
  onTrack,
}: Props) {
  return (
    <div className="simple-view-document">
      {error && (
        <p className="simple-error" role="status">
          La vue 3D est indisponible. Les liens restent accessibles ci-dessous.
        </p>
      )}
      <div
        className="simple-passport"
        aria-label="Passeport personnel de Raphaël Raclot"
      >
        <section
          className="simple-page simple-identity"
          aria-labelledby="simple-identity-title"
        >
          <div className="simple-page-header">
            <h2 id="simple-identity-title">Passeport personnel</h2>
            <span>Identité</span>
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
                <dt>Nom</dt>
                <dd>RACLOT</dd>
              </div>
              <div>
                <dt>Prénom</dt>
                <dd>RAPHAËL</dd>
              </div>
              <div>
                <dt>Pseudonyme</dt>
                <dd>RAXUIS</dd>
              </div>
            </dl>
          </div>
          <dl className="simple-site">
            <dt>Site</dt>
            <dd>raphaelraclot.dev</dd>
          </dl>
          <div className="simple-mrz" aria-hidden="true">
            <span>RAXUIS&lt;&lt;RACLOT&lt;&lt;RAPHAEL&lt;&lt;&lt;&lt;</span>
            <span>
              RAPHAELRACLOT&lt;DEV&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;
            </span>
          </div>
        </section>
        <section
          className="simple-page simple-visas"
          aria-labelledby="simple-visas-title"
        >
          <div className="simple-page-header">
            <h2 id="simple-visas-title">Visas</h2>
            <span>Raxuis</span>
          </div>
          <nav
            className="simple-destinations"
            aria-label="Destinations du passeport"
          >
            {destinations.map((d) => (
              <a
                key={d.id}
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
        </section>
        {travelPages.map((page, index) => (
          <section
            className="simple-page simple-travel"
            aria-labelledby={`travel-title-${index}`}
            key={`${page.memory.country}-${index}`}
          >
            <div className="simple-page-header">
              <h2 id={`travel-title-${index}`}>Voyages</h2>
              <span>{page.title}</span>
            </div>
            <div className="simple-travel-map">
              <img
                src={`/identity/countries/${page.memory.country}.svg`}
                alt=""
              />
              {cityMarkers(page.memory).map((marker) => (
                <button
                  className="city-point"
                  key={marker.city.name}
                  aria-label={`${marker.city.name}, ${marker.country}`}
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
                    <strong>{marker.city.name}</strong>
                    <small>{marker.country}</small>
                    {marker.city.note && <span>{marker.city.note}</span>}
                  </span>
                </button>
              ))}
            </div>
            <div className="simple-travel-sticker">
              <h3>{countryName(page.memory.country)}</h3>
              <p>
                {page.memory.visits
                  ? `${page.memory.visits} ${page.memory.visits === 1 ? "visite" : "visites"}`
                  : "Visité"}
              </p>
              {page.memory.places && (
                <p className="memory-places">{page.memory.places.join(", ")}</p>
              )}
            </div>
          </section>
        ))}
      </div>
      {onInteractive && (
        <button className="simple-return" onClick={onInteractive}>
          Revenir à la vue interactive
        </button>
      )}
    </div>
  );
}
