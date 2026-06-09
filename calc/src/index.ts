// --- Types ---

type Operator = "+" | "-" | "*" | "/";

interface CalculatorState {
  current: string;
  previous: string;
  operator: Operator | null;
  operand: string;
  result: string | null;
  justEvaluated: boolean;
}

const state: CalculatorState = {
  current: "0",
  previous: "",
  operator: null,
  operand: "",
  result: null,
  justEvaluated: false,
};

// --- DOM ---

const resultEl = document.getElementById("result")!;
const expressionEl = document.getElementById("expression")!;

function render() {
  resultEl.textContent = state.current;

  if (state.operator && state.previous) {
    expressionEl.textContent = `${formatDisplay(state.previous)} ${state.operator}`;
  } else if (state.operand) {
    expressionEl.textContent = `${formatDisplay(state.operand)} ${state.operator ?? ""}`;
  } else {
    expressionEl.textContent = "";
  }

  resultEl.classList.toggle("small", state.current.length > 10);
}

function formatDisplay(val: string): string {
  const n = parseFloat(val);
  if (isNaN(n)) return val;
  if (val.includes(".")) return n.toLocaleString("en-US", { maximumFractionDigits: 10 });
  return n.toLocaleString("en-US");
}

// --- Math ---

function calculate(a: number, op: Operator, b: number): number {
  switch (op) {
    case "+": return a + b;
    case "-": return a - b;
    case "*": return a * b;
    case "/": return b === 0 ? NaN : a / b;
  }
}

// --- Actions ---

function inputDigit(digit: string) {
  if (state.justEvaluated) {
    state.current = digit;
    state.previous = "";
    state.operator = null;
    state.operand = "";
    state.result = null;
    state.justEvaluated = false;
    return;
  }
  // When operator is set and display still shows the first operand, start fresh
  if (state.operator !== null && state.current === state.previous) {
    state.current = digit === "." ? "0." : digit;
    return;
  }
  if (state.current === "0" && digit !== ".") {
    state.current = digit;
  } else {
    if (digit === "." && state.current.includes(".")) return;
    if (state.current.length >= 15) return;
    state.current += digit;
  }
}

function handleOperator(op: Operator) {
  const currentNum = parseFloat(state.current);

  if (state.operator && !state.justEvaluated) {
    const prevNum = parseFloat(state.previous);
    const result = calculate(prevNum, state.operator, currentNum);
    if (isNaN(result) || !isFinite(result)) {
      state.current = "Error";
      render();
      return;
    }
    state.current = String(result);
    state.previous = String(result);
  } else {
    state.previous = state.current;
  }

  state.operator = op;
  state.operand = state.current;
  state.justEvaluated = false;
}

function handleEquals() {
  if (!state.operator) return;

  const a = parseFloat(state.previous);
  const b = parseFloat(state.current);
  const result = calculate(a, state.operator, b);

  if (isNaN(result) || !isFinite(result)) {
    state.current = "Error";
    state.justEvaluated = true;
    render();
    return;
  }

  const resultStr = String(result);
  state.current = resultStr;
  state.operator = null;
  state.operand = "";
  state.justEvaluated = true;
}

function handleClear() {
  state.current = "0";
  state.previous = "";
  state.operator = null;
  state.operand = "";
  state.result = null;
  state.justEvaluated = false;
}

function handleNegate() {
  if (state.current === "0") return;
  state.current = state.current.startsWith("-")
    ? state.current.slice(1)
    : "-" + state.current;
}

function handlePercent() {
  const n = parseFloat(state.current);
  if (isNaN(n)) return;
  state.current = String(n / 100);
}

// --- Event Handling ---

function handleAction(action: string, value?: string) {
  switch (action) {
    case "clear":
      handleClear();
      break;
    case "negate":
      handleNegate();
      break;
    case "percent":
      handlePercent();
      break;
    case "add":
      handleOperator("+");
      break;
    case "subtract":
      handleOperator("-");
      break;
    case "multiply":
      handleOperator("*");
      break;
    case "divide":
      handleOperator("/");
      break;
    case "equals":
      handleEquals();
      break;
    case "num":
      if (value) inputDigit(value);
      break;
  }
  render();
}

// Click events
document.querySelector(".buttons")!.addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest("button");
  if (!btn) return;

  const action = btn.dataset.action;
  const value = btn.dataset.value;

  if (action) {
    handleAction(action, value);
  } else if (value) {
    handleAction("num", value);
  }
});

// Keyboard support
document.addEventListener("keydown", (e) => {
  const key = e.key;

  if (/^[0-9]$/.test(key)) {
    handleAction("num", key);
    render();
    e.preventDefault();
    return;
  }

  switch (key) {
    case ".":
      handleAction("num", ".");
      break;
    case "+":
      handleAction("add");
      break;
    case "-":
      handleAction("subtract");
      break;
    case "*":
      handleAction("multiply");
      break;
    case "/":
      handleAction("divide");
      break;
    case "Enter":
    case "=":
      handleAction("equals");
      break;
    case "Escape":
    case "c":
    case "C":
      handleAction("clear");
      break;
    case "%":
      handleAction("percent");
      break;
    default:
      return;
  }
  render();
  e.preventDefault();
});

render();
