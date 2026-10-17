import { describe, it, expect } from "vitest";
import { evaluateCondition, computeVisibility } from "../skipLogic";

describe("evaluateCondition", () => {
  it("evaluates equality", () => {
    expect(evaluateCondition("${q1} = 'F'", { q1: "F" })).toBe(true);
    expect(evaluateCondition("${q1} = 'F'", { q1: "M" })).toBe(false);
  });

  it("evaluates numeric comparison", () => {
    expect(evaluateCondition("${age} > 18", { age: 25 })).toBe(true);
    expect(evaluateCondition("${age} > 18", { age: 12 })).toBe(false);
    expect(evaluateCondition("${age} >= 18", { age: 18 })).toBe(true);
  });

  it("evaluates and/or/not", () => {
    expect(
      evaluateCondition("${g} = 'F' and ${age} > 18", { g: "F", age: 25 }),
    ).toBe(true);
    expect(
      evaluateCondition("${g} = 'F' and ${age} > 18", { g: "M", age: 25 }),
    ).toBe(false);
    expect(
      evaluateCondition("${g} = 'F' or ${age} < 18", { g: "M", age: 15 }),
    ).toBe(true);
    expect(evaluateCondition("not (${x} = 'yes')", { x: "no" })).toBe(true);
  });

  it("evaluates selected()", () => {
    expect(
      evaluateCondition("selected(${hobbies}, 'reading')", {
        hobbies: ["reading", "sports"],
      }),
    ).toBe(true);
    expect(
      evaluateCondition("selected(${hobbies}, 'cooking')", {
        hobbies: ["reading", "sports"],
      }),
    ).toBe(false);
  });

  it("evaluates count-selected()", () => {
    expect(
      evaluateCondition("count-selected(${hobbies}) > 1", {
        hobbies: ["a", "b"],
      }),
    ).toBe(true);
    expect(
      evaluateCondition("count-selected(${hobbies}) > 1", { hobbies: ["a"] }),
    ).toBe(false);
  });

  it("handles parentheses precedence", () => {
    expect(
      evaluateCondition("(${a} = 'x' or ${b} = 'y') and ${c} > 0", {
        a: "x",
        b: "z",
        c: 1,
      }),
    ).toBe(true);
    expect(
      evaluateCondition("(${a} = 'x' or ${b} = 'y') and ${c} > 0", {
        a: "z",
        b: "z",
        c: 1,
      }),
    ).toBe(false);
  });

  it("fails safe on malformed expression", () => {
    expect(evaluateCondition("${unclosed", {})).toBe(true);
    expect(evaluateCondition("${x} = ", { x: 1 })).toBe(true);
  });
});

describe("computeVisibility", () => {
  it("hides target question when condition is true", () => {
    const questions = [
      { questionId: "q1", skipLogic: [] },
      {
        questionId: "q2",
        skipLogic: [
          {
            condition: "${q1} = 'yes'",
            action: "HIDE",
            targetQuestionId: "q2",
          },
        ],
      },
    ];
    const { visible } = computeVisibility(questions, { q1: "yes" });
    expect(visible.has("q2")).toBe(false);
  });

  it("shows target question when condition is true", () => {
    const questions = [
      { questionId: "q1" },
      {
        questionId: "q2",
        skipLogic: [
          {
            condition: "${q1} = 'yes'",
            action: "SHOW",
            targetQuestionId: "q2",
          },
        ],
      },
    ];
    const { visible } = computeVisibility(questions, { q1: "yes" });
    expect(visible.has("q2")).toBe(true);
  });

  it("adds question to required set", () => {
    const questions = [
      { questionId: "q1", skipLogic: [] },
      {
        questionId: "q2",
        skipLogic: [{ condition: "${q1} = 'yes'", action: "REQUIRE" }],
      },
    ];
    const { required } = computeVisibility(questions, { q1: "yes" });
    expect(required.has("q2")).toBe(true);
  });
});