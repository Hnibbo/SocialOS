import { loadStripe, Stripe } from '@stripe/stripe-js';

// Initialize Stripe with your production publishable key
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_live_51SL5K4BsDHqQr7fhG5iZwQjmVUbUrA90NTduBHZRY8IkLxO4at6N4wZRZikFOMJjrm9kQrKBBjUxlom7oyiogiXp00vBMHVSDs');

export const getStripe = () => stripePromise;

// Price IDs for your products (create these in your Stripe Dashboard)
export const STRIPE_PRICES = {
  MONTHLY_PREMIUM: 'price_monthly_premium', // Create this price in Stripe
  YEARLY_PREMIUM: 'price_yearly_premium',   // Create this price in Stripe  
  MONTHLY_BUSINESS: 'price_monthly_business', // Create this price in Stripe
  YEARLY_BUSINESS: 'price_yearly_business',   // Create this price in Stripe
  CREDITS_PACK_100: 'price_credits_100',      // Create this price in Stripe
  CREDITS_PACK_500: 'price_credits_500',      // Create this price in Stripe
  CREDITS_PACK_1000: 'price_credits_1000',    // Create this price in Stripe
} as const;

// Subscription plans configuration
export const SUBSCRIPTION_PLANS = [
  {
    id: 'premium',
    name: 'Premium',
    description: 'For power users who want the full experience',
    price: '$9.99',
    yearlyPrice: '$99.99',
    yearlyDiscount: '17% OFF',
    priceId: STRIPE_PRICES.MONTHLY_PREMIUM,
    yearlyPriceId: STRIPE_PRICES.YEARLY_PREMIUM,
    features: [
      'Unlimited posts and stories',
      'Advanced analytics',
      'Priority support',
      'Custom themes',
      'Ad-free experience',
      'Higher quality media uploads',
      'Advanced search filters',
      'Profile verification badge'
    ],
    popular: true
  },
  {
    id: 'business',
    name: 'Business',
    description: 'For creators and businesses',
    price: '$29.99',
    yearlyPrice: '$299.99',
    yearlyDiscount: '17% OFF',
    priceId: STRIPE_PRICES.MONTHLY_BUSINESS,
    yearlyPriceId: STRIPE_PRICES.YEARLY_BUSINESS,
    features: [
      'Everything in Premium',
      'Business verification badge',
      'Advanced analytics dashboard',
      'Team collaboration tools',
      'API access',
      'Bulk messaging',
      'Custom branding',
      'Priority listing',
      'Advanced monetization tools',
      'Dedicated account manager'
    ],
    popular: false
  }
];

// Credit packs configuration
export const CREDIT_PACKS = [
  {
    id: 'credits-100',
    name: 'Starter Pack',
    credits: 100,
    price: '$4.99',
    bonus: 0,
    priceId: STRIPE_PRICES.CREDITS_PACK_100,
    description: 'Perfect for trying out premium features'
  },
  {
    id: 'credits-500',
    name: 'Pro Pack',
    credits: 500,
    price: '$19.99',
    bonus: 50,
    priceId: STRIPE_PRICES.CREDITS_PACK_500,
    description: 'Most popular choice for regular users',
    popular: true
  },
  {
    id: 'credits-1000',
    name: 'Elite Pack',
    credits: 1000,
    price: '$34.99',
    bonus: 200,
    priceId: STRIPE_PRICES.CREDITS_PACK_1000,
    description: 'Best value for power users',
    bestValue: true
  }
];

export type StripePriceId = keyof typeof STRIPE_PRICES;