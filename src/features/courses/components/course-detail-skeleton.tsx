export default function CourseDetailSkeleton({ label }: { label: string }) {
  return (
    <div
      aria-busy="true"
      aria-label={label}
      className="mx-auto max-w-[1400px] px-4 py-7 sm:px-6 sm:py-9 lg:px-8"
    >
      <div className="mb-6 h-5 w-36 animate-pulse rounded bg-[#D8E3EC]" />
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(19rem,24rem)_minmax(0,1fr)]">
        <div className="order-1 min-w-0 space-y-8 lg:order-2">
          <div className="grid overflow-hidden rounded-[1.75rem] bg-[#DDEAF2] lg:grid-cols-[minmax(0,1fr)_36%]">
            <div className="order-2 space-y-5 p-7 lg:order-1">
              <div className="h-5 w-40 animate-pulse rounded bg-[#C6D9E5]" />
              <div className="h-12 w-4/5 animate-pulse rounded bg-[#C6D9E5]" />
              <div className="h-5 w-full animate-pulse rounded bg-[#C6D9E5]" />
              <div className="h-5 w-3/4 animate-pulse rounded bg-[#C6D9E5]" />
            </div>
            <div className="order-1 aspect-[16/10] animate-pulse bg-[#C6D9E5] lg:order-2 lg:aspect-auto lg:min-h-[25rem]" />
          </div>
          <div className="h-12 animate-pulse rounded-xl bg-[#EAF2F7]" />
          <div className="h-16 animate-pulse rounded-xl bg-[#EAF2F7]" />
          <div className="h-64 animate-pulse rounded-2xl bg-[#EAF2F7]" />
        </div>
        <div className="order-2 h-72 animate-pulse rounded-2xl bg-[#EAF2F7] lg:order-1" />
      </div>
    </div>
  );
}
