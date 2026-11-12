export const FREE_REELS = 2;
export const plans = [
  { id: 'little-jashn', name: 'Little Jashn', credits: 3, amount: 29900, tag: 'One special occasion', description: 'A small celebration, beautifully announced.', bestFor: 'One occasion or a few invitation versions', kind: 'reels', maxQuantity: 5 },
  { id: 'celebration-box', name: 'Celebration Box', credits: 10, amount: 79900, tag: 'For the whole celebration', description: 'From save the date to the final celebration.', bestFor: 'Multiple functions, events and variations', kind: 'reels', maxQuantity: 5 },
  { id: 'creator-studio', name: 'Creator Studio', credits: 25, amount: 149900, tag: 'Lowest price per reel', description: 'More stories. More occasions. More creative room.', bestFor: 'Frequent creators and multiple celebrations', kind: 'reels', maxQuantity: 5 },
] as const;

export const customPlan = {
  id: 'custom-designing', name: 'Custom Designing', credits: 0, amount: 9900,
  tag: 'Made with you', kind: 'consultation', maxQuantity: 1,
  description: 'A one-to-one call or WhatsApp conversation about your custom design. Design work is quoted and paid separately.',
} as const;
export const offers = [...plans, customPlan];
export type CartItem = { planId: string; quantity: number };

export function priceCart(items: CartItem[]) {
  if (!Array.isArray(items) || !items.length || items.length > offers.length) throw Error('Choose a pack or a design conversation.');
  const unique = new Set<string>();
  let amount = 0, credits = 0, consultations = 0;
  for (const item of items) {
    const plan = offers.find(p => p.id === item.planId);
    if (!plan || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > plan.maxQuantity || unique.has(item.planId)) throw Error('Invalid cart.');
    unique.add(item.planId);
    amount += plan.amount * item.quantity;
    credits += plan.credits * item.quantity;
    if (plan.kind === 'consultation') consultations += item.quantity;
  }
  return { amount, credits, consultations, currency: 'INR' };
}

export const money = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount / 100);
export const perReel = (amount: number, credits: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount / credits / 100);
