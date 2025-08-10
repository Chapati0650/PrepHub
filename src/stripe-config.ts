export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  price: number;
  mode: 'payment' | 'subscription';
}

export const STRIPE_PRODUCTS: StripeProduct[] = [
  {
    id: 'prod_SjjYUKjhXU75pf',
    priceId: 'price_1RoG55HSj8WvROSvCj4fBTbi',
    name: 'Premium Access',
    description: 'Unlimited premium access to all 300 math questions.',
    price: 14.99,
    mode: 'subscription'
  }
];

export const getPremiumProduct = (): StripeProduct => {
  return STRIPE_PRODUCTS[0];
};