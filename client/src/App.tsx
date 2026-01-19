import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { MenuProvider } from "./contexts/MenuContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Domains from "./pages/Domains";
import Websites from "./pages/Websites";
import LineGroups from "./pages/LineGroups";
import DNSConfig from "./pages/DNSConfig";
import Nodes from "./pages/Nodes";
import NodeGroups from "./pages/NodeGroups";
import OriginManagement from "./pages/OriginManagement";
import OriginGroups from "./pages/OriginGroups";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Dashboard} />
      <Route path={"/domains"} component={Domains} />
      <Route path={"/websites"} component={Websites} />
      <Route path={"/line-groups"} component={LineGroups} />
      <Route path={"/dns-config"} component={DNSConfig} />
      <Route path={"/nodes"} component={Nodes} />
      <Route path={"/node-groups"} component={NodeGroups} />
      <Route path={"/origin-management"} component={OriginManagement} />
      <Route path={"/origin-groups"} component={OriginGroups} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
      >
        <MenuProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </MenuProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
