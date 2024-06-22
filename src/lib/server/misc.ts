import type { SiteStats } from '$lib/shared_types';
import { withDBClient, type Client as DBClient } from './db';

export async function getSiteStats(): Promise<SiteStats> {
  return await withDBClient(async (db: DBClient) => {
    let { rows } = await db.query('select (select count(*)::integer from users) as "nbUsers", 0 as "totalAmountDonated"');
    // TODO: need to deal with potentially different currency
    return rows[0] as SiteStats;
  });
}
