/**
 * Stripe product & price catalog for Tactik Coach.
 * All IDs come from the Stripe Test environment.
 */

export interface StripePlan {
  id: string;
  product_id: string;
  name: string;
  description: string;
  coaches: number;
  price_monthly: { id: string; amount: number };
  price_yearly: { id: string; amount: number };
  popular?: boolean;
  category: "solo" | "club";
}

export const PLANS: StripePlan[] = [
  {
    id: "solo",
    product_id: "prod_UEh0NZAxNnLAGP",
    name: "Solo",
    description: "1 équipe · 1 coach",
    coaches: 1,
    category: "solo",
    price_monthly: { id: "price_1TGDc9V05pEfLFTLsjdehrMY", amount: 900 },
    price_yearly: { id: "price_1TGDd5V05pEfLFTL86EjEo4U", amount: 8900 },
  },
  {
    id: "solo-plus",
    product_id: "prod_UEh2r4jJ8Dg30F",
    name: "Solo+",
    description: "Historique saisons · compos · chimie FUT · PDF",
    coaches: 1,
    category: "solo",
    popular: true,
    price_monthly: { id: "price_1TGDemV05pEfLFTLynUynly8", amount: 1400 },
    price_yearly: { id: "price_1TGDemV05pEfLFTLKUnBSBkp", amount: 12900 },
  },
  {
    id: "club-2",
    product_id: "prod_UEh5GnOwh3quhY",
    name: "Club 2",
    description: "2 licences coach · dashboard club",
    coaches: 2,
    category: "club",
    price_monthly: { id: "price_1TGDgvV05pEfLFTLxbrDpLZP", amount: 1600 },
    price_yearly: { id: "price_1TGDgvV05pEfLFTLCo2h93rl", amount: 14900 },
  },
  {
    id: "club-3",
    product_id: "prod_UEh5iND5kgn3vD",
    name: "Club 3",
    description: "3 licences coach · dashboard club",
    coaches: 3,
    category: "club",
    price_monthly: { id: "price_1TGDhgV05pEfLFTLdMFw47W8", amount: 2300 },
    price_yearly: { id: "price_1TGDhgV05pEfLFTLhgObQ2Ow", amount: 19900 },
  },
  {
    id: "club-5",
    product_id: "prod_UEh6V8FeENTwrR",
    name: "Club 5",
    description: "5 licences coach · dashboard club",
    coaches: 5,
    category: "club",
    popular: true,
    price_monthly: { id: "price_1TGDiWV05pEfLFTL90WUTzok", amount: 3500 },
    price_yearly: { id: "price_1TGDiWV05pEfLFTLJZxYVhtB", amount: 29900 },
  },
  {
    id: "club-8",
    product_id: "prod_UEh7xD7MFIxUst",
    name: "Club 8",
    description: "8 licences coach · dashboard club",
    coaches: 8,
    category: "club",
    price_monthly: { id: "price_1TGDjNV05pEfLFTLZHRGmaFW", amount: 4900 },
    price_yearly: { id: "price_1TGDjNV05pEfLFTLKbUFrcgh", amount: 39900 },
  },
  {
    id: "club-10",
    product_id: "prod_UEh82UvQZ5PTPY",
    name: "Club 10",
    description: "10 licences coach · dashboard club",
    coaches: 10,
    category: "club",
    price_monthly: { id: "price_1TGDkdV05pEfLFTLTzFdSa2t", amount: 5900 },
    price_yearly: { id: "price_1TGDkdV05pEfLFTLaop3WIME", amount: 47900 },
  },
];

/** Format cents to €X,XX */
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("fr-BE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
