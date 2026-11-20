export const measurementHosts = [
  "passeport.raphaelraclot.dev",
  "passport.raphaelraclot.dev",
  "raxuis.vercel.app",
];
export const exclusionCookie = "passport_analytics_off";
export function isKnownBot(agent: string) {
  return /bot\b|crawler|spider|headless|lighthouse|pagespeed|pingdom|uptimerobot|vercel-screenshot|facebookexternalhit|slackbot/i.test(
    agent,
  );
}
export function excludedRequest(headers: Headers, hostname: string) {
  return (
    !measurementHosts.includes(hostname) ||
    isKnownBot(headers.get("user-agent") ?? "") ||
    /(?:^|;\s*)passport_analytics_off=1(?:;|$)/.test(
      headers.get("cookie") ?? "",
    )
  );
}
