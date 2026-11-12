import Link from "next/link";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import { analytics, summarizeAnalytics } from "@/utils/analytics";
import { getDate } from "@/utils";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Activité · Raxuis",
  robots: { index: false, follow: false },
};

export default async function AnalyticsPage() {
  let summary;
  try {
    const [pageviews, clicks] = await Promise.all([
      analytics.retrieveDays("pageview", 7),
      analytics.retrieveDays("outbound", 7),
    ]);
    summary = summarizeAnalytics(pageviews, clicks, getDate());
  } catch {
    return (
      <main className="analytics-page">
        <Link className="analytics-back" href="/">
          ← Retour au passeport
        </Link>
        <div className="analytics-heading">
          <p className="analytics-eyebrow">Activité</p>
          <h1>Les chiffres attendront.</h1>
          <p>
            Les statistiques sont indisponibles pour le moment. Aucun chiffre ne
            remplace les données manquantes.
          </p>
        </div>
        <section className="analytics-unavailable">
          <h2>Connexion aux statistiques indisponible</h2>
          <p>
            La configuration Redis ou la connexion au service doit être vérifiée
            côté serveur.
          </p>
          <a href="/analytics">Réessayer</a>
        </section>
      </main>
    );
  }
  return (
    <main className="analytics-page">
      <Link className="analytics-back" href="/">
        ← Retour au passeport
      </Link>
      <div className="analytics-heading">
        <p className="analytics-eyebrow">Les sept derniers jours</p>
        <h1>Au fil des passages.</h1>
        <p>
          Vues de l’accueil et clics vers les destinations. Les journées sont
          comptées en UTC.
        </p>
      </div>
      <AnalyticsDashboard summary={summary} />
    </main>
  );
}
