import { useListMemoryEntries, getListMemoryEntriesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Memory() {
  const { data: entries, isLoading } = useListMemoryEntries({}, { query: { queryKey: getListMemoryEntriesQueryKey({}) } });

  return (
    <div className="p-4 md:p-8 space-y-5 md:space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h1 className="text-2xl font-bold tracking-widest text-primary">MEMORY_BANK</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
             <Skeleton key={i} className="h-32 w-full bg-muted rounded-none" />
          ))
        ) : entries?.length ? (
          entries.map(entry => (
            <Card key={entry.id} className="bg-transparent border-border rounded-none shadow-none hover:border-primary transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm tracking-widest text-primary font-normal uppercase truncate">{entry.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground line-clamp-3 mb-4">{entry.content}</p>
                <div className="flex flex-wrap gap-2">
                  {entry.tags?.map(tag => (
                    <span key={tag} className="px-1.5 py-0.5 border border-border text-[10px] text-primary bg-primary/5">
                      {tag}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed border-border">
            MEMORY BANK EMPTY
          </div>
        )}
      </div>
    </div>
  );
}
