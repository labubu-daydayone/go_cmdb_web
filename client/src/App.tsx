// Material UI 不需要全局 Toaster 和 TooltipProvider
import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import NotFound from "@/pages/NotFound";
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
  const location = useLocation();
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [isLoggedIn, navigate]);

  return isLoggedIn ? React.createElement(Component, { key: location.pathname, ...rest }) : null;
}

function Router() {
  const location = useLocation();
  
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute key={location.pathname} component={Dashboard} />} />
      <Route path="/domains" element={<ProtectedRoute key={location.pathname} component={Domains} />} />
      <Route path="/websites" element={<ProtectedRoute key={location.pathname} component={Websites} />} />
      <Route path="/line-groups" element={<ProtectedRoute key={location.pathname} component={LineGroups} />} />
      <Route path="/dns-config" element={<ProtectedRoute key={location.pathname} component={DNSConfig} />} />
      <Route path="/dns-records/:domainId" element={<ProtectedRoute key={location.pathname} component={DNSRecords} />} />
      <Route path="/nodes" element={<ProtectedRoute key={location.pathname} component={Nodes} />} />
      <Route path="/node-groups" element={<ProtectedRoute key={location.pathname} component={NodeGroups} />} />
      <Route path="/origin-management" element={<ProtectedRoute key={location.pathname} component={OriginManagement} />} />
      <Route path="/origin-groups" element={<ProtectedRoute key={location.pathname} component={OriginGroups} />} />
      <Route path="/cache-settings" element={<ProtectedRoute key={location.pathname} component={CacheSettings} />} />
      <Route path="/api-keys" element={<ProtectedRoute key={location.pathname} component={ApiKeys} />} />
      <Route path="/certificates" element={<ProtectedRoute key={location.pathname} component={Certificates} />} />
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
