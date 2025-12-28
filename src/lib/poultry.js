// poultry.js
// Data model and helper functions for poultry

export const defaultFlock = {
  id: '',
  name: '',
  breed: '',
  type: '', // layer, broiler, dual-purpose
  count: 0,
  ageWeeks: 0,
  healthStatus: 'Healthy',
  production: {
    eggsPerDay: 0,
    mortality: 0,
    feedConsumptionKg: 0,
  },
  notes: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export function createFlock(data) {
  return {
    ...defaultFlock,
    ...data,
    id: data.id || Math.random().toString(36).substr(2, 9),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function validateFlock(flock) {
  if (!flock.name || !flock.breed || flock.count < 0) return false;
  return true;
}
