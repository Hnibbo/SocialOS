import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  Search,
  Filter,
  Star,
  ArrowRight,
  Loader2,
  TrendingUp,
  Grid3X3,
  List,
  Plus,
  Minus
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Product } from "@/types/social-os";
import { useProducts } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";

export default function ProductListing() {
  const navigate = useNavigate();
  const { products, loading, categories, fetchProducts, searchProducts, fetchProductsByCategory } = useProducts();
  const { addToCart, isAdding } = useCart();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  useEffect(() => {
    setFilteredProducts(products);
  }, [products]);

  useEffect(() => {
    filterProducts();
  }, [searchQuery, selectedCategory, priceRange]);

  const filterProducts = async () => {
    let filtered = [...products];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Price filter
    filtered = filtered.filter(product => {
      const price = product.discount_price || product.price;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    setFilteredProducts(filtered);
  };

  const handleAddToCart = async (productId: string) => {
    await addToCart(productId);
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Hero Header */}
      <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-primary/20 via-background to-background border border-white/10 p-8 md:p-12">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full -mr-48 -mt-48 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full -ml-32 -mb-32 blur-3xl pointer-events-none" />

        <div className="relative text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary uppercase tracking-widest mb-4">
            <TrendingUp className="w-3 h-3" />
            New Arrivals
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight mb-6">
            Discover Amazing <span className="text-primary italic">Products</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed mb-8">
            Explore a curated collection of premium products from top brands. Find exactly what you need and elevate your lifestyle.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Search */}
        <div className="relative flex-1 w-full lg:w-1/3 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search products, brands, or categories..."
            className="pl-12 h-14 bg-background/50 backdrop-blur-md border-white/10 rounded-2xl focus-visible:ring-primary/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 p-1 bg-background/50 backdrop-blur-md border border-white/10 rounded-2xl overflow-x-auto w-full lg:w-auto">
          {["all", ...categories].map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* View Mode */}
        <div className="flex gap-2 p-1 bg-background/50 backdrop-blur-md border border-white/10 rounded-2xl">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg transition-all ${
              viewMode === "grid"
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg transition-all ${
              viewMode === "list"
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Products Grid/List */}
      <div className={`grid gap-8 ${
        viewMode === "grid" 
          ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
          : "grid-cols-1"
      }`}>
        <AnimatePresence mode="popLayout">
          {filteredProducts.map((product, i) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: i * 0.05 }}
              className={viewMode === "list" ? "col-span-1" : ""}
            >
              <Card className={`h-full flex flex-col group relative overflow-hidden bg-background/40 hover:bg-background/60 transition-all duration-500 border-white/5 hover:border-primary/30 ${
                viewMode === "list" ? "flex-row" : "flex-col"
              }`}>
                {product.is_featured && (
                  <div className="absolute top-4 right-4 z-20">
                    <Badge className="bg-primary text-white border-none shadow-lg shadow-primary/20">FEATURED</Badge>
                  </div>
                )}

                {/* Product Image */}
                <div className={`relative overflow-hidden ${
                  viewMode === "list" ? "w-1/3 h-48 rounded-l-xl" : "h-40 rounded-t-xl"
                }`}>
                  <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10" />
                  <img 
                    src={product.thumbnail || product.images[0]} 
                    alt={product.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>

                {/* Product Details */}
                <div className={`flex-1 flex flex-col ${
                  viewMode === "list" ? "px-6 py-4" : "px-6 py-6"
                }`}>
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm text-primary font-mono">{product.brand}</div>
                        <h3 className="text-lg md:text-xl font-bold">{product.name}</h3>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span className="text-sm font-bold">{product.rating}</span>
                        <span className="text-xs text-muted-foreground">({product.reviews_count})</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                      {product.tags.slice(0, 3).map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs border-white/5">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-4">
                    <div className="flex items-end gap-2">
                      {product.discount_price && product.discount_price < product.price && (
                        <span className="text-sm text-muted-foreground line-through">
                          {formatPrice(product.price, product.currency)}
                        </span>
                      )}
                      <span className={`text-lg font-bold ${
                        product.discount_price && product.discount_price < product.price ? 'text-primary' : 'text-foreground'
                      }`}>
                        {formatPrice(product.discount_price || product.price, product.currency)}
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/products/${product.id}`)}
                        className="h-9 px-3"
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(product.id)}
                        disabled={isAdding === product.id}
                        className="h-9 px-3"
                      >
                        {isAdding === product.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ShoppingBag className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
          <div className="p-8 rounded-full bg-white/5 border border-white/5 animate-pulse">
            <Search className="w-16 h-16 text-muted-foreground opacity-20" />
          </div>
          <div>
            <h3 className="text-2xl font-bold">No Products Found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters to find what you're looking for.</p>
          </div>
          <Button 
            variant="outline"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
              setPriceRange([0, 1000]);
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Newsletter Section */}
      <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-[2rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex gap-4">
          <div className="p-4 rounded-2xl bg-emerald-500/10">
            <TrendingUp className="text-emerald-500 w-8 h-8" />
          </div>
          <div>
            <h4 className="text-xl font-bold">Stay Updated</h4>
            <p className="text-muted-foreground">Get notified about new products and exclusive offers.</p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Input 
            placeholder="Enter your email" 
            className="bg-background/50 border-white/10 rounded-xl"
          />
          <Button className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl">
            Subscribe
          </Button>
        </div>
      </div>
    </div>
  );
}
