import client from './client';

/**
 * POST /backhaul/match
 * @param {string} destination_port  - Port name (e.g. "Paradip")
 * @param {string} origin_region     - Region string (e.g. "India")
 * @returns {Promise<ServiceOutput>}
 */
export const matchBackhaul = async (destination_port, origin_region) => {
  const { data } = await client.post('/backhaul/match', {
    destination_port,
    origin_region,
  });
  return data;
};
