import { TranslationItem } from "../../../../../types/translation";

type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

export async function addToFavorite(
  translations: TranslationItem[],
  inputLang: string,
  outputLang: string,
  setTranslationId: SetState<string | undefined>,
  setIsFavorite: SetState<boolean>,
  // Injected dependencies for testing
  fetcher: typeof fetch = fetch
) {
  try {
    setIsFavorite(true);

    const res = await fetcher("/api/favorite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
  fetcher: typeof fetch = fetch
) {
  if (!translationId) return;

  try {
    const res = await fetcher("/api/favorite", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: translationId }),
    });

    if (!res.ok) throw new Error("Failed to delete favorite");

    setTranslationId(undefined);
    setIsFavorite(false);
  } catch (error) {
    console.error("Error deleting favorite:", error);
  }
}
