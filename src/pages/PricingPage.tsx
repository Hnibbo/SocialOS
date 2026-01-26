import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Zap, Crown, CreditCard } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { loadStripe } from '@/lib/stripe-service';

const PricingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Choose Your Power Level
          </h1>
          <p className="text-blue-200 text-lg mb-8">
            Unlock advanced features and accelerate your growth
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Free Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Basic features for getting started.</p>
              <Button className="mt-4">Get Started</Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-semibold">
            Get Started Today
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;