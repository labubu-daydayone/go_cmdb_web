// Material UI 不需要全局 Toaster 和 TooltipProvider
import NotFound from "@/pages/NotFound";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
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
import DNSRecords from "./pages/DNSRecords";
import Nodes from "./pages/Nodes";
import NodeGroups from "./pages/NodeGroups";
import OriginManagement from "./pages/OriginManagement";
import OriginGroups from "./pages/OriginGroups";
import CacheSettings from "./pages/CacheSettings";
import Login from "./pages/Login";
import ApiKeys from "./pages/ApiKeys";
import Certificates from "./pages/Certificates";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [isLoggedIn, navigate]);

  return isLoggedIn ? <Component {...rest} /> : null;
}

function Router() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute component={Dashboard} />} />
      <Route path="/domains" element={<ProtectedRoute component={Domains} />} />
      <Route path="/websites" element={<ProtectedRoute component={Websites} />} />
      <Route path="/line-groups" element={<ProtectedRoute component={LineGroups} />} />
      <Route path="/dns-config" element={<ProtectedRoute component={DNSConfig} />} />
      <Route path="/dns-records/:domainId" element={<ProtectedRoute component={DNSRecords} />} />
      <Route path="/nodes" element={<ProtectedRoute component={Nodes} />} />
      <Route path="/node-groups" element={<ProtectedRoute component={NodeGroups} />} />
      <Route path="/origin-management" element={<ProtectedRoute component={OriginManagement} />} />
      <Route path="/origin-groups" element={<ProtectedRoute component={OriginGroups} />} />
      <Route path="/cache-settings" element={<ProtectedRoute component={CacheSettings} />} />
      <Route path="/api-keys" element={<ProtectedRoute component={ApiKeys} />} />
      <Route path="/certificates" element={<ProtectedRoute component={Certificates} />} />
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
      >
        <MenuProvider>
          <BrowserRouter>
            <Router />
          </BrowserRouter>
        </MenuProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
