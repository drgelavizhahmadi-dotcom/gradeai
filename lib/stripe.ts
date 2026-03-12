import Stripe from 'stripe';

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-02-25.clover',
      typescript: true,
    });
  }
  return _stripe;
}

export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const instance = getStripe();
    const value = (instance as any)[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});
