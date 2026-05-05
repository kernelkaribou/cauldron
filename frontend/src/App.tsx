import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SetupGuard } from '@/components/layout/SetupGuard';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { AppLayout } from '@/components/layout/Topbar';
import { Login } from '@/pages/Login';
import { SetupWizard } from '@/pages/SetupWizard';
import { Dashboard } from '@/pages/Dashboard';
import { NotFound } from '@/pages/NotFound';
import { CraftList } from '@/pages/crafts/CraftList';
import { CraftNew } from '@/pages/crafts/CraftNew';
import { CraftDetail } from '@/pages/crafts/CraftDetail';
import { CraftEdit } from '@/pages/crafts/CraftEdit';
import { TechniqueList } from '@/pages/techniques/TechniqueList';
import { TechniqueNew } from '@/pages/techniques/TechniqueNew';
import { TechniqueDetail } from '@/pages/techniques/TechniqueDetail';
import { TechniqueEdit } from '@/pages/techniques/TechniqueEdit';
import { ProjectList } from '@/pages/projects/ProjectList';
import { ProjectNew } from '@/pages/projects/ProjectNew';
import { ProjectDetail } from '@/pages/projects/ProjectDetail';
import { ProjectEdit } from '@/pages/projects/ProjectEdit';
import { SupplyList } from '@/pages/supplies/SupplyList';
import { SupplyNew } from '@/pages/supplies/SupplyNew';
import { SupplyDetail } from '@/pages/supplies/SupplyDetail';
import { SupplyEdit } from '@/pages/supplies/SupplyEdit';
import { TypeList } from '@/pages/supplies/types/TypeList';
import { TypeNew } from '@/pages/supplies/types/TypeNew';
import { TypeEdit } from '@/pages/supplies/types/TypeEdit';
import { CuriosityList } from '@/pages/curiosities/CuriosityList';
import { CuriosityNew } from '@/pages/curiosities/CuriosityNew';
import { CuriosityDetail } from '@/pages/curiosities/CuriosityDetail';
import { CuriosityEdit } from '@/pages/curiosities/CuriosityEdit';
import { ProfileSettings } from '@/pages/ProfileSettings';
import { AdminSettings } from '@/pages/AdminSettings';

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
          <Route path="/setup" element={<SetupWizard />} />
          <Route path="/login" element={<Login />} />
          <Route element={<SetupGuard />}>
            <Route element={<AuthGuard />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/crafts" element={<CraftList />} />
                <Route path="/crafts/new" element={<CraftNew />} />
                <Route path="/crafts/:id" element={<CraftDetail />} />
                <Route path="/crafts/:id/edit" element={<CraftEdit />} />
                <Route path="/techniques" element={<TechniqueList />} />
                <Route path="/techniques/new" element={<TechniqueNew />} />
                <Route path="/techniques/:id" element={<TechniqueDetail />} />
                <Route path="/techniques/:id/edit" element={<TechniqueEdit />} />
                <Route path="/projects" element={<ProjectList />} />
                <Route path="/projects/new" element={<ProjectNew />} />
                <Route path="/projects/:id" element={<ProjectDetail />} />
                <Route path="/projects/:id/edit" element={<ProjectEdit />} />
                <Route path="/supplies" element={<SupplyList />} />
                <Route path="/supplies/new" element={<SupplyNew />} />
                <Route path="/supplies/types" element={<TypeList />} />
                <Route path="/supplies/types/new" element={<TypeNew />} />
                <Route path="/supplies/types/:id/edit" element={<TypeEdit />} />
                <Route path="/supplies/:id" element={<SupplyDetail />} />
                <Route path="/supplies/:id/edit" element={<SupplyEdit />} />
                <Route path="/curiosities" element={<CuriosityList />} />
                <Route path="/curiosities/new" element={<CuriosityNew />} />
                <Route path="/curiosities/:id" element={<CuriosityDetail />} />
                <Route path="/curiosities/:id/edit" element={<CuriosityEdit />} />
                <Route path="/settings/profile" element={<ProfileSettings />} />
                <Route path="/settings/admin" element={<AdminSettings />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
