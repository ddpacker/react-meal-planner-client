import type { ReactNode } from 'react';
import { CssBaseline, GlobalStyles, ThemeProvider } from '@mui/material';
import { cssVariableDefinitions } from './tokens';
import { muiTheme } from './muiTheme';

type AppThemeProviderProps = {
  children: ReactNode;
};

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <GlobalStyles styles={{ ':root': cssVariableDefinitions }} />
      {children}
    </ThemeProvider>
  );
}
