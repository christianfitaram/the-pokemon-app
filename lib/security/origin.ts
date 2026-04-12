const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "https://project1.enricfitaram.dev",
  "https://www.project1.enricfitaram.dev",
];

export function getAllowedOrigins(): string[] {
  const configuredOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return configuredOrigins.length > 0 ? configuredOrigins : DEFAULT_ALLOWED_ORIGINS;
}

export function isOriginAllowed(origin: string): boolean {
  return getAllowedOrigins().includes(origin);
}
