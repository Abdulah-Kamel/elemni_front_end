import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MotionProvider } from "@/src/components/ui/motion-provider";
import { ModernSelect } from "./modern-select";

const options = [
  { value: "all", label: "كل الصفوف" },
  { value: "10", label: "Grade 10" },
  { value: "11", label: "Grade 11" },
  { value: "12", label: "Grade 12" },
];

function renderSelect(onChange = vi.fn()) {
  render(
    <MotionProvider>
      <div style={{ overflow: "hidden", height: 40 }}>
        <ModernSelect label="الصف الدراسي" options={options} value="all" onChange={onChange} />
      </div>
    </MotionProvider>,
  );
  return onChange;
}

describe("ModernSelect", () => {
  afterEach(() => cleanup());

  it("renders the open menu in a portal on body so parents can't clip it", () => {
    renderSelect();
    fireEvent.click(screen.getByRole("button", { name: /الصف الدراسي/ }));
    const listbox = screen.getByRole("listbox", { name: "الصف الدراسي" });
    expect(listbox.parentElement).toBe(document.body);
    expect(screen.getAllByRole("option")).toHaveLength(4);
  });

  it("supports keyboard selection", () => {
    const onChange = renderSelect();
    const trigger = screen.getByRole("button", { name: /الصف الدراسي/ });
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    fireEvent.keyDown(trigger, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith("11");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("closes on outside click and Escape", () => {
    renderSelect();
    const trigger = screen.getByRole("button", { name: /الصف الدراسي/ });
    fireEvent.click(trigger);
    fireEvent.keyDown(trigger, { key: "Escape" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(trigger);
    fireEvent.mouseDown(document.body);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});
