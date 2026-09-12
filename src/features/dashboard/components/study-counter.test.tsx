import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import StudyCounter from "./study-counter";

describe("StudyCounter", () => {
  afterEach(() => cleanup());

  it("renders the final value immediately for assistive tech", () => {
    render(<StudyCounter value={47} />);

    expect(screen.getByText("47")).toBeInTheDocument();
  });

  it("applies a custom formatter", () => {
    render(<StudyCounter value={125} format={(n) => `${n} دقيقة`} />);

    expect(screen.getByText("125 دقيقة")).toBeInTheDocument();
  });
});
