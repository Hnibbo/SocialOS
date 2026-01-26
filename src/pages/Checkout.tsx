import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CreditCard,
  Truck,
  ShieldCheck,
  Home,
  Building,
  MapPin,
  Phone,
  Mail,
  User,
  Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, getTotalPrice, clearCart } = useCart();

  const [isProcessing, setIsProcessing] = useState(false);
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('credit-card');
  const [formData, setFormData] = useState({
    // Shipping Address
    fullName: '',
    address: '',
    address2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    phone: '',
    email: '',
    
    // Billing Address (if different)
    billingFullName: '',
    billingAddress: '',
    billingAddress2: '',
    billingCity: '',
    billingState: '',
    billingPostalCode: '',
    billingCountry: 'United States',
    
    // Payment Info
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    saveCard: false,
    
    // Order Notes
    notes: '',
    saveAddress: false
  });

  const subtotal = getTotalPrice();
  const shipping = subtotal > 50 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Validate form
    if (!formData.fullName || !formData.address || !formData.city || !formData.state || !formData.postalCode) {
      toast.error('Please fill in all required shipping information');
      setIsProcessing(false);
      return;
    }

    // In a real app, this would:
    // 1. Validate payment information
    // 2. Create an order in the database
    // 3. Process payment via Stripe
    // 4. Clear the cart
    // 5. Redirect to success page

    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      toast.success('Order placed successfully!');
      await clearCart();
      navigate('/checkout/success');
    } catch (error) {
      toast.error('Order failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/cart')}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Cart
        </Button>
        <div className="text-center">
          <h1 className="text-2xl font-bold">Checkout</h1>
          <p className="text-sm text-muted-foreground">Complete your purchase</p>
        </div>
        <div />
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Billing & Shipping */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address */}
            <Card className="bg-background/40 border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <Input
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone *</Label>
                    <Input
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="(123) 456-7890"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Address *</Label>
                  <Input
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="123 Main Street"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Address Line 2</Label>
                  <Input
                    name="address2"
                    value={formData.address2}
                    onChange={handleInputChange}
                    placeholder="Apartment, suite, etc."
                  />
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>City *</Label>
                    <Input
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="New York"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>State *</Label>
                    <Input
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="NY"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Postal Code *</Label>
                    <Input
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      placeholder="10001"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Country *</Label>
                    <Input
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="saveAddress"
                    checked={formData.saveAddress}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, saveAddress: checked as boolean }))}
                  />
                  <Label htmlFor="saveAddress" className="text-sm text-muted-foreground">
                    Save this address for future orders
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Billing Address */}
            <Card className="bg-background/40 border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Billing Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Checkbox
                    id="sameAsShipping"
                    checked={sameAsShipping}
                    onCheckedChange={(checked) => setSameAsShipping(checked as boolean)}
                  />
                  <Label htmlFor="sameAsShipping" className="text-sm text-muted-foreground">
                    Same as shipping address
                  </Label>
                </div>
                
                {!sameAsShipping && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Full Name *</Label>
                        <Input
                          name="billingFullName"
                          value={formData.billingFullName}
                          onChange={handleInputChange}
                          placeholder="John Doe"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Address *</Label>
                      <Input
                        name="billingAddress"
                        value={formData.billingAddress}
                        onChange={handleInputChange}
                        placeholder="123 Main Street"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Address Line 2</Label>
                      <Input
                        name="billingAddress2"
                        value={formData.billingAddress2}
                        onChange={handleInputChange}
                        placeholder="Apartment, suite, etc."
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>City *</Label>
                        <Input
                          name="billingCity"
                          value={formData.billingCity}
                          onChange={handleInputChange}
                          placeholder="New York"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>State *</Label>
                        <Input
                          name="billingState"
                          value={formData.billingState}
                          onChange={handleInputChange}
                          placeholder="NY"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Postal Code *</Label>
                        <Input
                          name="billingPostalCode"
                          value={formData.billingPostalCode}
                          onChange={handleInputChange}
                          placeholder="10001"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Country *</Label>
                        <Input
                          name="billingCountry"
                          value={formData.billingCountry}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
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
              <CardContent className="space-y-4">
                {/* Payment Method Selection */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Button
                    type="button"
                    variant={paymentMethod === 'credit-card' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('credit-card')}
                    className="h-auto py-3 flex items-center gap-2 justify-start"
                  >
                    <CreditCard className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-bold">Credit Card</div>
                      <div className="text-xs text-muted-foreground">Visa, Mastercard, Amex</div>
                    </div>
                  </Button>
                  <Button
                    type="button"
                    variant={paymentMethod === 'paypal' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('paypal')}
                    className="h-auto py-3 flex items-center gap-2 justify-start"
                  >
                    <div className="w-5 h-5 bg-blue-500 rounded-full" />
                    <div className="text-left">
                      <div className="font-bold">PayPal</div>
                      <div className="text-xs text-muted-foreground">Fast and secure</div>
                    </div>
                  </Button>
                  <Button
                    type="button"
                    variant={paymentMethod === 'apple-pay' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('apple-pay')}
                    className="h-auto py-3 flex items-center gap-2 justify-start"
                  >
                    <div className="w-5 h-5 bg-black rounded-full" />
                    <div className="text-left">
                      <div className="font-bold">Apple Pay</div>
                      <div className="text-xs text-muted-foreground">Quick checkout</div>
                    </div>
                  </Button>
                </div>

                {/* Credit Card Form */}
                {paymentMethod === 'credit-card' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label>Card Number *</Label>
                      <Input
                        name="cardNumber"
                        value={formData.cardNumber}
                        onChange={handleInputChange}
                        placeholder="0000 0000 0000 0000"
                        maxLength={19}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Cardholder Name *</Label>
                      <Input
                        name="cardName"
                        value={formData.cardName}
                        onChange={handleInputChange}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Expiry Date *</Label>
                        <Input
                          name="expiryDate"
                          value={formData.expiryDate}
                          onChange={handleInputChange}
                          placeholder="MM/YY"
                          maxLength={5}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>CVV *</Label>
                        <Input
                          name="cvv"
                          value={formData.cvv}
                          onChange={handleInputChange}
                          placeholder="123"
                          maxLength={4}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="saveCard"
                        checked={formData.saveCard}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, saveCard: checked as boolean }))}
                      />
                      <Label htmlFor="saveCard" className="text-sm text-muted-foreground">
                        Save card for future purchases
                      </Label>
                    </div>
                  </motion.div>
                )}

                {/* PayPal Form */}
                {paymentMethod === 'paypal' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <p className="text-muted-foreground text-sm">
                      You will be redirected to PayPal to complete your purchase.
                    </p>
                    <div className="flex items-center justify-center p-4 bg-background/50 rounded-xl border border-white/10">
                      <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                        PP
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Apple Pay Form */}
                {paymentMethod === 'apple-pay' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <p className="text-muted-foreground text-sm">
                      Use Apple Pay for quick and secure checkout.
                    </p>
                    <div className="flex items-center justify-center p-4 bg-background/50 rounded-xl border border-white/10">
                      <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center text-white font-bold text-xl">
                        
                      </div>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="bg-background/40 border-white/10 sticky top-8">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cart Items Summary */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-background/50 flex-shrink-0">
                        <img
                          src={item.product?.thumbnail || item.product?.images[0]}
                          alt={item.product?.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.product?.name}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-sm font-bold">
                        {formatPrice((item.product?.discount_price || item.product?.price || 0) * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
                
                <Separator />

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
                    <div className="w-4 h-4 text-primary mt-1 flex-shrink-0">✓</div>
                    <span>30-day money-back guarantee</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Place Order - {formatPrice(total)}
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
