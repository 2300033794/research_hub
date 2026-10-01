export function appUrl() {
  return process.env.AUTH_URL || "http://localhost:3000";
}

export async function fetchPapers(searchParams: Record<string, string | undefined> = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value) query.set(key, value);
  }
  const res = await fetch(`${appUrl()}/api/papers?${query.toString()}`, { cache: "no-store" });
  if (!res.ok) return { items: [], page: 1, pages: 1, total: 0 };
  return res.json();
}
