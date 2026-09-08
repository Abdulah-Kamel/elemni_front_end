import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return {
    title: "Page Not Found",
    robots: {
      index: false,
      follow: false,
      googleBot: { index: false, follow: false },
    },
  };
}

export default async function ForTeachersPage() {
  notFound();
}
