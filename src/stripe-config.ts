export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  mode: 'subscription' | 'payment';
  price: number;
  currency: string;
  interval?: 'month' | 'year';
}

export const STRIPE_PRODUCTS: StripeProduct[] = [
  {
    id: 'prod_SjjYUKjhXU75pf',
    priceId: 'price_1RoG55HSj8WvROSvCj4fBTbi',
    name: 'Premium Access',
    description: 'Unlimited premium access to all 300 math questions.',
    mode: 'subscription',
    price: 14.99,
    currency: 'usd',
    interval: 'month'
  }
];

export const getPremiumProduct = (): StripeProduct => {
  return STRIPE_PRODUCTS[0];
};

export const getProductById = (id: string): StripeProduct | undefined => {
  return STRIPE_PRODUCTS.find(product => product.id === id);
};

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return STRIPE_PRODUCTS.find(product => product.priceId === priceId);
};