import client from './client';

/**
 * POST /forecast
 * @param {string} route         - Market route string e.g. "Australia-Paradip"
 * @param {string} vessel_class  - e.g. "Panamax", "Capesize", "Supramax", "Handysize"
 * @param {string|null} departure_date - ISO datetime
 * @returns {Promise<ServiceOutput>}
 */
export const getForecast = async (route, vessel_class, departure_date = null) => {
  const { data } = await client.post('/forecast', { route, vessel_class, departure_date });
  return data;
};

/**
 * POST /vessels/optimize
 * @param {object} params
 * @param {object} params.vessel           - VesselInput
 * @param {string} params.origin_port
 * @param {string} params.destination_port
 * @param {number} params.cargo_quantity_mt
 * @returns {Promise<ServiceOutput>}
 */
export const optimizeVessel = async ({ vessel, origin_port, destination_port, cargo_quantity_mt }) => {
  const { data } = await client.post('/vessels/optimize', { vessel, origin_port, destination_port, cargo_quantity_mt });
  return data;
};
