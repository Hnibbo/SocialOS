import React, { useState } from 'react';
import { Check, Star, Zap, Crown } from 'lucide-react';
import { SUBSCRIPTION_PLANS, CREDIT_PACKS } from '@/lib/stripe';
import { stripeService } from '@/lib/stripe-service';
import { useAuth } from '@/hooks/use-auth';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PricingProps {
  className?: string;
}

export function Pricing({ className }: PricingProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);
  const { user } = useAuth();

  const handleSubscribe = async (planId: string, priceId: string) => {
    if (!user) {
      toast.error('Please sign in to subscribe');
      return;
    }

    setLoading(planId);
    try {
      const session = await stripeService.createSubscription(user.id, priceId);
      await stripeService.redirectToCheckout(session);
    } catch (error) {
      toast.error('Failed to start subscription');
      console.error('Subscription error:', error);
    } finally {
      setLoading(null);
    }
  };

  const handlePurchaseCredits = async (packId: string, priceId: string) => {
    if (!user) {
      toast.error('Please sign in to purchase credits');
      return;
    }

    setLoading(packId);
    try {
      const session = await stripeService.purchaseCredits(user.id, priceId);
      await stripeService.redirectToCheckout(session);
    } catch (error) {
      toast.error('Failed to purchase credits');
      console.error('Credit purchase error:', error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className={cn('min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900', className)}>
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 ml-2">
              God Mode
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Unlock the full potential of SocialOS with premium features that supercharge your social experience
          </p>
        </motion.div>

        {/* Billing Toggle */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-12"
        >
          <div className="bg-white dark:bg-gray-800 p-1 rounded-full shadow-lg flex">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all relative ${
                billingCycle === 'yearly'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Yearly
              <span className="absolute -top-8 -right-4 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                17% OFF
              </span>
            </button>
          </div>
        </motion.div>

        {/* Subscription Plans */}
        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8 mb-16">
          <AnimatePresence>
            {SUBSCRIPTION_PLANS.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                exit={{ opacity: 0, y: -20 }}
                className={cn(
                  'relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl',
                  plan.popular && 'ring-2 ring-indigo-600 ring-offset-4 ring-offset-white dark:ring-offset-gray-900',
                  plan.popular && 'scale-105'
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="text-center mb-8">
                  <div className="flex justify-center mb-4">
                    {plan.id === 'premium' ? (
                      <Crown className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
                    ) : (
                      <Zap className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                    {plan.description}
                  </p>
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {billingCycle === 'monthly' ? plan.price : plan.yearlyPrice}
                    </span>
                    <span className="text-gray-600 dark:text-gray-300 ml-2">
                      /{billingCycle === 'monthly' ? 'month' : 'year'}
                    </span>
                  </div>
                  {billingCycle === 'yearly' && (
                    <p className="text-green-600 dark:text-green-400 text-sm font-medium">
                      {plan.yearlyDiscount}
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300 text-sm">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(
                    plan.id,
                    billingCycle === 'monthly' ? plan.priceId : plan.yearlyPriceId
                  )}
                  disabled={loading === plan.id}
                  className={cn(
                    'w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200',
                    'bg-gradient-to-r from-indigo-600 to-purple-600 text-white',
                    'hover:from-indigo-700 hover:to-purple-700',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    plan.popular && 'shadow-lg hover:shadow-xl'
                  )}
                >
                  {loading === plan.id ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    `Subscribe to ${plan.name}`
                  )}
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Credit Packs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Credit Packs
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Purchase credits to unlock premium features without a subscription
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {CREDIT_PACKS.map((pack, index) => (
              <motion.div
                key={pack.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className={cn(
                  'bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105',
                  pack.popular && 'ring-2 ring-indigo-600 ring-offset-2',
                  pack.bestValue && 'ring-2 ring-purple-600 ring-offset-2'
                )}
              >
                {pack.bestValue && (
                  <div className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full text-center mb-4">
                    Best Value
                  </div>
                )}
                {pack.popular && (
                  <div className="bg-indigo-600 text-white text-xs px-2 py-1 rounded-full text-center mb-4">
                    Most Popular
                  </div>
                )}

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {pack.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                  {pack.description}
                </p>

                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                    {pack.credits + pack.bonus}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Credits
                    {pack.bonus > 0 && (
                      <span className="text-green-600 dark:text-green-400 ml-1">
                        (+{pack.bonus} bonus)
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                    {pack.price}
                  </div>
                </div>

                <button
                  onClick={() => handlePurchaseCredits(pack.id, pack.priceId)}
                  disabled={loading === pack.id}
                  className={cn(
                    'w-full py-2 px-4 rounded-lg font-semibold transition-all duration-200',
                    'bg-indigo-600 text-white hover:bg-indigo-700',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {loading === pack.id ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    'Purchase Credits'
                  )}
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}