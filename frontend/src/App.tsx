import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SetupGuard } from '@/components/layout/SetupGuard';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { AppLayout } from '@/components/layout/Topbar';
import { Login } from '@/pages/Login';
import { SetupWizard } from '@/pages/SetupWizard';
import { Dashboard } from '@/pages/Dashboard';
import { NotFound } from '@/pages/NotFound';
import { RecipeList } from '@/pages/recipes/RecipeList';
import { RecipeNew } from '@/pages/recipes/RecipeNew';
import { RecipeDetail } from '@/pages/recipes/RecipeDetail';
import { RecipeEdit } from '@/pages/recipes/RecipeEdit';
import { SpellList } from '@/pages/spells/SpellList';
import { SpellNew } from '@/pages/spells/SpellNew';
import { SpellDetail } from '@/pages/spells/SpellDetail';
import { SpellEdit } from '@/pages/spells/SpellEdit';
import { BrewList } from '@/pages/brews/BrewList';
import { BrewNew } from '@/pages/brews/BrewNew';
import { BrewDetail } from '@/pages/brews/BrewDetail';
import { BrewEdit } from '@/pages/brews/BrewEdit';
import { IngredientList } from '@/pages/ingredients/IngredientList';
import { IngredientNew } from '@/pages/ingredients/IngredientNew';
import { IngredientDetail } from '@/pages/ingredients/IngredientDetail';
import { IngredientEdit } from '@/pages/ingredients/IngredientEdit';
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
          <Route element={<SetupGuard />}>
            <Route element={<AuthGuard />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/recipes" element={<RecipeList />} />
                <Route path="/recipes/new" element={<RecipeNew />} />
                <Route path="/recipes/:id" element={<RecipeDetail />} />
                <Route path="/recipes/:id/edit" element={<RecipeEdit />} />
                <Route path="/spells" element={<SpellList />} />
                <Route path="/spells/new" element={<SpellNew />} />
                <Route path="/spells/:id" element={<SpellDetail />} />
                <Route path="/spells/:id/edit" element={<SpellEdit />} />
                <Route path="/brews" element={<BrewList />} />
                <Route path="/brews/new" element={<BrewNew />} />
                <Route path="/brews/:id" element={<BrewDetail />} />
                <Route path="/brews/:id/edit" element={<BrewEdit />} />
                <Route path="/ingredients" element={<IngredientList />} />
                <Route path="/ingredients/new" element={<IngredientNew />} />
                <Route path="/ingredients/:id" element={<IngredientDetail />} />
                <Route path="/ingredients/:id/edit" element={<IngredientEdit />} />
                <Route path="/curiosities" element={<CuriosityList />} />
                <Route path="/curiosities/new" element={<CuriosityNew />} />
                <Route path="/curiosities/:id" element={<CuriosityDetail />} />
                <Route path="/curiosities/:id/edit" element={<CuriosityEdit />} />
                <Route path="/settings/profile" element={<ProfileSettings />} />
                <Route path="/settings/admin" element={<AdminSettings />} />
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
