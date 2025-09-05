import { swapMainTranslation } from "@packages/utils/translation/swapMainTranslation";
import { TranslationItem } from "@traduxo/packages/types/translation";

describe("swapMainTranslation", () => {
  const makeItems = (values: string[], mainIdx = 0): TranslationItem[] =>
    values.map((v, i) => ({
      value: v,
      type: i === mainIdx ? "main_translation" : "alternative",
    }));

  // ------ Test 1️⃣ ------
  it("swaps the main translation type with the selected alternative type", () => {
    const input = makeItems(["first", "main", "third", "fourth"], 1); // main at index 1
    const result = swapMainTranslation(input, "main", "third");

    // Values remain in same order
    expect(result.map(t => t.value)).toEqual(["first", "main", "third", "fourth"]);

    // Types swapped
    expect(result.find(t => t.value === "main")?.type).toBe("alternative");
    expect(result.find(t => t.value === "third")?.type).toBe("main_translation");
  });

  // ------ Test 2️⃣ ------
  it("does not mutate the original array", () => {
    const input = makeItems(["first", "main", "third"], 1);
    const result = swapMainTranslation(input, "main", "third");

    expect(input.map(t => t.value)).toEqual(["first", "main", "third"]); // original stays same
    expect(result).not.toBe(input); // new array returned
  });

  // ------ Test 3️⃣ ------
  it("attempting to swap with a non-existing alternative leaves array unchanged", () => {
    const input = makeItems(["a", "b", "c"], 1);
    const result = swapMainTranslation(input, "b", "nonexistent");

    expect(result.map(t => t.value)).toEqual(["a", "b", "c"]);
    expect(result.find(t => t.value === "b")?.type).toBe("main_translation");
  });
});
