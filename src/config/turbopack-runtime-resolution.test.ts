// @vitest-environment node

import path from "node:path";
import { createRequire } from "node:module";

import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const projectDir = process.cwd();

describe("Turbopack runtime resolution", () => {
  it("bundles runtime packages that are not resolvable from the configured Turbopack root", async () => {
    const loadConfig = require("next/dist/server/config").default as (
      phase: string,
      dir: string,
    ) => Promise<{
      transpilePackages?: string[];
      turbopack?: {
        root?: string;
        resolveAlias?: Record<string, string | { browser?: string }>;
      };
    }>;

    const config = await loadConfig("development", projectDir);
    const runtimeRoot = config.turbopack?.root ?? projectDir;
    const transpiledPackages = new Set(config.transpilePackages ?? []);
    const resolveAlias = config.turbopack?.resolveAlias ?? {};

    const canResolve = (moduleId: string) => {
      try {
        require.resolve(moduleId, { paths: [runtimeRoot] });
        return true;
      } catch {
        return false;
      }
    };

    const runtimePackagesResolveFromRoot =
      canResolve("next-intl") &&
      canResolve("next-intl/server") &&
      canResolve("@swc/helpers/package.json");

    const nextIntlAlias = resolveAlias["next-intl"];
    const nextIntlServerAlias = resolveAlias["next-intl/server"];
    const resolveAliasTarget = (alias: string) =>
      alias.startsWith(".") || alias.startsWith("/")
        ? path.resolve(runtimeRoot, alias)
        : alias;
    const aliasesPointIntoProjectNodeModules =
      typeof nextIntlAlias === "string" &&
      typeof nextIntlServerAlias === "string" &&
      resolveAliasTarget(nextIntlAlias).startsWith(
        path.join(projectDir, "node_modules", "next-intl"),
      ) &&
      resolveAliasTarget(nextIntlServerAlias).startsWith(
        path.join(projectDir, "node_modules", "next-intl"),
      );

    expect(
      runtimePackagesResolveFromRoot ||
        (aliasesPointIntoProjectNodeModules &&
          transpiledPackages.has("@swc/helpers")),
    ).toBe(true);
  });
});
