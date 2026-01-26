import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  ArrowLeft,
  ShoppingBag,
  Package,
  Truck,
  Calendar,
  CreditCard
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const [orderNumber, setOrderNumber] = useState('');

  useEffect(() => {
    // Generate random order number
    const randomOrderNumber = `HUP${Date.now().toString().slice(-8)}`;
    setOrderNumber(randomOrderNumber);
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Success Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500/10 rounded-full mb-4">
          <CheckCircle className="w-10 h-10 text-emerald-500" />
        </div>
        <h1 className="text-4xl font-bold mb-2">Order Confirmed!</h1>
        <p className="text-muted-foreground text-lg">
          Thank you for your purchase! We're processing your order.
        </p>
      </motion.div>

      {/* Order Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="space-y-6"
      >
        {/* Order Number */}
        <Card className="bg-background/40 border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Order Number</p>
                <p className="font-bold text-lg font-mono">{orderNumber}</p>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                Processing
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Order Status Timeline */}
        <Card className="bg-background/40 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Order Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                <div className="flex-1">
                  <p className="font-bold text-sm">Order Received</p>
                  <p className="text-xs text-muted-foreground">Your order has been received and is being processed</p>
                </div>
                <span className="text-xs text-muted-foreground">Just now</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-primary/50 rounded-full" />
                <div className="flex-1">
                  <p className="font-bold text-sm">Processing</p>
                  <p className="text-xs text-muted-foreground">Verifying payment and preparing your order</p>
                </div>
                <span className="text-xs text-muted-foreground">Pending</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-muted-foreground/30 rounded-full" />
                <div className="flex-1">
                  <p className="font-bold text-sm">Shipping</p>
                  <p className="text-xs text-muted-foreground">Your order is on its way</p>
                </div>
                <span className="text-xs text-muted-foreground">Pending</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-muted-foreground/30 rounded-full" />
                <div className="flex-1">
                  <p className="font-bold text-sm">Delivered</p>
                  <p className="text-xs text-muted-foreground">Your order has been delivered</p>
                </div>
                <span className="text-xs text-muted-foreground">Pending</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Information */}
        <Card className="bg-background/40 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Delivery Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="font-bold text-sm">Estimated Delivery</span>
                </div>
                <p className="text-sm">3-5 business days</p>
                <p className="text-xs text-muted-foreground">Arriving by {new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <span className="font-bold text-sm">Shipping Method</span>
                </div>
                <p className="text-sm">Standard Shipping</p>
                <p className="text-xs text-muted-foreground">Track your order once it ships</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card className="bg-background/40 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="font-bold text-sm">Payment Method</div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-4 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">
                    V
                  </div>
                  <span className="text-sm">•••• •••• •••• 4242</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="font-bold text-sm">Total Paid</div>
                <p className="text-lg font-bold text-primary">$249.99</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="flex flex-col sm:flex-row gap-4 mt-8 justify-center"
      >
        <Button
          size="lg"
          onClick={() => navigate('/dashboard')}
          className="w-full sm:w-auto"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Return to Dashboard
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => navigate('/products')}
          className="w-full sm:w-auto"
        >
          <ShoppingBag className="w-4 h-4 mr-2" />
          Continue Shopping
        </Button>
      </motion.div>

      {/* Help Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="mt-12 text-center space-y-2"
      >
        <p className="text-sm text-muted-foreground">
          Need help? Contact our support team at support@hupapp.com
        </p>
        <p className="text-xs text-muted-foreground">
          or check our <a href="/help" className="text-primary hover:underline">Help Center</a> for more information
        </p>
      </motion.div>
    </div>
  );
}
