import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import React, { Suspense } from 'react';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { NavigationStackProvider } from '@/lib/NavigationStackContext';

// Code splitting with React.lazy
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'));
const MyResults = React.lazy(() => import('./pages/MyResults'));
const Notifications = React.lazy(() => import('./pages/Notifications'));

// Loading fallback component
const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
  </div>
);

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, isAuthenticated, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Render the main app
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={
          <LayoutWrapper currentPageName={mainPageKey}>
            <MainPage />
          </LayoutWrapper>
        } />
        <Route path="/PrivacyPolicy" element={
          <LayoutWrapper currentPageName="PrivacyPolicy">
            <Suspense fallback={<PageLoader />}>
              <PrivacyPolicy />
            </Suspense>
          </LayoutWrapper>
        } />
        {isAuthenticated && (
          <Route path="/Notifications" element={
            <LayoutWrapper currentPageName="Notifications">
              <Suspense fallback={<PageLoader />}>
                <Notifications />
              </Suspense>
            </LayoutWrapper>
          } />
        )}
        {isAuthenticated && (
          <Route path="/MyResults" element={
            <LayoutWrapper currentPageName="MyResults">
              <Suspense fallback={<PageLoader />}>
                <MyResults />
              </Suspense>
            </LayoutWrapper>
          } />
        )}
        {isAuthenticated && Object.entries(Pages).map(([path, Page]) => (
          <Route
            key={path}
            path={`/${path}`}
            element={
              <LayoutWrapper currentPageName={path}>
                <Suspense fallback={<PageLoader />}>
                  <Page />
                </Suspense>
              </LayoutWrapper>
            }
          />
        ))}
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationStackProvider>
            <AuthenticatedApp />
          </NavigationStackProvider>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App