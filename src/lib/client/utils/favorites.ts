type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

export async function addToFavorite(
  translations: string[],
  inputLang: string,
  outputLang: string,
  setTranslationId: SetState<string | undefined>,
  setIsFavorite: SetState<boolean>
) {
  try {
    const res = await fetch("/api/favorite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ translations, inputLang, outputLang }),
    });

    if (res.status === 401) {
      return "You need to log in to add translation to favorites"
    }

    if (!res.ok) throw new Error("Failed to add favorite");

    const data = await res.json();
    // Assume backend returns { id: "favoriteId" }
    setTranslationId(data.id);
    setIsFavorite(true);
  } catch (error) {
    console.error("Error adding favorite:", error);
  }
}

export async function deleteFromFavorite(
  translationId: string | undefined,
  setTranslationId: SetState<string | undefined>,
  setIsFavorite: SetState<boolean>
) {
  if (!translationId) return;

  try {
    const res = await fetch("/api/favorite", {
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
