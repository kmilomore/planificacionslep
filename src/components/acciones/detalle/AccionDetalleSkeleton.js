import Skeleton from '../../ui/Skeleton';

export default function AccionDetalleSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <section className="w-full rounded-card border border-slate-100 bg-white p-6 shadow-card lg:p-8 space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3 w-full max-w-3xl">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-8 w-28 rounded-full" rounded="rounded-full" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-32" />
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-100 bg-slate-50 p-5 space-y-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="rounded-2xl border border-slate-100 bg-white p-4 space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-5 w-40" />
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-100 bg-white p-5 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-8 w-28 rounded-full" rounded="rounded-full" />
              </div>
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 space-y-4">
                <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_auto]">
                  <Skeleton className="h-11 w-full" />
                  <Skeleton className="h-11 w-full" />
                  <Skeleton className="h-11 w-36" />
                  <Skeleton className="h-11 w-full lg:col-span-2" />
                  <Skeleton className="h-24 w-full lg:col-span-3" />
                </div>
              </div>
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Skeleton className="h-5 w-56" />
                    <Skeleton className="h-9 w-28" />
                  </div>
                  <Skeleton className="h-4 w-80" />
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((__, innerIndex) => (
                      <Skeleton key={innerIndex} className="h-16 w-full" />
                    ))}
                  </div>
                </div>
              ))}
            </section>
          </div>

          <aside className="space-y-4">
            {Array.from({ length: 2 }).map((_, index) => (
              <section key={index} className="rounded-2xl border border-slate-100 bg-white p-5 space-y-4">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
              </section>
            ))}
          </aside>
        </div>
      </section>
    </div>
  );
}