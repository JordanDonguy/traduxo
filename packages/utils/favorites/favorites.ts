import { TranslationItem } from "@traduxo/packages/types/translation"
import { API_BASE_URL } from "../config/apiBase";

type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

export async function addToFavorite(
  translations: TranslationItem[],
  inputLang: string,
  outputLang: string,
  setTranslationId: SetState<string | undefined>,
  setIsFavorite: SetState<boolean>,
  token?: string,
  fetcher: typeof fetch = fetch
) {
  try {
    setIsFavorite(true);
    if (!token) return;

    const res = await fetcher(`${API_BASE_URL}/favorite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ translations, inputLang, outputLang }),
    });

    if (res.status === 401) {
      setIsFavorite(false);
      return "You need to log in to add translation to favorites";
    }

    if (!res.ok) {
      setIsFavorite(false);
      throw new Error("Failed to add favorite");
    }

    const data = await res.json();
    setTranslationId(data.id);
  } catch (error) {
    console.error("Error adding favorite:", error);
  }
}

export async function deleteFromFavorite(
  translationId: string | undefined,
  setTranslationId: SetState<string | undefined>,
  setIsFavorite: SetState<boolean>,
  token?: string,
  fetcher: typeof fetch = fetch
) {
  if (!translationId) return;
  if (!token) return;

  try {
    const res = await fetcher(`${API_BASE_URL}/favorite`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ id: translationId }),
    });

    if (!res.ok) throw new Error("Failed to delete favorite");

    setTranslationId(undefined);
    setIsFavorite(false);
  } catch (error) {
    console.error("Error deleting favorite:", error);
  }
}
