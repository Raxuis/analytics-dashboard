"use client";
import { LanguageSwitch } from "@/i18n/LanguageSwitch";
import { translate, type Locale } from "@/i18n/language";
import { useLanguage } from "@/i18n/LanguageProvider";
import React, { useState, useTransition, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, RefreshCw, Scan } from "lucide-react";
import type { AnalyticsSummary } from "@/utils/analytics";
import { destinations } from "./passport/destinations";
import { visaAccents, visaPapers } from "./passport/passport-layout";
import isoCountries from "./passport/country-iso2.json";
import { CountryFlag } from "./passport/CountryFlag";

function dateOf(value: string) {
  const [day, month, year] = value.split("/").map(Number);
  return new Date(Date.UTC(year!, month! - 1, day));
}
function shortDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(dateOf(value));
}
function period(summary: AnalyticsSummary, locale: Locale) {
  const first = summary.days[0]?.date,
    last = summary.days.at(-1)?.date;
  if (!first || !last) return translate("Sept derniers jours", locale);
  const longDate = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return `${shortDate(first, locale)} ${locale === "en" ? "to" : "au"} ${longDate.format(dateOf(last))}`;
}
export default function AnalyticsDashboard({
  summary,
}: {
  summary: AnalyticsSummary | null;
}) {
  const { locale, t } = useLanguage();
  const numbers = new Intl.NumberFormat(locale === "en" ? "en-GB" : "fr-FR");
  const countryNames = new Intl.DisplayNames([locale], { type: "region" });
  const count = (value: number, noun: string) => {
    const word = locale === "en" ? noun === "vue" ? "view" : "click" : noun;
    return `${numbers.format(value)} ${word}${(locale === "en" ? value !== 1 : value > 1) ? "s" : ""}`;
  };
  const [uv, setUv] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [refreshing, startRefresh] = useTransition();
  const router = useRouter();
  return (
    <main className={`register-site ${uv ? "register-uv" : ""}`}>
      <header className="register-header">
        <Link href={locale === "en" ? "/en" : "/"} className="wordmark" aria-label={t("Raxuis, accueil")}>
          <Image
            src="/identity/raxuis-logo.png"
            width={28}
            height={28}
            alt=""
          />
          <span>Raxuis</span>
        </Link>
        <div className="header-actions"><LanguageSwitch />
        <Link className="register-back" href={locale === "en" ? "/en" : "/"}>
          <ArrowLeft size={15} />{t("Retour au passeport")}</Link>
        </div>
      </header>
      <div
        className="register-book"
        aria-label={t("Registre des passages de Raxuis")}
        aria-busy={refreshing}
      >
        <section
          className="register-leaf register-passages"
          aria-labelledby="register-title"
        >
          <div className="register-leaf-heading">
            <h1 id="register-title">{t("Passages")}</h1>
            <p>{summary ? period(summary, locale) : t("Sept derniers jours")}</p>
          </div>
          {summary ? (
            <>
              <table className="register-ledger">
                <caption className="sr-only">{t("Vues de l’accueil et clics sortants par journée UTC")}</caption>
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">{t("Vues")}</th>
                    <th scope="col">{t("Clics")}</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.days.map((day, index) => (
                    <tr
                      key={day.date}
                      className={
                        index === summary.days.length - 1
                          ? "register-latest"
                          : ""
                      }
                    >
                      <th scope="row">
                        <time
                          dateTime={dateOf(day.date).toISOString().slice(0, 10)}
                        >
                          {shortDate(day.date, locale)}
                        </time>
                      </th>
                      <td
                        className={
                          day.count >= 1_000_000
                            ? "register-long-number"
                            : undefined
                        }
                      >
                        {numbers.format(day.count)}
                      </td>
                      <td
                        className={
                          day.clicks >= 1_000_000
                            ? "register-long-number"
                            : undefined
                        }
                      >
                        {numbers.format(day.clicks)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row">Total</th>
                    <td>{count(summary.totalPageviews, "vue")}</td>
                    <td>{count(summary.totalClicks, "clic")}</td>
                  </tr>
                </tfoot>
              </table>
              <p className="register-timezone">{t("Journées comptées en UTC")}</p>
              {summary.totalPageviews === 0 && summary.totalClicks === 0 && (
                <p className="register-empty">{t("Aucun passage enregistré sur cette période.")}</p>
              )}
            </>
          ) : (
            <div className="register-unavailable" role="status">
              <h2>{t("Le registre est indisponible.")}</h2>
              <p>{t("Les passages ne peuvent pas être chargés pour le moment.")}</p>
              <button
                onClick={() => startRefresh(() => router.refresh())}
                disabled={refreshing}
              >
                {refreshing ? t("Actualisation…") : t("Réessayer")}
              </button>
            </div>
          )}
          <span className="register-folio" aria-hidden="true">
            01
          </span>
        </section>
        <section
          className="register-leaf register-destinations"
          aria-labelledby="register-destinations-title"
        >
          <div className="register-leaf-heading">
            <h2 id="register-destinations-title">Destinations</h2>
          </div>
          <div className="register-visas">
            {destinations.map((d) => {
              const stats = summary?.destinations.find(
                (item) => item.id === d.id,
              );
              const expanded = !!stats && (uv || selected === d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  className={`register-visa register-visa-${d.id}`}
                  style={
                    {
                      "--visa-paper": visaPapers[d.id],
                      "--visa-accent": visaAccents[d.id],
                    } as CSSProperties
                  }
                  disabled={!stats}
                  aria-expanded={expanded}
                  aria-controls={`register-origin-${d.id}`}
                  aria-label={`${d.label}, ${stats ? count(stats.count, "clic") : t("données indisponibles")}, ${t("origine des clics")}`}
                  onClick={() => setSelected(selected === d.id ? null : d.id)}
                  title={t("Origine des clics")}
                >
                  <strong>{d.label}</strong>
                  <span className="register-visa-count">
                    {stats ? count(stats.count, "clic") : t("Indisponible")}
                  </span>
                  <span
                    className="register-visa-origin"
                    id={`register-origin-${d.id}`}
                    hidden={!expanded}
                  >
                    <span>{t("Passeport")}<b>{numbers.format(stats?.scene ?? 0)}</b>
                    </span>
                    <span>{t("Liens directs")}<b>{numbers.format(stats?.direct ?? 0)}</b>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <section
            className="register-countries"
            aria-labelledby="register-countries-title"
          >
            <h2 id="register-countries-title">{t("Pays de passage")}</h2>
            {summary?.topCountries.length ? (
              <ul>
                {summary.topCountries.map(([code, views]) => {
                  const silhouette =
                    isoCountries[code as keyof typeof isoCountries];
                  const name = countryNames.of(code) ?? code;
                  return (
                    <li key={code}>
                      {silhouette ? (
                        <span
                          className="register-country-art"
                          aria-hidden="true"
                          style={{
                            maskImage: `url(/identity/countries/${silhouette}.svg)`,
                          }}
                        />
                      ) : (
                        <span
                          className="register-country-code"
                          aria-hidden="true"
                        >
                          {code}
                        </span>
                      )}
                      <span className="country-name"><CountryFlag code={code} />{name}</span>
                      <span className="register-country-count">
                        {count(views, "vue")}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="register-empty">
                {summary
                  ? t("Aucun pays renseigné sur cette période.")
                  : t("Données indisponibles.")}
              </p>
            )}
            {!!summary?.unlocatedViews && (
              <p className="register-country-note">
                {count(summary.unlocatedViews, "vue")} {t("sans pays renseigné")}
              </p>
            )}
          </section>
          <span className="register-folio" aria-hidden="true">
            02
          </span>
        </section>
      </div>
      <div
        className="register-tools"
        role="group"
        aria-label={t("Commandes du registre")}
      >
        <span>{t("7 jours")}</span>
        <button
          aria-pressed={uv}
          onClick={() => setUv((v) => !v)}
          disabled={!summary}
          title={t("Révéler l’origine des clics")}
        >
          <Scan size={16} />
          <span>UV</span>
        </button>
        <button
          onClick={() => startRefresh(() => router.refresh())}
          disabled={refreshing}
          aria-label={t("Actualiser les statistiques")}
          title={t("Actualiser")}
        >
          <RefreshCw
            size={16}
            className={refreshing ? "register-refreshing" : ""}
          />
        </button>
      </div>
      <p className="register-method">{t("Une vue correspond à un chargement de l’accueil, pas à un visiteur unique. Les clics comptent les liens activés. Les robots et les visites répétées peuvent être inclus. Conservation des données : sept jours.")}</p>
      <span className="sr-only" role="status">
        {refreshing
          ? t("Actualisation des statistiques…")
          : uv
            ? t("UV activé. Origine des clics révélée sur chaque visa.")
            : ""}
      </span>
    </main>
  );
}
