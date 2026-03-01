// Central app “contracts” + shared constants (JS-friendly)

export const STARTING_CASH_CENTS = 1_000_000; // $10,000
export const MICROSHARES_PER_SHARE = 1_000_000;

/**
 * @param {number} cashCents
 * @returns {string}
 */
export function formatUSD(cashCents) {
  return (cashCents / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });
}
