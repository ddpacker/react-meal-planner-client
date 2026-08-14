export type AppNavItem = {
  label: string;
  to: string;
  end?: boolean;
};

export const APP_NAV_ITEMS: AppNavItem[] = [
  { label: 'Meal plans', to: '/', end: true },
  { label: 'Recipes', to: '/recipes' },
  { label: 'Grocery', to: '/grocery' },
];
