// 1 point earned per KES_PER_POINT spent
export const KES_PER_POINT = 10;
export const POINTS_PER_SPEND = 1;

// 1 point = KES_PER_REDEMPTION when redeeming
export const KES_PER_REDEMPTION = 1;

export const calculatePointsEarned = (orderTotal: number): number =>
  Math.floor(orderTotal / KES_PER_POINT) * POINTS_PER_SPEND;

export const calculateRedemptionValue = (points: number): number =>
  points * KES_PER_REDEMPTION;

export const LOYALTY_TIERS = [
  {
    name: "Bronze",
    min: 0,
    color: "#cd7f32",
    bg: "bg-amber-50  dark:bg-amber-950/20",
  },
  {
    name: "Silver",
    min: 500,
    color: "#c0c0c0",
    bg: "bg-gray-50   dark:bg-gray-900/20",
  },
  {
    name: "Gold",
    min: 1500,
    color: "#ffd700",
    bg: "bg-yellow-50 dark:bg-yellow-950/20",
  },
  {
    name: "Platinum",
    min: 5000,
    color: "#e5e4e2",
    bg: "bg-slate-50  dark:bg-slate-900/20",
  },
];

export const getCustomerTier = (points: number) => {
  const tier = [...LOYALTY_TIERS].reverse().find((t) => points >= t.min);
  return tier ?? LOYALTY_TIERS[0];
};

export const getNextTier = (points: number) => {
  const idx = LOYALTY_TIERS.findIndex((t) => points < t.min);
  return idx === -1 ? null : LOYALTY_TIERS[idx];
};
