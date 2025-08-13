import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import HistoryPage from "@/pages/history";
import HistoryDetailPage from "@/pages/history-detail";
import { ReconciliationProvider } from "@/context/reconciliation-context";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home}/>
      <Route path="/history" component={HistoryPage}/>
      <Route path="/history/:sessionId" component={HistoryDetailPage}/>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ReconciliationProvider>
          <Toaster />
          <Router />
        </ReconciliationProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
