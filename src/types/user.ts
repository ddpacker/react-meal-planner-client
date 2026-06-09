export type UnitSystem = 'metric' | 'imperial';

export type UserRead = {
  id: number;
  email: string;
  created_at: string;
};

export type UserUpdate = {
  email?: string;
  password?: string;
  current_password?: string;
};

export type UserPreferencesRead = {
  unit_system: UnitSystem;
};

export type UserPreferencesUpdate = {
  unit_system: UnitSystem;
};
