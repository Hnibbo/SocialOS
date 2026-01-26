import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  Star,
  ArrowLeft,
  Plus,
  Minus,
  Share2,
  Heart,
  Truck,
  ShieldCheck,
  RotateCcw,
  CreditCard,
  Loader2
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Product } from "@/types/social-os";
import { useProducts } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchProductById } = useProducts();
  const { addToCart, isAdding } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const productData = await fetchProductById(id!);
      setProduct(productData);
    } catch (error) {
      console.error('Failed to fetch product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    await addToCart(product.id, quantity);
  };

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <h2 className="text-2xl font-bold">Product Not Found</h2>
        <Button onClick={() => navigate('/products')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Button>
      </div>
    );
  }

  const currentPrice = product.discount_price || product.price;
  const discountPercent = product.discount_price && product.discount_price < product.price 
    ? Math.round((1 - product.discount_price / product.price) * 100) 
    : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Breadcrumb & Back Button */}
      <div className="flex items-center gap-2 mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/products')}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Button>
        <span className="text-muted-foreground">/</span>
        <span className="text-muted-foreground">{product.category}</span>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden bg-background/40 border border-white/10 aspect-square">
            <img
              src={product.images[selectedImage]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {product.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`rounded-xl overflow-hidden border-2 transition-all ${
                  selectedImage === index
                    ? 'border-primary'
                    : 'border-transparent hover:border-white/20'
                }`}
              >
                <img
                  src={image}
                  alt={`${product.name} ${index + 1}`}
                  className="w-full h-20 object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          {/* Brand & Name */}
          <div>
            <div className="text-sm text-primary font-mono">{product.brand}</div>
            <h1 className="text-3xl md:text-4xl font-bold mt-1">{product.name}</h1>
          </div>

          {/* Rating & Reviews */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span className="font-bold">{product.rating}</span>
              <span className="text-muted-foreground">({product.reviews_count} reviews)</span>
            </div>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              Write a Review
            </Button>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-primary">{formatPrice(currentPrice, product.currency)}</span>
              {discountPercent > 0 && (
                <Badge className="bg-emerald-500 text-white">-{discountPercent}%</Badge>
              )}
            </div>
            {product.discount_price && product.discount_price < product.price && (
              <div className="text-sm text-muted-foreground line-through">
                {formatPrice(product.price, product.currency)}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="prose prose-sm text-muted-foreground max-w-none">
            <p>{product.long_description}</p>
          </div>

          {/* Specifications */}
          {Object.keys(product.specifications).length > 0 && (
            <div className="space-y-2">
              <h3 className="font-bold text-sm uppercase tracking-wider">Specifications</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-muted-foreground">{key}:</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stock & Availability */}
          <div className="flex items-center gap-2">
            <span className={`font-bold ${
              product.stock > 0 ? 'text-emerald-500' : 'text-red-500'
            }`}>
              {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
            </span>
          </div>

          {/* Quantity & Add to Cart */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2 bg-background/50 border border-white/10 rounded-xl p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="h-8 w-8 p-0"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="text-sm font-bold w-8 text-center">{quantity}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="h-8 w-8 p-0"
                disabled={quantity >= product.stock}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            <Button
              size="lg"
              onClick={handleAddToCart}
              disabled={isAdding === product.id || product.stock === 0}
              className="flex-1"
            >
              {isAdding === product.id ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <ShoppingBag className="w-4 h-4 mr-2" />
              )}
              Add to Cart - {formatPrice(currentPrice * quantity, product.currency)}
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={handleWishlist}
              className={`${isWishlisted ? 'bg-red-500/10 text-red-500 border-red-500/20' : ''}`}
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
            </Button>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {product.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs border-white/5">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Features / Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-white/10">
            <div className="flex items-start gap-3">
              <Truck className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-sm">Free Shipping</h4>
                <p className="text-xs text-muted-foreground">On orders over $50</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-sm">2 Year Warranty</h4>
                <p className="text-xs text-muted-foreground">Full coverage guarantee</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <RotateCcw className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-sm">30-Day Returns</h4>
                <p className="text-xs text-muted-foreground">Easy returns policy</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-sm">Secure Payment</h4>
                <p className="text-xs text-muted-foreground">SSL encrypted checkout</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      <div className="mt-24">
        <h2 className="text-2xl font-bold mb-8">You Might Also Like</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* Sample related products - in real app, this would fetch similar products */}
          {[1, 2, 3, 4].map((item) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: item * 0.1 }}
            >
              <Card className="h-full flex flex-col bg-background/40 hover:bg-background/60 transition-all duration-500 border-white/5 hover:border-primary/30">
                <div className="relative h-40 overflow-hidden rounded-t-xl">
                  <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10" />
                  <img
                    src={`https://picsum.photos/seed/related${item}/400/400`}
                    alt={`Related Product ${item}`}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                  />
                </div>
                <CardContent className="p-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold">Related Product {item}</h3>
                    <span className="text-sm text-primary font-mono">$99</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    A premium product that complements your purchase
                  </p>
                  <Button
                    size="sm"
                    className="mt-auto"
                    onClick={() => navigate(`/products/${item}`)}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
