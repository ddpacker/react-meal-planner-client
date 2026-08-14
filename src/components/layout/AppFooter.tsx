import { Link } from 'react-router-dom';
import logo from '../../assets/logo.svg';
import { APP_NAV_ITEMS } from './navItems';

const FOOTER_LINKS = [
  ...APP_NAV_ITEMS.map(({ label, to }) => ({ label, to })),
  { label: 'Profile', to: '/profile' },
];

export function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="mt-auto border-t border-border bg-background px-6 py-8 text-secondary"
      role="contentinfo"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <img src={logo} alt="" className="h-12 w-auto" />
          <div className="flex flex-col gap-1">
            <p className="font-semibold text-primary">Meal Planner</p>
            <p className="max-w-sm text-sm">
              Plan the week, generate recipes, and shop with a list that actually
              matches what you meant to cook.
            </p>
          </div>
        </div>

        <nav aria-label="Footer">
          <ul className="flex flex-col gap-2 text-sm md:items-end">
            {FOOTER_LINKS.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="text-secondary underline-offset-2 hover:text-primary hover:underline"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <p className="mx-auto mt-6 max-w-5xl text-sm">
        © {year} Meal Planner. All rights reserved.
      </p>
    </footer>
  );
}
