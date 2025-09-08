"use client"

import { Translation } from "@traduxo/packages/types/translation";

type FetchHistoryDeps = {
  status: string;
  token: string | undefined;
  setTranslationHistory: (data: Translation[]) => void;
  fetchFn?: typeof fetch; // for testing/mock
  url?: string; // default API URL
};

export async function fetchHistory({
  status,
  token,
  setTranslationHistory,
  fetchFn = fetch,
  url = "/api/history",
}: FetchHistoryDeps) {
  if (status === "loading") return;

  try {
    const res = await fetchFn(url, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}), // only add if token exists
      },
    });

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
