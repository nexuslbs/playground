import { describe, it, expect } from "vitest";

// Pure calculator logic extracted from the app
type Operator = "+" | "-" | "*" | "/";

interface CalcState {
  current: string;
  previous: string;
  operator: Operator | null;
  operand: string;
  result: string | null;
  justEvaluated: boolean;
}

function calculate(a: number, op: Operator, b: number): number {
  switch (op) {
    case "+": return a + b;
    case "-": return a - b;
    case "*": return a * b;
    case "/": return b === 0 ? NaN : a / b;
  }
}

function percent(n: number): number {
  return n / 100;
}

function negate(n: number): number {
  return -n;
}

// --- State machine helpers for testing ---

function createState(): CalcState {
  return {
    current: "0",
    previous: "",
    operator: null,
    operand: "",
    result: null,
    justEvaluated: false,
  };
}

function getResult(st: CalcState): string {
  return st.current;
}

function inputDigit(st: CalcState, digit: string) {
  if (st.justEvaluated) {
    st.current = digit;
    st.previous = "";
    st.operator = null;
    st.operand = "";
    st.result = null;
    st.justEvaluated = false;
    return;
  }
  // When operator is set and display still shows the first operand, start fresh
  if (st.operator !== null && st.current === st.previous) {
    st.current = digit === "." ? "0." : digit;
    return;
  }
  if (st.current === "0" && digit !== ".") {
    st.current = digit;
  } else {
    if (digit === "." && st.current.includes(".")) return;
    if (st.current.length >= 15) return;
    st.current += digit;
  }
}

function handleOperator(st: CalcState, op: Operator) {
  const currentNum = parseFloat(st.current);

  if (st.operator && !st.justEvaluated) {
    const prevNum = parseFloat(st.previous);
    const result = calculate(prevNum, st.operator, currentNum);
    if (isNaN(result) || !isFinite(result)) {
      st.current = "Error";
      return;
    }
    st.current = String(result);
    st.previous = String(result);
  } else {
    st.previous = st.current;
  }

  st.operator = op;
  st.operand = st.current;
  st.justEvaluated = false;
}

function handleEquals(st: CalcState) {
  if (!st.operator) return;
  const a = parseFloat(st.previous);
  const b = parseFloat(st.current);
  const result = calculate(a, st.operator, b);

  if (isNaN(result) || !isFinite(result)) {
    st.current = "Error";
    st.justEvaluated = true;
    return;
  }

  st.current = String(result);
  st.operator = null;
  st.operand = "";
  st.justEvaluated = true;
}

function handleClear(st: CalcState) {
  st.current = "0";
  st.previous = "";
  st.operator = null;
  st.operand = "";
  st.result = null;
  st.justEvaluated = false;
}

describe("calculate", () => {
  it("adds two numbers", () => {
    expect(calculate(2, "+", 3)).toBe(5);
    expect(calculate(-1, "+", 1)).toBe(0);
    expect(calculate(0, "+", 0)).toBe(0);
    expect(calculate(0.1, "+", 0.2)).toBeCloseTo(0.3);
  });

  it("subtracts two numbers", () => {
    expect(calculate(5, "-", 3)).toBe(2);
    expect(calculate(3, "-", 5)).toBe(-2);
    expect(calculate(0, "-", 0)).toBe(0);
  });

  it("multiplies two numbers", () => {
    expect(calculate(4, "*", 3)).toBe(12);
    expect(calculate(-2, "*", 3)).toBe(-6);
    expect(calculate(0, "*", 5)).toBe(0);
  });

  it("divides two numbers", () => {
    expect(calculate(10, "/", 2)).toBe(5);
    expect(calculate(7, "/", 2)).toBe(3.5);
    expect(calculate(0, "/", 5)).toBe(0);
  });

  it("returns NaN for division by zero", () => {
    expect(calculate(5, "/", 0)).toBeNaN();
  });

  it("chains operations correctly", () => {
    const r1 = calculate(2, "+", 3); // 5
    expect(r1).toBe(5);
    const r2 = calculate(r1, "*", 4); // 20
    expect(r2).toBe(20);
  });

  it("handles large numbers", () => {
    const r = calculate(999999, "+", 1);
    expect(r).toBe(1000000);
  });

  it("handles negative results", () => {
    expect(calculate(1, "-", 100)).toBe(-99);
  });
});

describe("percent", () => {
  it("converts to percentage", () => {
    expect(percent(50)).toBe(0.5);
    expect(percent(100)).toBe(1);
    expect(percent(0)).toBe(0);
    expect(percent(200)).toBe(2);
  });
});

describe("negate", () => {
  it("negates a number", () => {
    expect(negate(5)).toBe(-5);
    expect(negate(-3)).toBe(3);
    expect(Object.is(negate(0), 0) || negate(0) === 0).toBe(true);
  });
});

describe("calculator state machine", () => {
  it("handles 78 + 96 = 174", () => {
    const st = createState();

    inputDigit(st, "7");
    inputDigit(st, "8");
    expect(getResult(st)).toBe("78");

    handleOperator(st, "+");
    expect(getResult(st)).toBe("78"); // display still shows first operand

    // BUG REPRODUCTION: after operator, next digit should start fresh
    inputDigit(st, "9");
    expect(getResult(st)).toBe("9"); // NOT "789"

    inputDigit(st, "6");
    expect(getResult(st)).toBe("96"); // NOT "7896"

    handleEquals(st);
    expect(getResult(st)).toBe("174");
  });

  it("handles 100 - 1 = 99", () => {
    const st = createState();

    inputDigit(st, "1");
    inputDigit(st, "0");
    inputDigit(st, "0");
    expect(getResult(st)).toBe("100");

    handleOperator(st, "-");
    expect(getResult(st)).toBe("100");

    inputDigit(st, "1");
    expect(getResult(st)).toBe("1"); // replaces, not "1001"

    handleEquals(st);
    expect(getResult(st)).toBe("99");
  });

  it("handles chained operations: 5 + 3 + 2 = 10", () => {
    const st = createState();

    inputDigit(st, "5");
    handleOperator(st, "+");
    inputDigit(st, "3");
    handleOperator(st, "+"); // evaluates 5+3=8, stores as new previous
    expect(getResult(st)).toBe("8");

    inputDigit(st, "2");
    expect(getResult(st)).toBe("2"); // replaces, not "82"

    handleEquals(st);
    expect(getResult(st)).toBe("10");
  });

  it("starts fresh after equals", () => {
    const st = createState();

    inputDigit(st, "2");
    inputDigit(st, "0");
    handleOperator(st, "+");
    inputDigit(st, "1");
    inputDigit(st, "0");
    handleEquals(st);
    expect(getResult(st)).toBe("30");

    // Next digit starts fresh
    inputDigit(st, "5");
    expect(getResult(st)).toBe("5");
  });

  it("handles decimal after operator", () => {
    const st = createState();

    inputDigit(st, "1");
    inputDigit(st, "0");
    handleOperator(st, "/");
    inputDigit(st, ".");
    inputDigit(st, "5");
    handleEquals(st);
    expect(getResult(st)).toBe("20");
  });

  it("handles clear", () => {
    const st = createState();

    inputDigit(st, "7");
    inputDigit(st, "8");
    handleOperator(st, "+");
    inputDigit(st, "9");
    inputDigit(st, "6");
    handleClear(st);
    expect(getResult(st)).toBe("0");
  });
});
