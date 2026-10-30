import { describe, expect, it } from "vitest";
import { quizOptionOrder } from "@/lib/quizOptionOrder";

describe("quiz option display order", () => {
  it("changes display positions without changing the indices sent for scoring", () => {
    const options = ["Correct", "Second", "Third", "Fourth"];
    const order = quizOptionOrder(4, () => 0);
    expect(order).toEqual([1, 2, 3, 0]);
    expect(options[order[3]]).toBe("Correct");
    expect(order[3]).toBe(0); // A choice at display position 3 is scored as canonical 0.
    expect(options).toEqual(["Correct", "Second", "Third", "Fourth"]);
  });

  it("retains every canonical option exactly once", () => {
    for (const random of [() => 0, () => 0.49, () => 0.999999]) {
      expect([...quizOptionOrder(4, random)].sort()).toEqual([0, 1, 2, 3]);
    }
  });
});
