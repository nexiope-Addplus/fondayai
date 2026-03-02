import { Switch, Route } from "wouter";
import SkinScanPage from "@/pages/skin-scan";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";

function Router() {
  return (
    <Switch>
      <Route path="/" component={SkinScanPage} />
      <Route>
        <div className="flex items-center justify-center min-h-screen">
          404 Not Found
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
    </QueryClientProvider>
  );
}

export default App;
