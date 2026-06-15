import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Search, 
  Star, 
  MapPin, 
  Handshake,
  MessageSquare,
  TrendingUp,
  Package,
  CheckCircle,
  Clock,
  UserPlus,
  Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Farmer {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  productCount: number;
  isPartner: boolean;
  partnershipId?: string;
  partnerSince?: string;
}

export default function PartnershipsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Fetch all farmer profiles
      const { data: farmerRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'farmer');

      if (!farmerRoles || farmerRoles.length === 0) {
        setFarmers([]);
        setIsLoading(false);
        return;
      }

      const farmerIds = farmerRoles.map(r => r.user_id);

      // Fetch profiles for farmers
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', farmerIds);

      // Fetch partnerships for this retailer
      const { data: partnerships } = await supabase
        .from('partnerships')
        .select('*')
        .eq('retailer_id', user.id);

      // Fetch product counts per farmer
      const { data: products } = await supabase
        .from('products')
        .select('farmer_id')
        .in('farmer_id', farmerIds)
        .eq('is_available', true);

      const productCounts: Record<string, number> = {};
      products?.forEach(p => {
        productCounts[p.farmer_id] = (productCounts[p.farmer_id] || 0) + 1;
      });

      const partnerMap = new Map(partnerships?.map(p => [p.farmer_id, p]) || []);

      const farmerList: Farmer[] = (profiles || []).map(profile => {
        const partnership = partnerMap.get(profile.user_id);
        return {
          id: profile.id,
          user_id: profile.user_id,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          productCount: productCounts[profile.user_id] || 0,
          isPartner: partnership?.status === 'accepted',
          partnershipId: partnership?.id,
          partnerSince: partnership?.created_at,
        };
      });

      setFarmers(farmerList);
    } catch (err) {
      console.error('Error fetching partnerships:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const partners = farmers.filter(f => f.isPartner);
  const availableFarmers = farmers.filter(f => !f.isPartner);

  const filteredPartners = partners.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAvailable = availableFarmers.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendRequest = async () => {
    if (!selectedFarmer || !user) return;
    setIsSending(true);
    
    try {
      const { error } = await supabase
        .from('partnerships')
        .insert({
          retailer_id: user.id,
          farmer_id: selectedFarmer.user_id,
          status: 'accepted', // Auto-accept for now
          message: requestMessage || null,
        });

      if (error) throw error;

      toast({
        title: 'Partnership Created!',
        description: `You are now partnered with ${selectedFarmer.name}`,
      });
      
      setShowRequestDialog(false);
      setSelectedFarmer(null);
      setRequestMessage('');
      fetchData();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to create partnership', variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  const FarmerCard = ({ farmer, showPartnerActions = false }: { farmer: Farmer; showPartnerActions?: boolean }) => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                {farmer.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold">{farmer.name}</h3>
                {farmer.isPartner && (
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                    <Handshake className="h-3 w-3 mr-1" />Partner
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                <span>{farmer.email}</span>
                <span className="flex items-center gap-1">
                  <Package className="h-3 w-3" />{farmer.productCount} products
                </span>
              </div>

              {farmer.isPartner && farmer.partnerSince && (
                <p className="text-xs text-muted-foreground">
                  Partner since {new Date(farmer.partnerSince).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {!showPartnerActions && (
                <Button 
                  size="sm" className="gap-1"
                  onClick={() => { setSelectedFarmer(farmer); setShowRequestDialog(true); }}
                >
                  <UserPlus className="h-4 w-4" />Partner
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <DashboardLayout title="Farmer Partnerships" subtitle="Build relationships with trusted farmers">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Partners</p>
                  <p className="text-2xl font-bold text-success">{partners.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-success/10"><Handshake className="h-6 w-6 text-success" /></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Available Farmers</p>
                  <p className="text-2xl font-bold">{availableFarmers.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-primary/10"><Users className="h-6 w-6 text-primary" /></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Products</p>
                  <p className="text-2xl font-bold">{partners.reduce((sum, f) => sum + f.productCount, 0)}</p>
                </div>
                <div className="p-3 rounded-xl bg-accent/10"><TrendingUp className="h-6 w-6 text-accent" /></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search farmers by name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="partners" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="partners" className="gap-2">
                <Handshake className="h-4 w-4" />My Partners ({partners.length})
              </TabsTrigger>
              <TabsTrigger value="discover" className="gap-2">
                <Users className="h-4 w-4" />Discover ({availableFarmers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="partners" className="space-y-4">
              {filteredPartners.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Handshake className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-1">No Partners Yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">Start building relationships with farmers</p>
                  </CardContent>
                </Card>
              ) : filteredPartners.map(farmer => <FarmerCard key={farmer.id} farmer={farmer} showPartnerActions />)}
            </TabsContent>

            <TabsContent value="discover" className="space-y-4">
              {filteredAvailable.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <CheckCircle className="h-12 w-12 mx-auto text-success mb-4" />
                    <h3 className="font-semibold mb-1">No Farmers Available</h3>
                    <p className="text-sm text-muted-foreground">Check back later for new farmers</p>
                  </CardContent>
                </Card>
              ) : filteredAvailable.map(farmer => <FarmerCard key={farmer.id} farmer={farmer} />)}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Partnership Request Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" />Create Partnership</DialogTitle>
            <DialogDescription>Partner with {selectedFarmer?.name}</DialogDescription>
          </DialogHeader>
          {selectedFarmer && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <Avatar>
                  <AvatarFallback className="bg-primary/10 text-primary">{selectedFarmer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedFarmer.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedFarmer.productCount} products listed</p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Message (Optional)</label>
                <Textarea placeholder="Introduce yourself..." value={requestMessage} onChange={(e) => setRequestMessage(e.target.value)} rows={4} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestDialog(false)}>Cancel</Button>
            <Button onClick={handleSendRequest} disabled={isSending}>
              {isSending ? <><Clock className="h-4 w-4 mr-2 animate-spin" />Creating...</> : <><Handshake className="h-4 w-4 mr-2" />Create Partnership</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
