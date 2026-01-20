// Material UI 不需要全局 Toaster 和 TooltipProvider
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
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
import CacheSettings from "./pages/CacheSettings";
import Login from "./pages/Login";
import ApiKeys from "./pages/ApiKeys";
import Certificates from "./pages/Certificates";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const [, setLocation] = useLocation();
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  useEffect(() => {
    if (!isLoggedIn) {
      setLocation('/login');
    }
  }, [isLoggedIn, setLocation]);

  return isLoggedIn ? <Component {...rest} /> : null;
}

function Router() {
  return (
    <Switch>
      <Route path={"/login"} component={Login} />
      <Route path={"/"}>
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path={"/domains"}>
        <ProtectedRoute component={Domains} />
      </Route>
      <Route path={"/websites"}>
        <ProtectedRoute component={Websites} />
      </Route>
      <Route path={"/line-groups"}>
        <ProtectedRoute component={LineGroups} />
      </Route>
      <Route path={"/dns-config"}>
        <ProtectedRoute component={DNSConfig} />
      </Route>
      <Route path={"/nodes"}>
        <ProtectedRoute component={Nodes} />
      </Route>
      <Route path={"/node-groups"}>
        <ProtectedRoute component={NodeGroups} />
      </Route>
      <Route path={"/origin-management"}>
        <ProtectedRoute component={OriginManagement} />
      </Route>
      <Route path={"/origin-groups"}>
        <ProtectedRoute component={OriginGroups} />
      </Route>
      <Route path={"/cache-settings"}>
        <ProtectedRoute component={CacheSettings} />
      </Route>
      <Route path={"/api-keys"}>
        <ProtectedRoute component={ApiKeys} />
      </Route>
      <Route path={"/certificates"}>
        <ProtectedRoute component={Certificates} />
      </Route>
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
          <Router />
        </MenuProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
