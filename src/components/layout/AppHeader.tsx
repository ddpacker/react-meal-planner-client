import { useState } from 'react';
import MenuIcon from '@mui/icons-material/Menu';
import { Drawer, IconButton } from '@mui/material';
import { NavLink, useLocation } from 'react-router-dom';
import logo from '../../assets/logo.svg';
import wordmark from '../../assets/wordmark.svg';
import { AppNav } from './AppNav';
import { ProfileMenu } from './ProfileMenu';

export function AppHeader() {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLocation, setDrawerLocation] = useState(location.pathname);

  if (location.pathname !== drawerLocation) {
    setDrawerLocation(location.pathname);
    setDrawerOpen(false);
  }

  return (
    <header
      className="border-b border-border bg-background"
      role="banner"
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-2">
        <div className="flex min-w-0 items-center gap-1">
          <div className="md:hidden">
            <IconButton
              aria-label="Open menu"
              color="primary"
              onClick={() => setDrawerOpen(true)}
            >
              <MenuIcon />
            </IconButton>
          </div>
          <NavLink
            to="/"
            aria-label="Meal Planner home"
            className="flex items-center"
          >
            <img
              src={wordmark}
              alt=""
              className="hidden h-10 w-auto md:block"
            />
            <img src={logo} alt="" className="h-10 w-auto md:hidden" />
          </NavLink>
        </div>

        <AppNav variant="desktop" />

        <div className="justify-self-end">
          <ProfileMenu />
        </div>
      </div>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <div className="w-64 p-2">
          <nav aria-label="Mobile">
            <AppNav variant="drawer" onNavigate={() => setDrawerOpen(false)} />
          </nav>
        </div>
      </Drawer>
    </header>
  );
}
