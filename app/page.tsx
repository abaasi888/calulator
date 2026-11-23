"use client";

import { useCallback, useEffect, useState } from "react";

type Operator = "+" | "−" | "×" | "÷";

function calculate(left: number, right: number, operator: Operator): number {
  switch (operator) {
    case "+":
      return left + right;
    case "−":
      return left - right;
    case "×":
      return left * right;
    case "÷":
      return right === 0 ? Number.NaN : left / right;
  }
}

function formatResult(value: number): string {
  if (!Number.isFinite(value)) return "Error";
  return String(Number(value.toPrecision(12)));
}

export default function Home() {
  const [display, setDisplay] = useState("0");
  const [storedValue, setStoredValue] = useState<number | null>(null);
  const [pendingOperator, setPendingOperator] = useState<Operator | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [expression, setExpression] = useState("");

  const clear = useCallback(() => {
    setDisplay("0");
    setStoredValue(null);
    setPendingOperator(null);
    setWaitingForOperand(false);
    setExpression("");
  }, []);

  const enterDigit = useCallback(
    (digit: string) => {
      if (display === "Error" || waitingForOperand) {
        setDisplay(digit);
        if (!pendingOperator) setExpression("");
        setWaitingForOperand(false);
        return;
      }

      setDisplay(display === "0" ? digit : display + digit);
    },
    [display, pendingOperator, waitingForOperand],
  );

  const enterDecimal = useCallback(() => {
    if (display === "Error" || waitingForOperand) {
      setDisplay("0.");
      if (!pendingOperator) setExpression("");
      setWaitingForOperand(false);
    } else if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  }, [display, pendingOperator, waitingForOperand]);

  const chooseOperator = useCallback(
    (operator: Operator) => {
      if (display === "Error") return;
      const currentValue = Number(display);
      let nextStoredValue = currentValue;

      if (pendingOperator && storedValue !== null && !waitingForOperand) {
        nextStoredValue = calculate(storedValue, currentValue, pendingOperator);
        setDisplay(formatResult(nextStoredValue));
      }

      setStoredValue(nextStoredValue);
      setPendingOperator(operator);
      setWaitingForOperand(true);
      setExpression(`${formatResult(nextStoredValue)} ${operator}`);
    },
    [display, pendingOperator, storedValue, waitingForOperand],
  );

  const evaluate = useCallback(() => {
    if (pendingOperator && storedValue !== null && display !== "Error") {
      const result = calculate(storedValue, Number(display), pendingOperator);
      setExpression(`${formatResult(storedValue)} ${pendingOperator} ${display} =`);
      setDisplay(formatResult(result));
      setStoredValue(null);
      setPendingOperator(null);
      setWaitingForOperand(true);
    }
  }, [display, pendingOperator, storedValue]);

  const toggleSign = useCallback(() => {
    if (display !== "Error" && Number(display) !== 0) {
      setDisplay(formatResult(-Number(display)));
    }
  }, [display]);

  const applyPercent = useCallback(() => {
    if (display !== "Error") {
      setDisplay(formatResult(Number(display) / 100));
      setWaitingForOperand(false);
    }
  }, [display]);

  const backspace = useCallback(() => {
    if (display === "Error" || waitingForOperand) {
      setDisplay("0");
      setWaitingForOperand(false);
      return;
    }
    setDisplay(display.length > 1 ? display.slice(0, -1) : "0");
  }, [display, waitingForOperand]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (/^\d$/.test(event.key)) {
        enterDigit(event.key);
      } else if (event.key === ".") {
        enterDecimal();
      } else if (event.key === "+" || event.key === "-") {
        chooseOperator(event.key === "+" ? "+" : "−");
      } else if (event.key === "*" || event.key === "/") {
        chooseOperator(event.key === "*" ? "×" : "÷");
      } else if (event.key === "Enter" || event.key === "=") {
        evaluate();
      } else if (event.key === "%") {
        applyPercent();
      } else if (event.key === "Backspace") {
        backspace();
      } else if (event.key === "Escape") {
        clear();
      } else {
        return;
      }
      event.preventDefault();
    },
    [
      applyPercent,
      backspace,
      chooseOperator,
      clear,
      enterDecimal,
      enterDigit,
      evaluate,
    ],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const displaySize =
    display.length > 12 ? "calculator-display calculator-display-small" : "calculator-display";
  const operatorNames: Record<Operator, string> = {
    "÷": "Divide",
    "×": "Multiply",
    "−": "Subtract",
    "+": "Add",
  };
  const renderOperator = (operator: Operator) => (
    <button
      className={`key key-operator${pendingOperator === operator ? " key-selected" : ""}`}
      onClick={() => chooseOperator(operator)}
      aria-label={operatorNames[operator]}
      aria-pressed={pendingOperator === operator}
    >
      {operator}
    </button>
  );

  return (
    <main className="page-shell">
      <section className="calculator" aria-label="Calculator">
        <header className="calculator-header">
          <div className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div>
            <p className="eyebrow">EVERYDAY MATH</p>
            <h1>Calculator</h1>
          </div>
          <span className="header-dot" aria-hidden="true" />
        </header>

        <div className="screen" aria-live="polite" aria-atomic="true">
          <p className="expression">{expression || "\u00a0"}</p>
          <p className={displaySize}>{display}</p>
        </div>

        <div className="keypad" aria-label="Calculator keypad">
          <button className="key key-utility" onClick={clear} aria-label="Clear all">
            AC
          </button>
          <button className="key key-utility" onClick={toggleSign} aria-label="Toggle sign">
            +/−
          </button>
          <button className="key key-utility" onClick={applyPercent} aria-label="Percent">
            %
          </button>
          {renderOperator("÷")}
          {["7", "8", "9"].map((digit) => (
            <button className="key" key={digit} onClick={() => enterDigit(digit)}>
              {digit}
            </button>
          ))}
          {renderOperator("×")}
          {["4", "5", "6"].map((digit) => (
            <button className="key" key={digit} onClick={() => enterDigit(digit)}>
              {digit}
            </button>
          ))}
          {renderOperator("−")}
          {["1", "2", "3"].map((digit) => (
            <button className="key" key={digit} onClick={() => enterDigit(digit)}>
              {digit}
            </button>
          ))}
          {renderOperator("+")}
          <button
            className="key key-utility"
            onClick={backspace}
            aria-label="Delete last digit"
          >
            ⌫
          </button>
          <button className="key" onClick={() => enterDigit("0")}>
            0
          </button>
          <button className="key" onClick={enterDecimal} aria-label="Decimal point">
            .
          </button>
          <button className="key key-equals" onClick={evaluate} aria-label="Equals">
            =
          </button>
        </div>
        <footer className="calculator-footer">
          <span>Simple, by design</span>
          <span className="keyboard-hint">Keyboard ready</span>
        </footer>
      </section>
      <p className="page-note">A little clarity for your calculations.</p>
    </main>
  );
}
