"use client"

type TranslationHistory = {
  id: string;
  inputText: string;
  translation: string;
  inputLang: string;
  outputLang: string;
  alt1: string | null;
  alt2: string | null;
  alt3: string | null;
};

type FetchHistoryDeps = {
  status: string;
  setTranslationHistory: (data: TranslationHistory[]) => void;
  fetchFn?: typeof fetch; // optional for testing/mock
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
