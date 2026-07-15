import { getTranslations } from "next-intl/server";
import { CircleCheck, CircleX } from "lucide-react";
import { cn } from "@/src/lib/cn";
import { Button } from "@/src/components/ui/button";
import { Section } from "@/src/components/ui/section";
import { Reveal } from "@/src/components/ui/reveal";
import { COMPARISON_MATRIX } from "@/src/features/marketing/data";

type RowKey = keyof typeof COMPARISON_MATRIX;
const ROW_KEYS: RowKey[] = ["leak", "pay", "organize", "reports", "app", "setup"];

const ROW_LABEL: Record<RowKey, string> = {
  leak: "rowLeak",
  pay: "rowPay",
  organize: "rowOrganize",
  reports: "rowReports",
  app: "rowApp",
  setup: "rowSetup",
};

type ColKey = "elemni" | "whatsapp" | "youtube" | "others";
const COL_KEYS: { key: ColKey; msgKey: "colElemni" | "colWhatsapp" | "colYoutube" | "colOthers" }[] = [
  { key: "elemni", msgKey: "colElemni" },
  { key: "whatsapp", msgKey: "colWhatsapp" },
  { key: "youtube", msgKey: "colYoutube" },
  { key: "others", msgKey: "colOthers" },
];

export async function ComparisonTable() {
  const t = await getTranslations("comparison");

  function renderCell(value: boolean | "partial" | string) {
    if (typeof value === "boolean") {
      return value ? (
        <CircleCheck className="size-5 text-success-700 shrink-0" />
      ) : (
        <CircleX className="size-5 text-danger-500 shrink-0" />
      );
    }
    if (value === "partial") {
      return (
        <span className="inline-flex items-center rounded-full bg-accent-400/15 px-2.5 py-0.5 text-xs font-semibold text-accent-600">
          {t("partial")}
        </span>
      );
    }
    return <span className="text-sm">{t(value)}</span>;
  }

  const headingWords = t("heading").split(t("highlight"));
  const highlight = t("highlight");

  return (
    <Section className="bg-brand-50" id="comparison">
      <Reveal>
        <h2 className="mb-3 text-center text-3xl font-bold tracking-tight text-ink md:text-4xl">
          {headingWords[0]}
          <span className="underline-accent text-brand-600">{highlight}</span>
          {headingWords[1]}
        </h2>
        <p className="mx-auto mb-10 max-w-2xl text-center text-muted">{t("subtitle")}</p>
      </Reveal>

      <Reveal
        delay={80}
        className="overflow-x-auto rounded-card border border-brand-200"
      >
        <table className="w-full min-w-[640px] table-fixed border-collapse text-center text-sm">
          <thead>
            <tr>
              <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted bg-white">
                &zwnj;
              </th>
              {COL_KEYS.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-xs font-bold uppercase tracking-wider",
                    col.key === "elemni"
                      ? "text-white bg-brand-600"
                      : "text-muted bg-white",
                  )}
                >
                  {t(col.msgKey)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROW_KEYS.map((rowKey) => {
              const row = COMPARISON_MATRIX[rowKey];
              return (
                <tr key={rowKey} className="border-t border-brand-100">
                  <td className="px-4 py-3 text-start text-sm font-medium text-ink bg-white">
                    {t(ROW_LABEL[rowKey])}
                  </td>
                  {COL_KEYS.map((col) => {
                    const cellValue = row[col.key];
                    return (
                      <td
                        key={col.key}
                        className={cn(
                          "px-4 py-3",
                          col.key === "elemni"
                            ? "bg-brand-50 font-semibold"
                            : "bg-white",
                        )}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          {renderCell(cellValue)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </Reveal>

      <Reveal delay={160} className="mt-10 text-center">
        <Button variant="primary">{t("cta")}</Button>
      </Reveal>
    </Section>
  );
}
