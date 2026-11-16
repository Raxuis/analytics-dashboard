import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import {
  analytics,
  summarizeAnalytics,
  type AnalyticsSummary,
} from "@/utils/analytics";
import { getDate } from "@/utils";
import "./register.css";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Passages · Raxuis",
  robots: { index: false, follow: false },
};

export default async function AnalyticsPage() {
  let summary: AnalyticsSummary | null = null;
  try {
    const [pageviews, clicks] = await Promise.all([
      analytics.retrieveDays("pageview", 7),
      analytics.retrieveDays("outbound", 7),
    ]);
    summary = summarizeAnalytics(pageviews, clicks, getDate());
  } catch {
    // Unavailable data stays unavailable. Never fill the register with invented zeros.
  }
  return <AnalyticsDashboard summary={summary} />;
}
