export const pricingPlans = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started with all essential features',
    price: 0,
    yearly_price: 0,
    features: [
      'Social messaging & calls',
      'Basic stories & posts',
      '1GB storage',
      'Standard profile',
      'Basic groups & events',
      'AI chat assistant',
      'Mobile access'
    ],
    icon: '🌟',
    popular: true,
    highlighted: false,
    gradient: 'from-gray-600 to-gray-700'
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For power users and professionals who need advanced features',
    price: 9.99,
    yearly_price: 99.99,
    features: [
      'Everything in Free, plus:',
      'Unlimited messaging & calls',
      'HD video calls',
      'Advanced stories with highlights',
      '10GB storage',
      'Professional profile',
      'Advanced groups & events',
      'Priority support',
      'Content analytics',
      'AI assistant with GPT-4',
      'Ad-free experience',
      'Collaboration tools',
      'Marketplace access',
      'Job board access',
      'Courses platform',
      'Dating advanced features',
      'API access',
      'Mobile PWA'
    ],
    icon: '⚡',
    popular: true,
    highlighted: true,
    gradient: 'from-blue-600 via-purple-600 to-indigo-600'
  },
  {
    id: 'elite',
    name: 'Elite',
    description: 'Maximum power for professionals, teams, and enterprises',
    price: 29.99,
    yearly_price: 299.99,
    features: [
      'Everything in Pro, plus:',
      '4K video calls',
      'Unlimited live streaming',
      'Advanced AR filters & effects',
      '100GB storage',
      'Priority enterprise support',
      'Advanced collaboration tools',
      'White-label options',
      'Custom branding',
      'API integrations',
      'Dedicated account manager',
      'Enterprise security',
      'Custom contracts',
      'Analytics dashboard',
      'Team management tools',
      'AI assistant with GPT-4.5',
      'Unlimited everything',
      'Beta feature access'
    ],
    icon: '👑',
    popular: false,
    highlighted: true,
    gradient: 'from-yellow-400 via-orange-500 to-red-600'
  }
];

export { pricingPlans };