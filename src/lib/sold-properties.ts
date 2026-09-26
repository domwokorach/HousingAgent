/**
 * Query layer for `sold_properties` — HM Land Registry Price Paid transactions,
 * imported monthly from S3 into RDS. Server-only (via `./postgres`).
 */

import { getPool } from "./postgres";

export interface SoldProperty {
  transactionId: string;
  price: number;
  transferDate: string;
  postcode: string | null;
  propertyType: string | null;
  isNewBuild: boolean | null;
  tenure: string | null;
  paon: string | null;
  saon: string | null;
  street: string | null;
  locality: string | null;
  townCity: string | null;
  district: string | null;
  county: string | null;
  ppdCategoryType: string | null;
  recordStatus: string | null;
}

interface SoldPropertyRow {
  transaction_id: string;
  price: number;
  transfer_date: string;
  postcode: string | null;
  property_type: string | null;
  is_new_build: boolean | null;
  tenure: string | null;
  paon: string | null;
  saon: string | null;
  street: string | null;
  locality: string | null;
  town_city: string | null;
  district: string | null;
  county: string | null;
  ppd_category_type: string | null;
  record_status: string | null;
}

function toSoldProperty(row: SoldPropertyRow): SoldProperty {
  return {
    transactionId: row.transaction_id,
    price: row.price,
    transferDate: row.transfer_date,
    postcode: row.postcode,
    propertyType: row.property_type,
    isNewBuild: row.is_new_build,
    tenure: row.tenure,
    paon: row.paon,
    saon: row.saon,
    street: row.street,
    locality: row.locality,
    townCity: row.town_city,
    district: row.district,
    county: row.county,
    ppdCategoryType: row.ppd_category_type,
    recordStatus: row.record_status,
  };
}

/**
 * Sold transactions for an exact postcode, most recent first.
 *
 * `postcode` is expected to already be validated and normalised (uppercase,
 * single space — e.g. via `formatPostcode`/`isValidUkPostcode` in
 * `./postcode`); this function only parameterises the query, it does not
 * revalidate the shape.
 */
export async function findSoldPropertiesByPostcode(
  postcode: string,
  limit: number,
): Promise<SoldProperty[]> {
  const pool = getPool();
  const result = await pool.query<SoldPropertyRow>(
    `SELECT transaction_id, price, transfer_date, postcode, property_type,
            is_new_build, tenure, paon, saon, street, locality, town_city,
            district, county, ppd_category_type, record_status
     FROM sold_properties
     WHERE postcode = $1
     ORDER BY transfer_date DESC
     LIMIT $2`,
    [postcode, limit],
  );
  return result.rows.map(toSoldProperty);
}
