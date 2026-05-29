import { useParams, Link } from "wouter";
import { useGetWorkflow, getGetWorkflowQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function WorkflowDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  
  const { data: wf, isLoading } = useGetWorkflow(id, { query: { enabled: !!id, queryKey: getGetWorkflowQueryKey(id) } });

  if (isLoading) return <div className="p-8"><Skeleton className="h-64 w-full bg-muted rounded-none" /></div>;
  if (!wf) return <div className="p-8 text-destructive">WORKFLOW NOT FOUND</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-4 border-b border-border pb-4">
        <Link href="/workflows" className="text-muted-foreground hover:text-primary">&lt; BACK</Link>
        <h1 className="text-2xl font-bold tracking-widest text-primary uppercase">{wf.name}</h1>
      </div>

      <div className="grid gap-4">
        <div className="p-4 border border-border bg-card">
          <p className="text-sm text-muted-foreground">{wf.description}</p>
          <div className="mt-4 flex gap-4 text-xs">
             <div className="px-2 py-1 border border-border bg-black uppercase">STATUS: {wf.status}</div>
          </div>
        </div>

        <h2 className="text-lg text-primary uppercase mt-4">EXECUTION STEPS</h2>
        
        <div className="space-y-2">
          {wf.steps?.map((step, idx) => (
            <div key={step.id} className="p-4 border border-border flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-muted-foreground w-6 text-right">{idx + 1}.</div>
                <div>
                  <div className="font-bold text-primary uppercase">{step.action}</div>
                  {step.description && <div className="text-xs text-muted-foreground">{step.description}</div>}
                </div>
              </div>
              <div className="flex gap-2 text-xs">
                {step.executionMode && <div className="px-2 py-1 border border-border bg-black uppercase">{step.executionMode}</div>}
                <div className={`px-2 py-1 border uppercase ${step.status === 'completed' ? 'border-primary text-primary' : 'border-border'}`}>
                  {step.status}
                </div>
              </div>
            </div>
          ))}
          {(!wf.steps || wf.steps.length === 0) && (
            <div className="py-8 text-center text-muted-foreground border border-dashed border-border">NO STEPS DEFINED</div>
          )}
        </div>
      </div>
    </div>
  );
}
