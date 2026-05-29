import { useListDoctrineRules, getListDoctrineRulesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Doctrine() {
  const { data: rules, isLoading } = useListDoctrineRules({ query: { queryKey: getListDoctrineRulesQueryKey() } });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h1 className="text-2xl font-bold tracking-widest text-primary">DOCTRINE_RULES</h1>
      </div>

      <div className="space-y-4">
        {isLoading ? (
           Array.from({ length: 3 }).map((_, i) => (
             <Skeleton key={i} className="h-24 w-full bg-muted rounded-none" />
          ))
        ) : rules?.length ? (
          rules.map(rule => (
            <Card key={rule.id} className={`bg-transparent border rounded-none shadow-none ${rule.active ? 'border-primary' : 'border-border opacity-50'}`}>
              <CardContent className="p-4 flex flex-col md:flex-row gap-4 justify-between md:items-center">
                <div>
                  <h3 className="text-lg font-bold text-primary mb-1 uppercase">{rule.name}</h3>
                  <p className="text-sm text-muted-foreground">{rule.description}</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="px-2 py-1 border border-border bg-card uppercase">PRIORITY: {rule.priority}</div>
                  <div className="px-2 py-1 border border-border bg-card uppercase">SCOPE: {rule.scope}</div>
                  <div className={`px-2 py-1 border uppercase ${rule.active ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground'}`}>
                    {rule.active ? 'ACTIVE' : 'INACTIVE'}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="py-12 text-center text-muted-foreground border border-dashed border-border">
            NO DOCTRINE RULES DEFINED
          </div>
        )}
      </div>
    </div>
  );
}
