import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import Portal from "@/pages/portal";
import Dashboard from "@/pages/dashboard";
import Memory from "@/pages/memory";
import Doctrine from "@/pages/doctrine";
import Workflows from "@/pages/workflows";
import WorkflowDetail from "@/pages/workflow-detail";
import Routing from "@/pages/routing";
import Scenarios from "@/pages/scenarios";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      {/* Root — soul-level portal, no sidebar */}
      <Route path="/" component={Portal} />

      {/* All other routes — wrapped in the OCTAGON system layout */}
      <Route>
        <Layout>
          <Switch>
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/memory" component={Memory} />
            <Route path="/doctrine" component={Doctrine} />
            <Route path="/workflows" component={Workflows} />
            <Route path="/workflows/:id" component={WorkflowDetail} />
            <Route path="/routing" component={Routing} />
            <Route path="/scenarios" component={Scenarios} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
