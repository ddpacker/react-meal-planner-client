import { createBrowserRouter, Outlet, type RouteObject } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RequireAuth } from './components/RequireAuth';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import GoogleCallbackPage from './pages/GoogleCallbackPage';
import MealPlansPage from './pages/MealPlansPage';
import MealPlanDetailPage from './pages/MealPlanDetailPage';
import RecipesPage from './pages/RecipesPage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import GroceryListPage from './pages/GroceryListPage';
import ProfilePage from './pages/ProfilePage';

export function createAppRoutes(): RouteObject[] {
  return [
    {
      element: (
        <AuthProvider>
          <Outlet />
        </AuthProvider>
      ),
      children: [
        { path: 'login', element: <LoginPage /> },
        { path: 'register', element: <RegisterPage /> },
        { path: 'auth/google/callback', element: <GoogleCallbackPage /> },
        {
          element: <RequireAuth />,
          children: [
            { index: true, element: <MealPlansPage /> },
            { path: 'meal-plans/:id', element: <MealPlanDetailPage /> },
            { path: 'recipes', element: <RecipesPage /> },
            { path: 'recipes/:id', element: <RecipeDetailPage /> },
            { path: 'grocery/:listId', element: <GroceryListPage /> },
            { path: 'profile', element: <ProfilePage /> },
          ],
        },
      ],
    },
  ];
}

export const router = createBrowserRouter(createAppRoutes());
