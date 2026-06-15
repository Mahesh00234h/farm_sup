import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Star, Send, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Review {
  id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  reviewer_id: string;
  reviewer_name?: string;
}

interface ProductReviewSectionProps {
  productId: string;
}

export default function ProductReviewSection({ productId }: ProductReviewSectionProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch reviewer names
      const reviewerIds = [...new Set((data || []).map(r => r.reviewer_id))];
      let profileMap: Record<string, string> = {};
      if (reviewerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, name')
          .in('user_id', reviewerIds);
        profiles?.forEach(p => { profileMap[p.user_id] = p.name; });
      }

      const enriched = (data || []).map(r => ({
        ...r,
        reviewer_name: profileMap[r.reviewer_id] || 'Anonymous',
      }));

      setReviews(enriched);
      if (user) {
        setHasReviewed(enriched.some(r => r.reviewer_id === user.id));
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setIsLoading(false);
    }
  }, [productId, user]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleSubmit = async () => {
    if (!user || rating === 0) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('product_reviews').insert({
        product_id: productId,
        reviewer_id: user.id,
        rating,
        review_text: reviewText || null,
      });
      if (error) throw error;
      toast.success('Review submitted!');
      setRating(0);
      setReviewText('');
      fetchReviews();
    } catch (err: any) {
      toast.error(err.message?.includes('duplicate') ? 'You already reviewed this product' : 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '0';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Reviews ({reviews.length})</h3>
        {reviews.length > 0 && (
          <div className="flex items-center gap-1">
            <Star className="h-5 w-5 fill-warning text-warning" />
            <span className="font-bold">{avgRating}</span>
          </div>
        )}
      </div>

      {/* Write Review */}
      {user && !hasReviewed && (
        <div className="bg-muted/30 rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium">Rate this product</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(s => (
              <button
                key={s}
                onMouseEnter={() => setHoverRating(s)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(s)}
              >
                <Star className={cn("h-6 w-6 transition-colors",
                  (hoverRating || rating) >= s ? "fill-warning text-warning" : "text-muted-foreground"
                )} />
              </button>
            ))}
          </div>
          <Textarea
            value={reviewText}
            onChange={e => setReviewText(e.target.value)}
            placeholder="Write your review (optional)..."
            rows={2}
          />
          <Button size="sm" onClick={handleSubmit} disabled={rating === 0 || isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
            Submit Review
          </Button>
        </div>
      )}

      {/* Reviews List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-20 bg-muted/30 rounded-xl animate-pulse" />)}
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No reviews yet</p>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {reviews.map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-xl p-3"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{review.reviewer_name}</span>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className={cn("h-3.5 w-3.5", review.rating >= s ? "fill-warning text-warning" : "text-muted")} />
                  ))}
                </div>
              </div>
              {review.review_text && <p className="text-sm text-muted-foreground">{review.review_text}</p>}
              <p className="text-xs text-muted-foreground mt-1">{new Date(review.created_at).toLocaleDateString()}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
