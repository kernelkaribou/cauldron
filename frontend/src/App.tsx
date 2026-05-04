import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SetupGuard } from '@/components/layout/SetupGuard';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { AppLayout } from '@/components/layout/Topbar';
import { Login } from '@/pages/Login';
import { SetupWizard } from '@/pages/SetupWizard';
import { Dashboard } from '@/pages/Dashboard';
import { NotFound } from '@/pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<SetupGuard />}>
            <Route element={<AuthGuard />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/recipes" element={<Dashboard />} />
                <Route path="/spells" element={<Dashboard />} />
                <Route path="/brews" element={<Dashboard />} />
                <Route path="/ingredients" element={<Dashboard />} />
                <Route path="/curiosities" element={<Dashboard />} />
                <Route path="/settings/profile" element={<Dashboard />} />
                <Route path="/settings/admin" element={<Dashboard />} />
              </Route>
            </Route>
            <Route path="/login" element={<Login />} />
            <Route path="/setup" element={<SetupWizard />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
