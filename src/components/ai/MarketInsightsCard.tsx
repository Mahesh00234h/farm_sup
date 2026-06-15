import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  MapPin, 
  Clock, 
  Lightbulb,
  Loader2,
  Sparkles,
  Store,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useMarketInsights } from '@/hooks/useMarketInsights';
import { cn } from '@/lib/utils';

interface MarketInsightsCardProps {
  defaultCrop?: string;
  location?: { lat: number; lng: number; state?: string };
}

export default function MarketInsightsCard({ defaultCrop, location }: MarketInsightsCardProps) {
  const { isLoading, insights, getMarketInsights } = useMarketInsights();
  const [crop, setCrop] = useState(defaultCrop || '');

  const handleGetInsights = () => {
    if (!crop.trim()) return;
    getMarketInsights(
      crop,
      location || { lat: 20.5937, lng: 78.9629, state: 'India' }
    );
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising': return <TrendingUp className="h-4 w-4 text-success" />;
      case 'falling': return <TrendingDown className="h-4 w-4 text-destructive" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Market Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!insights && (
          <div className="space-y-3">
            <div>
              <Label>Crop Name</Label>
              <Input
                value={crop}
                onChange={(e) => setCrop(e.target.value)}
                placeholder="e.g., Wheat, Rice, Tomato"
                className="mt-1"
              />
            </div>
            <Button 
              onClick={handleGetInsights} 
              disabled={isLoading || !crop.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing market...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Get AI Insights
                </>
              )}
            </Button>
          </div>
        )}

        {insights && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Price Overview */}
            <div className="p-4 rounded-xl bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Current Market Price</span>
                <div className="flex items-center gap-1">
                  {getTrendIcon(insights.priceAnalysis.trend)}
                  <span className={cn(
                    "text-sm font-medium",
                    insights.priceAnalysis.trend === 'rising' ? 'text-success' :
                    insights.priceAnalysis.trend === 'falling' ? 'text-destructive' :
                    'text-muted-foreground'
                  )}>
                    {insights.priceAnalysis.percentChange > 0 ? '+' : ''}
                    {insights.priceAnalysis.percentChange}%
                  </span>
                </div>
              </div>
              <p className="text-2xl font-bold">
                ₹{insights.currentMarketPrice.averagePrice}
                <span className="text-sm font-normal text-muted-foreground">
                  /{insights.currentMarketPrice.unit}
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Range: ₹{insights.currentMarketPrice.minPrice} - ₹{insights.currentMarketPrice.maxPrice}
              </p>
            </div>

            {/* Sell Recommendation */}
            <div className={cn(
              "p-4 rounded-xl",
              insights.bestTimeToSell.recommendation === 'now' ? 'bg-success/10' :
              insights.bestTimeToSell.recommendation === 'wait' ? 'bg-warning/10' :
              'bg-info/10'
            )}>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4" />
                <span className="font-medium">
                  {insights.bestTimeToSell.recommendation === 'now' ? 'Sell Now!' :
                   insights.bestTimeToSell.recommendation === 'wait' ? 'Wait to Sell' :
                   'Partial Sell Recommended'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{insights.bestTimeToSell.reason}</p>
              <p className="text-xs mt-2">
                <Calendar className="h-3 w-3 inline mr-1" />
                Optimal month: {insights.bestTimeToSell.optimalMonth}
              </p>
            </div>

            {/* Nearby Mandis */}
            {insights.nearbyMandis?.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  Nearby Mandis
                </h4>
                <div className="space-y-2">
                  {insights.nearbyMandis.slice(0, 3).map((mandi, i) => (
                    <div 
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <div>
                        <p className="text-sm font-medium">{mandi.name}</p>
                        <p className="text-xs text-muted-foreground">{mandi.distance}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">₹{mandi.currentPrice}</p>
                        <Badge variant={
                          mandi.demand === 'high' ? 'default' :
                          mandi.demand === 'medium' ? 'secondary' : 'outline'
                        } className="text-xs">
                          {mandi.demand} demand
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tips */}
            {insights.sellingTips?.length > 0 && (
              <div className="p-4 rounded-xl bg-primary/5">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-warning" />
                  Selling Tips
                </h4>
                <ul className="space-y-1">
                  {insights.sellingTips.map((tip, i) => (
                    <li key={i} className="text-sm text-muted-foreground">• {tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* MSP */}
            {insights.governmentMSP && (
              <p className="text-sm text-center text-muted-foreground">
                Government MSP: <strong>₹{insights.governmentMSP}/quintal</strong>
              </p>
            )}

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                setCrop('');
              }}
            >
              Check Another Crop
            </Button>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
