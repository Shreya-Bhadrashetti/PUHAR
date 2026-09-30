import client from './client';

/**
 * POST /risk/assess
 *
 * @param {object} params
 * @param {object} params.vessel  - { name, vessel_class, dwt, loa_m, beam_m, draft_m, lat, lon }
 * @param {string} params.destination
 * @param {string|null} params.eta  - ISO datetime string
 * @returns {Promise<ServiceOutput>}
 */
export const assessRisk = async ({ vessel, destination, eta = null }) => {
  const { data } = await client.post('/risk/assess', { vessel, destination, eta });
  return data;
};

/**
 * GET /alerts
 * Returns list of stored risk alerts.
 */
export const getAlerts = async () => {
  const { data } = await client.get('/alerts');
  return data;
};
