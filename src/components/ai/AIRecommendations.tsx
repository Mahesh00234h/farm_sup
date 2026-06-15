import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles,
  ShoppingBag,
  Leaf,
  TrendingUp,
  Star,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useProductRecommendations } from '@/hooks/useProductRecommendations';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  quality_score: number | null;
  farmer_id: string;
  images?: string[] | null;
}

interface AIRecommendationsProps {
  products: Product[];
  onProductClick?: (productId: string) => void;
  className?: string;
}

export default function AIRecommendations({ 
  products, 
  onProductClick,
  className 
}: AIRecommendationsProps) {
  const { isLoading, recommendations, getRecommendations } = useProductRecommendations();

  useEffect(() => {
    if (products.length > 0 && !recommendations) {
      getRecommendations(products);
    }
  }, [products]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Getting personalized recommendations...</p>
        </CardContent>
      </Card>
    );
  }

  if (!recommendations) return null;

  const recommendedProducts = recommendations.recommendations
    .slice(0, 4)
    .map(rec => {
      const product = products.find(p => p.id === rec.productId);
      return product ? { ...product, reason: rec.reason, matchScore: rec.matchScore } : null;
    })
    .filter(Boolean);

  if (recommendedProducts.length === 0) return null;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-transparent">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          Recommended for You
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-3">
          {recommendedProducts.map((product, i) => (
            <motion.button
              key={product!.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => onProductClick?.(product!.id)}
              className="p-3 rounded-xl bg-muted/50 hover:bg-muted text-left transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="p-2 rounded-lg bg-background">
                  {product!.category === 'vegetables' ? (
                    <Leaf className="h-4 w-4 text-success" />
                  ) : (
                    <ShoppingBag className="h-4 w-4 text-primary" />
                  )}
                </div>
                <Badge variant="secondary" className="text-xs">
                  {product!.matchScore}% match
                </Badge>
              </div>
              <h4 className="font-medium text-sm truncate">{product!.name}</h4>
              <p className="text-lg font-bold text-primary">₹{product!.price}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {product!.reason}
              </p>
            </motion.button>
          ))}
        </div>

        {recommendations.personalizedCategories?.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Based on your preferences:</p>
            <div className="flex flex-wrap gap-2">
              {recommendations.personalizedCategories.map((cat) => (
                <Badge key={cat} variant="outline" className="text-xs">
                  {cat}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
