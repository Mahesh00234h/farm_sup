import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface WishlistButtonProps {
  productId: string;
  className?: string;
}

export default function WishlistButton({ productId, className }: WishlistButtonProps) {
  const { user } = useAuth();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('wishlists')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .maybeSingle()
      .then(({ data }) => setIsWishlisted(!!data));
  }, [user, productId]);

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { toast.error('Please login first'); return; }
    setIsLoading(true);
    try {
      if (isWishlisted) {
        await supabase.from('wishlists').delete().eq('user_id', user.id).eq('product_id', productId);
        setIsWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        await supabase.from('wishlists').insert({ user_id: user.id, product_id: productId });
        setIsWishlisted(true);
        toast.success('Added to wishlist');
      }
    } catch { toast.error('Failed to update wishlist'); }
    finally { setIsLoading(false); }
  };

  return (
    <button
      onClick={toggle}
      disabled={isLoading}
      className={cn(
        "p-2 rounded-full transition-all",
        isWishlisted ? "bg-destructive/10" : "bg-background/80 hover:bg-background",
        className
      )}
    >
      <Heart className={cn("h-4 w-4 transition-colors",
        isWishlisted ? "fill-destructive text-destructive" : "text-muted-foreground"
      )} />
    </button>
  );
}
