import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Truck,
  ShieldCheck,
  RotateCcw,
  X,
  Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";

export default function Cart() {
  const navigate = useNavigate();
  const { 
    cartItems, 
    loading, 
    addToCart, 
    updateQuantity, 
    removeFromCart, 
    clearCart, 
    getTotalItems, 
    getTotalPrice 
  } = useCart();

  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    // In a real app, this would redirect to Stripe Checkout
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Checkout completed successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Checkout failed');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const subtotal = getTotalPrice();
  const shipping = subtotal > 50 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 p-6">
        <div className="p-8 rounded-full bg-white/5 border border-white/5">
          <ShoppingBag className="w-16 h-16 text-muted-foreground opacity-20" />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2">Your Cart is Empty</h2>
          <p className="text-muted-foreground">Start shopping to add items to your cart</p>
        </div>
        <Button size="lg" onClick={() => navigate('/products')}>
          Start Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/products')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continue Shopping
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={clearCart} className="text-muted-foreground hover:text-red-500">
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Cart
          </Button>
          <Badge variant="outline" className="text-sm">
            {getTotalItems()} Items
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-2xl font-bold">Shopping Cart</h2>
          
          <AnimatePresence mode="popLayout">
            {cartItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="bg-background/40 border-white/10">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      {/* Product Image */}
                      <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-background/50 flex-shrink-0">
                        <img
                          src={item.product?.thumbnail || item.product?.images[0]}
                          alt={item.product?.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm text-primary font-mono">{item.product?.brand}</div>
                            <h3 className="font-bold text-lg mb-1">{item.product?.name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {item.product?.description}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.id)}
                            className="text-muted-foreground hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          {/* Quantity Control */}
                          <div className="flex items-center gap-2 bg-background/50 border border-white/10 rounded-xl p-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="h-8 w-8 p-0"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="text-sm font-bold w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="h-8 w-8 p-0"
                              disabled={item.product?.stock && item.quantity >= item.product.stock}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            <div className="font-bold">
                              {formatPrice((item.product?.discount_price || item.product?.price || 0) * item.quantity)}
                            </div>
                            {item.product?.discount_price && item.product?.discount_price < item.product?.price && (
                              <div className="text-xs text-muted-foreground line-through">
                                {formatPrice(item.product?.price * item.quantity)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="bg-background/40 border-white/10 sticky top-8">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax (8%)</span>
                  <span>{formatPrice(tax)}</span>
                </div>
              </div>
              
              <Separator />

              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>

              {/* Discount Code */}
              <div className="pt-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter discount code"
                    className="w-full bg-background/50 border border-white/10 rounded-xl py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <Button size="sm" className="absolute right-1 top-1/2 -translate-y-1/2">
                    Apply
                  </Button>
                </div>
              </div>

              {/* Benefits */}
              <div className="pt-4 space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <Truck className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <span>Free shipping on orders over $50</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <ShieldCheck className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <span>Secure checkout with SSL encryption</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <RotateCcw className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <span>30-day money-back guarantee</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                size="lg"
                className="w-full"
                onClick={handleCheckout}
                disabled={isCheckingOut}
              >
                {isCheckingOut ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Proceed to Checkout - {formatPrice(total)}
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Estimated Delivery */}
          <Card className="mt-4 bg-background/40 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Truck className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">Estimated Delivery</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {shipping === 0 ? '2-3 business days' : '5-7 business days'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Shipping to: United States
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
