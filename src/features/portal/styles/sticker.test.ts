import { readFileSync } from "node:fs";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

const stickerCss = readFileSync(
  path.resolve(process.cwd(), "src/features/portal/styles/sticker.css"),
  "utf8",
);

describe("sticker tile color variants", () => {
  afterEach(() => {
    document.querySelectorAll("style[data-sticker-test]").forEach((style) => style.remove());
    document.body.replaceChildren();
  });

  it.each([
    {
      name: "light",
      wrapperClass: "",
      variantClass: "blue-surface",
      expectedBackground: "rgb(2, 132, 199)",
    },
    {
      name: "dark",
      wrapperClass: "dark",
      variantClass: "red-surface",
      expectedBackground: "rgba(239, 68, 68, 0.1)",
    },
  ])("lets an explicit $name color override the default tile surface", ({
    wrapperClass,
    variantClass,
    expectedBackground,
  }) => {
    const style = document.createElement("style");
    style.dataset.stickerTest = "true";
    style.textContent = `
      :root {
        --color-surface: rgb(255, 255, 255);
        --color-ink: rgb(15, 23, 42);
      }
      .blue-surface { background-color: rgb(2, 132, 199); }
      .red-surface:where(.dark, .dark *) { background-color: rgba(239, 68, 68, 0.1); }
      ${stickerCss}
    `;
    document.head.append(style);

    const wrapper = document.createElement("div");
    wrapper.className = wrapperClass;
    const tile = document.createElement("div");
    tile.className = `sticker-tile ${variantClass}`;
    wrapper.append(tile);
    document.body.append(wrapper);

    expect(getComputedStyle(tile).backgroundColor).toBe(expectedBackground);
  });
});
