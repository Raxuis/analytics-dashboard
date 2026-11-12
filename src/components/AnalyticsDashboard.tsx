import type { AnalyticsSummary } from "@/utils/analytics";

export default function AnalyticsDashboard({
  summary,
}: {
  summary: AnalyticsSummary;
}) {
  const maxViews = Math.max(1, ...summary.days.map((day) => day.count));
  return (
    <div className="analytics-dashboard">
      <section className="analytics-metrics" aria-label="Vues et clics">
        <article>
          <p>Vues de l’accueil</p>
          <strong>{summary.totalPageviews}</strong>
          <small>Sur sept jours</small>
        </article>
        <article>
          <p>Vues aujourd’hui</p>
          <strong>{summary.todayPageviews}</strong>
          <small>Depuis minuit UTC</small>
        </article>
        <article>
          <p>Clics sortants</p>
          <strong>{summary.totalClicks}</strong>
          <small>Sur sept jours</small>
        </article>
      </section>
      <section className="analytics-chart">
        <h2>Les passages, jour après jour</h2>
        <div className="analytics-bars" role="list">
          {summary.days.map((day) => (
            <div
              className="analytics-bar"
              role="listitem"
              key={day.date}
              aria-label={`${day.date} : ${day.count} vues`}
            >
              <strong>{day.count}</strong>
              <div className="analytics-bar-track">
                <span
                  style={{
                    height: `${Math.max(2, (day.count / maxViews) * 100)}%`,
                  }}
                />
              </div>
              <small>{day.date.slice(0, 5)}</small>
            </div>
          ))}
        </div>
      </section>
      <div className="analytics-details">
        <section className="analytics-destinations">
          <h2>Les destinations</h2>
          {summary.destinations.map((destination) => (
            <div className="analytics-row" key={destination.id}>
              <span>{destination.label}</span>
              <strong>
                {destination.count} clic{destination.count > 1 ? "s" : ""}
              </strong>
            </div>
          ))}
          {!summary.totalClicks && (
            <p>Aucun clic enregistré sur cette période.</p>
          )}
        </section>
        <section className="analytics-countries">
          <h2>Les pays de passage</h2>
          {summary.topCountries.length ? (
            summary.topCountries.map(([country, count]) => (
              <div className="analytics-row" key={country}>
                <span>{country}</span>
                <strong>
                  {count} vue{count > 1 ? "s" : ""}
                </strong>
              </div>
            ))
          ) : (
            <p>Aucun pays renseigné sur cette période.</p>
          )}
        </section>
      </div>
      <p className="analytics-note">
        Une vue est un chargement de page, pas un visiteur unique. Les clics
        comptent les activations de liens, pas les arrivées sur les sites
        externes. Les robots et visites répétées peuvent être inclus. Les
        données sont conservées sept jours.
      </p>
    </div>
  );
}
