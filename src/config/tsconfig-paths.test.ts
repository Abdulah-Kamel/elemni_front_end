import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

type TsConfig = {
  compilerOptions?: {
    paths?: Record<string, string[]>;
  };
};

describe("tsconfig runtime aliases", () => {
  it("does not map lucide-react to declaration-only files", () => {
    const tsconfigPath = path.resolve(process.cwd(), "tsconfig.json");
    const tsconfig = JSON.parse(readFileSync(tsconfigPath, "utf8")) as TsConfig;
    const lucideTargets = tsconfig.compilerOptions?.paths?.["lucide-react"] ?? [];

    expect(
      lucideTargets.every(
        (target) => !target.endsWith(".d.ts") && !target.endsWith(".d.mts"),
      ),
    ).toBe(true);
  });
});
