"use client";

import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Check, GripVertical } from "lucide-react";
import { domMax, LazyMotion, Reorder, useDragControls } from "motion/react";
import { useTranslations } from "next-intl";
import { cn } from "@/src/lib/cn";
import type { Option } from "../types";
import { moveItem } from "./attempt-state";
import type { InputProps } from "./question-inputs";
import { focusRing, idleSurface, muted, selectedSurface } from "./styles";

/** The saved order when it is complete, otherwise the order the server sent. */
export function currentOrder(options: Option[], value: InputProps["value"]) {
  const ids = options.map((option) => option.id);
  if (Array.isArray(value) && value.length === ids.length && ids.every((id) => value.includes(id))) return value;
  return ids;
}

/**
 * ordering: drag (pointer + touch, via the grip handle) plus up/down buttons.
 * Keyboard moves are announced through a polite live region.
 */
export function OrderingInput({ question, value, onChange, labelledBy }: InputProps & { labelledBy: string }) {
  const t = useTranslations("courseTests.attempt");
  const order = currentOrder(question.options, value);
  const answered = Array.isArray(value) && value.length > 0;
  const [announcement, setAnnouncement] = useState("");
  const [lastMoved, setLastMoved] = useState<string | null>(null);
  const buttons = useRef(new Map<string, HTMLButtonElement | null>());
  const byId = new Map(question.options.map((option) => [option.id, option]));

  const move = (id: string, direction: -1 | 1) => {
    const from = order.indexOf(id);
    const to = from + direction;
    if (to < 0 || to >= order.length) return;
    onChange(moveItem(order, from, to));
    setLastMoved(id);
    setAnnouncement(t("ordering.moved", { item: byId.get(id)?.text ?? "", position: to + 1, total: order.length }));
    // Keep focus on a usable button of the moved item once it re-renders.
    requestAnimationFrame(() => {
      const atEdge = to === 0 || to === order.length - 1;
      const same = buttons.current.get(`${id}:${direction}`);
      const other = buttons.current.get(`${id}:${-direction}`);
      (atEdge ? other : same)?.focus();
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <LazyMotion features={domMax} strict>
        <Reorder.Group
          as="ol"
          axis="y"
          values={order}
          onReorder={(next: string[]) => onChange(next)}
          aria-labelledby={labelledBy}
          className="m-0 flex list-none flex-col gap-2 p-0"
        >
          {order.map((id, index) => (
            <OrderingItem
              key={id}
              option={byId.get(id)!}
              index={index}
              count={order.length}
              highlighted={lastMoved === id}
              onMove={(direction) => move(id, direction)}
              registerButton={(direction, node) => buttons.current.set(`${id}:${direction}`, node)}
            />
          ))}
        </Reorder.Group>
      </LazyMotion>
      {!answered ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className={cn("text-xs", muted)}>{t("ordering.notAnswered")}</span>
          <button
            type="button"
            onClick={() => onChange([...order])}
            className={cn(
              "inline-flex min-h-11 items-center gap-1.5 rounded-full border-[1.5px] border-slate-300 px-4 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800",
              focusRing,
            )}
          >
            <Check aria-hidden="true" className="size-4" />
            {t("ordering.keep")}
          </button>
        </div>
      ) : null}
      <p aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}

function OrderingItem({
  option,
  index,
  count,
  highlighted,
  onMove,
  registerButton,
}: {
  option: Option;
  index: number;
  count: number;
  highlighted: boolean;
  onMove: (direction: -1 | 1) => void;
  registerButton: (direction: -1 | 1, node: HTMLButtonElement | null) => void;
}) {
  const t = useTranslations("courseTests.attempt");
  const controls = useDragControls();
  const [dragging, setDragging] = useState(false);
  const iconButton = cn(
    "grid size-11 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:size-9 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800",
    focusRing,
  );

  return (
    <Reorder.Item
      value={option.id}
      dragListener={false}
      dragControls={controls}
      onDragStart={() => setDragging(true)}
      onDragEnd={() => setDragging(false)}
      animate={{ rotate: dragging ? -1 : 0, scale: dragging ? 1.02 : 1 }}
      className={cn(
        "flex items-center gap-2 rounded-[14px] py-2 pe-2 ps-1 transition-[background-color,border-color,box-shadow] sm:gap-3",
        dragging || highlighted ? selectedSurface : idleSurface,
      )}
    >
      <span
        aria-hidden="true"
        title={t("ordering.drag", { item: option.text })}
        onPointerDown={(event) => {
          event.preventDefault();
          controls.start(event);
        }}
        className="grid h-11 w-8 shrink-0 cursor-grab touch-none place-items-center rounded-lg text-slate-400 active:cursor-grabbing"
      >
        <GripVertical className="size-5" />
      </span>
      <span
        className={cn(
          "grid size-[26px] shrink-0 place-items-center rounded-lg text-[13px] font-bold tabular-nums",
          dragging || highlighted ? "bg-sky-700 text-white dark:bg-sky-500 dark:text-slate-950" : "bg-slate-100 dark:bg-slate-800",
        )}
      >
        {index + 1}
      </span>
      <span dir="auto" className="min-w-0 flex-1 break-words text-sm sm:text-[15px]">
        {option.text}
      </span>
      <button
        type="button"
        ref={(node) => { registerButton(-1, node); }}
        aria-label={t("ordering.moveUp", { item: option.text })}
        disabled={index === 0}
        onClick={() => onMove(-1)}
        className={iconButton}
      >
        <ArrowUp aria-hidden="true" className="size-4" />
      </button>
      <button
        type="button"
        ref={(node) => { registerButton(1, node); }}
        aria-label={t("ordering.moveDown", { item: option.text })}
        disabled={index === count - 1}
        onClick={() => onMove(1)}
        className={iconButton}
      >
        <ArrowDown aria-hidden="true" className="size-4" />
      </button>
    </Reorder.Item>
  );
}
