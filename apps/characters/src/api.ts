const API = "https://rickandmortyapi.com/api";

export type Page<T> = {
  info: { pages: number; count: number };
  results: T[];
};

export type Character = {
  id: number;
  name: string;
  status: string;
  species: string;
  image: string;
  location: { name: string; url: string };
  episode: string[];
};

export function idFromUrl(url: string): number | null {
  if (!url) return null;
  const id = Number(url.split("/").filter(Boolean).pop());
  return Number.isFinite(id) && id > 0 ? id : null;
}

export async function fetchPage<T>(resource: string, page: number, name: string): Promise<Page<T>> {
  const url = new URL(`${API}/${resource}`);
  url.searchParams.set("page", String(page));
  if (name.trim()) url.searchParams.set("name", name.trim());
  const response = await fetch(url);
  if (response.status === 404) return { info: { pages: 0, count: 0 }, results: [] };
  if (!response.ok) throw new Error(`A API respondeu ${response.status}`);
  return response.json() as Promise<Page<T>>;
}

export async function fetchByIds<T>(resource: string, ids: number[]): Promise<T[]> {
  const unique = [...new Set(ids)].filter((id) => id > 0).slice(0, 20);
  if (unique.length === 0) return [];
  const response = await fetch(`${API}/${resource}/${unique.join(",")}`);
  if (response.status === 404) return [];
  if (!response.ok) throw new Error(`A API respondeu ${response.status}`);
  const data = (await response.json()) as T | T[];
  return Array.isArray(data) ? data : [data];
}
