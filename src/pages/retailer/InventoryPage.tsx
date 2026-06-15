import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  Search, 
  Plus, 
  Minus, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Edit,
  Trash2,
  BarChart3,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  current_stock: number;
  min_stock: number;
  max_stock: number;
  unit: string;
  cost_price: number;
  selling_price: number;
  trend: string;
  last_restocked: string | null;
}

const categories = ['All', 'Vegetables', 'Fruits', 'Grains', 'Dairy', 'Spices'];

export default function InventoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'ok'>('all');
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newItem, setNewItem] = useState({
    name: '', category: 'Vegetables', current_stock: 0, min_stock: 0, max_stock: 100, unit: 'kg', cost_price: 0, selling_price: 0,
  });

  const fetchInventory = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('retailer_inventory')
        .select('*')
        .eq('retailer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInventory((data || []) as InventoryItem[]);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const isLowStock = item.current_stock < item.min_stock;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'low' && isLowStock) || 
                         (filterStatus === 'ok' && !isLowStock);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const lowStockCount = inventory.filter(item => item.current_stock < item.min_stock).length;
  const totalValue = inventory.reduce((sum, item) => sum + (item.current_stock * item.cost_price), 0);

  const getStockStatus = (current: number, min: number, max: number) => {
    const percentage = (current / max) * 100;
    if (current < min) return { status: 'critical', color: 'text-destructive', bgColor: 'bg-destructive' };
    if (percentage < 40) return { status: 'low', color: 'text-warning', bgColor: 'bg-warning' };
    return { status: 'good', color: 'text-success', bgColor: 'bg-success' };
  };

  const handleUpdateStock = async (id: string, change: number) => {
    const item = inventory.find(i => i.id === id);
    if (!item) return;
    const newStock = Math.max(0, Math.min(item.max_stock, item.current_stock + change));
    
    try {
      const { error } = await supabase
        .from('retailer_inventory')
        .update({ current_stock: newStock, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      setInventory(inventory.map(i => i.id === id ? { ...i, current_stock: newStock } : i));
      toast({ title: 'Stock Updated' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update stock', variant: 'destructive' });
    }
  };

  const handleSaveEdit = async () => {
    if (!editItem) return;
    try {
      const { error } = await supabase
        .from('retailer_inventory')
        .update({
          current_stock: editItem.current_stock,
          min_stock: editItem.min_stock,
          cost_price: editItem.cost_price,
          selling_price: editItem.selling_price,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editItem.id);
      if (error) throw error;
      setInventory(inventory.map(item => item.id === editItem.id ? editItem : item));
      setShowEditDialog(false);
      setEditItem(null);
      toast({ title: 'Item Updated' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update item', variant: 'destructive' });
    }
  };

  const handleAddItem = async () => {
    if (!user || !newItem.name.trim()) return;
    try {
      const { error } = await supabase
        .from('retailer_inventory')
        .insert({ ...newItem, retailer_id: user.id });
      if (error) throw error;
      toast({ title: 'Item Added' });
      setShowAddDialog(false);
      setNewItem({ name: '', category: 'Vegetables', current_stock: 0, min_stock: 0, max_stock: 100, unit: 'kg', cost_price: 0, selling_price: 0 });
      fetchInventory();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to add item', variant: 'destructive' });
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const { error } = await supabase.from('retailer_inventory').delete().eq('id', id);
      if (error) throw error;
      setInventory(inventory.filter(i => i.id !== id));
      toast({ title: 'Item Deleted' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to delete item', variant: 'destructive' });
    }
  };

  return (
    <DashboardLayout 
      title="Inventory Management" 
      subtitle="Track and manage your stock levels"
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Items</p>
                  <p className="text-2xl font-bold">{inventory.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-primary/10">
                  <Package className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Low Stock</p>
                  <p className="text-2xl font-bold text-warning">{lowStockCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-warning/10">
                  <AlertTriangle className="h-6 w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Inventory Value</p>
                  <p className="text-2xl font-bold">₹{totalValue.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-xl bg-success/10">
                  <BarChart3 className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Categories</p>
                  <p className="text-2xl font-bold">{new Set(inventory.map(i => i.category)).size}</p>
                </div>
                <div className="p-3 rounded-xl bg-accent/10">
                  <Package className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search inventory..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-[150px]"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>{categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as 'all' | 'low' | 'ok')}>
                <SelectTrigger className="w-full md:w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="low">Low Stock</SelectItem>
                  <SelectItem value="ok">Well Stocked</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />Add Item
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Inventory List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredInventory.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-1">{inventory.length === 0 ? 'No Inventory Items' : 'No Items Found'}</h3>
                <p className="text-sm text-muted-foreground">
                  {inventory.length === 0 ? 'Add items to start managing your inventory' : 'Try adjusting your filters'}
                </p>
                {inventory.length === 0 && (
                  <Button className="mt-4" onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />Add First Item
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredInventory.map((item, index) => {
              const stockStatus = getStockStatus(item.current_stock, item.min_stock, item.max_stock);
              const stockPercentage = (item.current_stock / item.max_stock) * 100;
              
              return (
                <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                  <Card className={item.current_stock < item.min_stock ? 'border-warning/50' : ''}>
                    <CardContent className="p-4">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">{item.name}</h3>
                            <Badge variant="outline">{item.category}</Badge>
                            {item.current_stock < item.min_stock && (
                              <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Low Stock</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Cost: ₹{item.cost_price}/{item.unit}</span>
                            <span>Sell: ₹{item.selling_price}/{item.unit}</span>
                            <span className="flex items-center gap-1">
                              {item.trend === 'up' && <TrendingUp className="h-3 w-3 text-success" />}
                              {item.trend === 'down' && <TrendingDown className="h-3 w-3 text-destructive" />}
                              {item.trend === 'stable' && <span className="w-3 h-0.5 bg-muted-foreground" />}
                            </span>
                          </div>
                        </div>
                        <div className="w-full lg:w-48">
                          <div className="flex justify-between text-sm mb-1">
                            <span className={stockStatus.color}>{item.current_stock} {item.unit}</span>
                            <span className="text-muted-foreground">/ {item.max_stock} {item.unit}</span>
                          </div>
                          <Progress value={stockPercentage} className={`h-2 ${stockStatus.bgColor}`} />
                          <p className="text-xs text-muted-foreground mt-1">Min: {item.min_stock} {item.unit}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="icon" variant="outline" onClick={() => handleUpdateStock(item.id, -10)}><Minus className="h-4 w-4" /></Button>
                          <Button size="icon" variant="outline" onClick={() => handleUpdateStock(item.id, 10)}><Plus className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => { setEditItem(item); setShowEditDialog(true); }}><Edit className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDeleteItem(item.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Inventory Item</DialogTitle></DialogHeader>
          {editItem && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Current Stock</Label>
                  <Input type="number" value={editItem.current_stock} onChange={(e) => setEditItem({ ...editItem, current_stock: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Min Stock Level</Label>
                  <Input type="number" value={editItem.min_stock} onChange={(e) => setEditItem({ ...editItem, min_stock: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Cost Price (₹)</Label>
                  <Input type="number" value={editItem.cost_price} onChange={(e) => setEditItem({ ...editItem, cost_price: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Selling Price (₹)</Label>
                  <Input type="number" value={editItem.selling_price} onChange={(e) => setEditItem({ ...editItem, selling_price: Number(e.target.value) })} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Inventory Item</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} placeholder="e.g. Organic Tomatoes" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={newItem.category} onValueChange={(v) => setNewItem({ ...newItem, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.filter(c => c !== 'All').map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={newItem.unit} onValueChange={(v) => setNewItem({ ...newItem, unit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="L">L</SelectItem>
                    <SelectItem value="units">units</SelectItem>
                    <SelectItem value="dozen">dozen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Current Stock</Label>
                <Input type="number" value={newItem.current_stock} onChange={(e) => setNewItem({ ...newItem, current_stock: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Min Stock</Label>
                <Input type="number" value={newItem.min_stock} onChange={(e) => setNewItem({ ...newItem, min_stock: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Cost Price (₹)</Label>
                <Input type="number" value={newItem.cost_price} onChange={(e) => setNewItem({ ...newItem, cost_price: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Selling Price (₹)</Label>
                <Input type="number" value={newItem.selling_price} onChange={(e) => setNewItem({ ...newItem, selling_price: Number(e.target.value) })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddItem} disabled={!newItem.name.trim()}>Add Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
