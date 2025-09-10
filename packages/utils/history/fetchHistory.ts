import { Translation } from "@traduxo/packages/types/translation";
import { API_BASE_URL } from "../config/apiBase";

type FetchHistoryDeps = {
  status: string;
  setTranslationHistory: (data: Translation[]) => void;
  fetchFn?: typeof fetch; // for testing/mock
  url?: string; // default API URL
  token?: string | null
};

export async function fetchHistory({
  status,
  setTranslationHistory,
  fetchFn = fetch,
  url = `${API_BASE_URL}/api/history`,
  token = null
}: FetchHistoryDeps) {
  if (status === "loading") return;

  try {
    const res = await fetchFn(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
