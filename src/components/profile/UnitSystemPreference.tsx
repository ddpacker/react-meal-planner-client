import type { MouseEvent } from 'react';
import { Alert, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { useUpdatePreferences } from '../../hooks/useUser';
import type { UnitSystem } from '../../types/user';

export function UnitSystemPreference() {
  const { unitSystem } = useAuth();
  const updatePreferences = useUpdatePreferences();

  const handleChange = (_event: MouseEvent<HTMLElement>, value: UnitSystem | null) => {
    if (!value || value === unitSystem) {
      return;
    }
    updatePreferences.mutate({ unit_system: value });
  };

  return (
    <div className="flex flex-col gap-3">
      {updatePreferences.isError ? (
        <Alert severity="error">Could not update unit preference. Please try again.</Alert>
      ) : null}

      <ToggleButtonGroup
        value={unitSystem}
        exclusive
        onChange={handleChange}
        disabled={updatePreferences.isPending}
        aria-label="Unit system"
        fullWidth
        color="primary"
      >
        <ToggleButton value="metric" aria-label="Metric">
          Metric
        </ToggleButton>
        <ToggleButton value="imperial" aria-label="Imperial">
          Imperial
        </ToggleButton>
      </ToggleButtonGroup>
    </div>
  );
}
