"use client";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import type { StudentSessionChange } from "@/src/lib/student-api/session-events";
import { studentQueryKeys } from "@/src/features/student/query-keys";

function createStudentQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: 1,
      },
      mutations: { retry: 0 },
    },
  });
}

export default function StudentQueryProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [queryClient] = useState(createStudentQueryClient);

  useEffect(() => {
    const handleSessionChange = (event: Event) => {
      const change = (event as CustomEvent<StudentSessionChange>).detail;

      if (change === "logout") {
        queryClient.removeQueries({ queryKey: studentQueryKeys.all });
        return;
      }

      void queryClient.invalidateQueries({ queryKey: studentQueryKeys.all });
    };

    window.addEventListener("student-session-changed", handleSessionChange);
    return () =>
      window.removeEventListener("student-session-changed", handleSessionChange);
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
