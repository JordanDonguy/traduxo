import { addToFavorite, deleteFromFavorite } from "@/lib/client/utils/favorites/favorites";

describe("addToFavorite", () => {
  let setTranslationId: jest.Mock;
  let setIsFavorite: jest.Mock;

  beforeEach(() => {
    setTranslationId = jest.fn();
    setIsFavorite = jest.fn();
  });

  // ------ Test 1️⃣ ------
  it("sets favorite and saves id on success", async () => {
    const fakeResponse = { id: "abc123" };
    const fetcher = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => fakeResponse,
    });

    await addToFavorite(
      ["Hello"],
      "en",
      "fr",
      setTranslationId,
      setIsFavorite,
      fetcher
    );

    // Favorite is set and translation ID is saved
    expect(setIsFavorite).toHaveBeenCalledWith(true);
    expect(setTranslationId).toHaveBeenCalledWith("abc123");
  });

  // ------ Test 2️⃣ ------
  it("returns message and resets favorite on 401", async () => {
    const fetcher = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
    });

    const result = await addToFavorite(
      ["Hello"],
      "en",
      "fr",
      setTranslationId,
      setIsFavorite,
      fetcher
    );

    // Should reset favorite and return login message
    expect(setIsFavorite).toHaveBeenCalledWith(false);
    expect(result).toBe("You need to log in to add translation to favorites");
    expect(setTranslationId).not.toHaveBeenCalled();
  });

  // ------ Test 3️⃣ ------
  it("throws error and resets favorite on non-OK", async () => {
    const fetcher = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    await addToFavorite(
      ["Hello"],
      "en",
      "fr",
      setTranslationId,
      setIsFavorite,
      fetcher
    );

    // Should reset favorite but not set translation ID
    expect(setIsFavorite).toHaveBeenCalledWith(false);
    expect(setTranslationId).not.toHaveBeenCalled();
  });
});

describe("deleteFromFavorite", () => {
  let setTranslationId: jest.Mock;
  let setIsFavorite: jest.Mock;

  beforeEach(() => {
    setTranslationId = jest.fn();
    setIsFavorite = jest.fn();
  });

  // ------ Test 4️⃣ ------
  it("does nothing if translationId is undefined", async () => {
    const fetcher = jest.fn();
    await deleteFromFavorite(
      undefined,
      setTranslationId,
      setIsFavorite,
      fetcher
    );

    // Should not call fetch or mutate state
    expect(fetcher).not.toHaveBeenCalled();
    expect(setTranslationId).not.toHaveBeenCalled();
    expect(setIsFavorite).not.toHaveBeenCalled();
  });

  // ------ Test 5️⃣ ------
  it("resets state on successful delete", async () => {
    const fetcher = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });

    await deleteFromFavorite("abc123", setTranslationId, setIsFavorite, fetcher);

    // State should be cleared
    expect(setTranslationId).toHaveBeenCalledWith(undefined);
    expect(setIsFavorite).toHaveBeenCalledWith(false);
  });

  // ------ Test 6️⃣ ------
  it("logs error on failure", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const fetcher = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    await deleteFromFavorite("abc123", setTranslationId, setIsFavorite, fetcher);

    // Error should be logged and state not mutated
    expect(consoleSpy).toHaveBeenCalled();
    expect(setTranslationId).not.toHaveBeenCalled();
    expect(setIsFavorite).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
