import { Button, List, ListItemButton, ListItemText } from '@mui/material';
import { NavLink } from 'react-router-dom';
import { APP_NAV_ITEMS } from './navItems';

type AppNavProps = {
  variant: 'desktop' | 'drawer';
  onNavigate?: () => void;
};

export function AppNav({ variant, onNavigate }: AppNavProps) {
  if (variant === 'drawer') {
    return (
      <List>
        {APP_NAV_ITEMS.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            end={Boolean(item.end)}
            onClick={onNavigate}
            sx={{
              color: 'text.secondary',
              '&.active': {
                color: 'primary.main',
                fontWeight: 600,
              },
            }}
          >
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    );
  }

  return (
    <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
      {APP_NAV_ITEMS.map((item) => (
        <Button
          key={item.to}
          component={NavLink}
          to={item.to}
          end={Boolean(item.end)}
          color="secondary"
          sx={{
            '&.active': {
              color: 'primary.main',
              textDecoration: 'underline',
              textUnderlineOffset: '4px',
            },
          }}
        >
          {item.label}
        </Button>
      ))}
    </nav>
  );
}
