import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Plus, Star, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';
import WishlistButton from './WishlistButton';
import ProductReviewSection from './ProductReviewSection';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  unit: string;
  category: string;
  images: string[] | null;
  farmer_id: string;
  quality_score: number | null;
  is_available: boolean | null;
}

interface ProductCardProps {
  product: Product;
  onViewDetails?: (product: Product) => void;
}

export default function ProductCard({ product, onViewDetails }: ProductCardProps) {
  const { addItem } = useCart();
  const [showDetails, setShowDetails] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      unit: product.unit,
      image: product.images?.[0],
      farmerId: product.farmer_id,
      maxQuantity: product.quantity,
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      vegetables: 'bg-success/10 text-success',
      fruits: 'bg-warning/10 text-warning',
      grains: 'bg-amber-500/10 text-amber-600',
      dairy: 'bg-info/10 text-info',
      poultry: 'bg-primary/10 text-primary',
      livestock: 'bg-destructive/10 text-destructive',
    };
    return colors[category.toLowerCase()] || 'bg-muted text-muted-foreground';
  };

  return (
    <>
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => setShowDetails(true)}
      className="bg-card rounded-2xl border border-border overflow-hidden cursor-pointer group"
    >
      {/* Image */}
      <div className="relative aspect-square bg-muted">
        {product.images?.[0] ? (
          <img 
            src={product.images[0]} 
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Leaf className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}
        
        {/* Wishlist Button */}
        <WishlistButton productId={product.id} className="absolute top-3 right-3 z-10" />

        {/* Category Badge */}
        <span className={cn(
          "absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium capitalize",
          getCategoryColor(product.category)
        )}>
          {product.category}
        </span>

        {/* Organic Badge */}
        {product.quality_score && product.quality_score >= 80 && (
          <span className="absolute bottom-3 right-3 px-2 py-1 bg-success text-success-foreground rounded-full text-xs font-medium flex items-center gap-1">
            <Leaf className="h-3 w-3" />
            Organic
          </span>
        )}

        {/* Out of Stock Overlay */}
        {!product.is_available && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <span className="text-destructive font-medium">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        
        {product.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {product.description}
          </p>
        )}

        {/* Rating */}
        {product.quality_score && (
          <div className="flex items-center gap-1 mt-2">
            <Star className="h-4 w-4 fill-warning text-warning" />
            <span className="text-sm font-medium">{(product.quality_score / 20).toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">(Quality Score)</span>
          </div>
        )}

        {/* Price and Add to Cart */}
        <div className="flex items-center justify-between mt-4">
          <div>
            <p className="text-xl font-bold text-primary">₹{product.price}</p>
            <p className="text-xs text-muted-foreground">per {product.unit}</p>
          </div>
          
          <Button 
            size="sm"
            onClick={handleAddToCart}
            disabled={!product.is_available || product.quantity === 0}
            className="rounded-full"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>

        {/* Stock Info */}
        <p className={cn(
          "text-xs mt-2",
          product.quantity < 10 ? "text-warning" : "text-muted-foreground"
        )}>
          {product.quantity < 10 ? `Only ${product.quantity} ${product.unit} left` : `${product.quantity} ${product.unit} available`}
        </p>
      </div>
    </motion.div>

    {/* Product Detail Dialog */}
    <Dialog open={showDetails} onOpenChange={setShowDetails}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {product.images?.[0] && (
            <img src={product.images[0]} alt={product.name} className="w-full h-48 object-cover rounded-xl" />
          )}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-primary">₹{product.price}/{product.unit}</p>
              <p className="text-sm text-muted-foreground">{product.quantity} {product.unit} available</p>
            </div>
            <Button onClick={handleAddToCart} disabled={!product.is_available}>
              <Plus className="h-4 w-4 mr-1" /> Add to Cart
            </Button>
          </div>
          {product.description && <p className="text-sm text-muted-foreground">{product.description}</p>}
          <ProductReviewSection productId={product.id} />
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
