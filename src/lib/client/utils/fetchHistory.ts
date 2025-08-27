"use client"

import { Translation } from "../../../../types/translation";

type FetchHistoryDeps = {
  status: string;
  setTranslationHistory: (data: Translation[]) => void;
  fetchFn?: typeof fetch; // for testing/mock
  url?: string; // default API URL
};

export async function fetchHistory({
  status,
  setTranslationHistory,
  fetchFn = fetch,
  url = "/api/history",
}: FetchHistoryDeps) {
  if (status === "loading") return;

  try {
    const res = await fetchFn(url);

    if (res.status === 204) {
      setTranslationHistory([]);
    } else if (res.ok) {
      const data = await res.json();
      setTranslationHistory(data);
    } else {
      console.error("Failed to fetch history:", res.statusText);
    }
  } catch (err) {
    console.error("Error fetching history:", err);
  }
}
