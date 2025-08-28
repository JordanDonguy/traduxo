import { swapMainTranslation } from "@/lib/client/utils/swapMainTranslation";

describe("swapMainTranslation", () => {
  // ------ Test 1️⃣ ------
  it("swaps the main translation (index 1) with the alternative at altIndex", () => {
    const input = ["first", "main", "third", "fourth"];
    const altIndex = 2;

    const result = swapMainTranslation(input, altIndex);

    expect(result).toEqual(["first", "third", "main", "fourth"]);
  });

  // ------ Test 2️⃣ ------
  it("does not mutate the original array", () => {
    const input = ["first", "main", "third"];
    const altIndex = 2;

    const result = swapMainTranslation(input, altIndex);

    expect(input).toEqual(["first", "main", "third"]); // original stays same
    expect(result).not.toBe(input); // new array returned
  });

  // ------ Test 3️⃣ ------
  it("swapping index 1 with itself leaves array unchanged", () => {
    const input = ["a", "b", "c"];
    const result = swapMainTranslation(input, 1);

    expect(result).toEqual(["a", "b", "c"]);
  });
});
