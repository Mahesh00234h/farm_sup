import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  MapPin, 
  CreditCard, 
  Truck,
  ChevronLeft,
  CheckCircle,
  Loader2,
  Phone,
  User,
  Home,
  Crosshair
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type CheckoutStep = 'details' | 'payment' | 'confirmation';

const PLATFORM_COMMISSION = 0.11; // 11%

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof (window as any).Razorpay !== 'undefined') return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  
  const [step, setStep] = useState<CheckoutStep>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay'>('razorpay');
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: '',
    address: '',
    city: '',
    pincode: '',
    notes: '',
  });
  const [deliveryCoords, setDeliveryCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [capturingLocation, setCapturingLocation] = useState(false);

  const deliveryFee = totalPrice > 500 ? 0 : 40;
  const platformFee = +(totalPrice * PLATFORM_COMMISSION).toFixed(2);
  const sellerPayout = +(totalPrice - platformFee).toFixed(2);
  const grandTotal = +(totalPrice + deliveryFee).toFixed(2);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const captureLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }
    setCapturingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDeliveryCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast.success('Delivery location captured');
        setCapturingLocation(false);
      },
      () => {
        toast.error('Could not get your location — enable GPS');
        setCapturingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const validateDetails = () => {
    if (!formData.name || !formData.phone || !formData.address || !formData.city || !formData.pincode) {
      toast.error('Please fill all required fields');
      return false;
    }
    if (formData.phone.length < 10) {
      toast.error('Please enter a valid phone number');
      return false;
    }
    if (formData.pincode.length !== 6) {
      toast.error('Please enter a valid 6-digit pincode');
      return false;
    }
    if (!deliveryCoords) {
      toast.error('Capture your delivery GPS location so nearby village delivery partners can be notified');
      return false;
    }
    return true;
  };

  const createOrders = async (): Promise<Array<{ id: string; total: number }>> => {
    const ordersByFarmer = items.reduce((acc, item) => {
      if (!acc[item.farmerId]) acc[item.farmerId] = [];
      acc[item.farmerId].push(item);
      return acc;
    }, {} as Record<string, typeof items>);

    const fullAddress = `${formData.address}, ${formData.city} - ${formData.pincode}`;
    const orderIds: Array<{ id: string; total: number }> = [];
    const sellerCount = Object.keys(ordersByFarmer).length;
    const perSellerDeliveryFee = sellerCount > 0 ? +(deliveryFee / sellerCount).toFixed(2) : 0;

    for (const [farmerId, farmerItems] of Object.entries(ordersByFarmer)) {
      for (const item of farmerItems) {
        const lineSubtotal = +(item.price * item.quantity).toFixed(2);
        const linePlatformFee = +(lineSubtotal * PLATFORM_COMMISSION).toFixed(2);
        const lineSellerPayout = +(lineSubtotal - linePlatformFee).toFixed(2);
        const lineTotal = +(lineSubtotal + perSellerDeliveryFee / farmerItems.length).toFixed(2);

        const { data, error } = await supabase
          .from('orders')
          .insert({
            buyer_id: user!.id,
            seller_id: farmerId,
            product_id: item.productId,
            quantity: item.quantity,
            subtotal: lineSubtotal,
            delivery_fee: +(perSellerDeliveryFee / farmerItems.length).toFixed(2),
            platform_fee: linePlatformFee,
            seller_payout: lineSellerPayout,
            total_price: lineTotal,
            delivery_address: fullAddress,
            delivery_coordinates: deliveryCoords ?? null,
            payment_method: paymentMethod,
            payment_status: paymentMethod === 'cod' ? 'cod_pending' : 'awaiting_payment',
            status: 'pending',
          })
          .select('id, total_price')
          .single();

        if (error) throw error;
        orderIds.push({ id: data.id, total: Number(data.total_price) });
      }
    }
    return orderIds;
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error('Please login to place order');
      navigate('/login');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderIds = await createOrders();
      const primaryOrder = orderIds[0];
      const primaryId = primaryOrder.id;
      setOrderId(primaryId);
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (paymentMethod === 'cod') {
        clearCart();
        setStep('confirmation');
        toast.success('Order placed — pay on delivery');
        for (const order of orderIds) {
          supabase.functions.invoke('dispatch-delivery', {
            body: { order_id: order.id },
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          }).catch(() => {});
        }
        return;
      }

      // Razorpay flow: create and verify one payment per internal order so each invoice stays correct.
      const ok = await loadRazorpay();
      if (!ok) {
        toast.error('Could not load Razorpay');
        return;
      }
      const { data: rzpData, error: rzpErr } = await supabase.functions.invoke('razorpay-create-order', {
        body: { order_ids: orderIds.map((order) => order.id) },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (rzpErr || !rzpData?.razorpay_order_id) {
        throw new Error(rzpErr?.message || 'Failed to create payment');
      }

      const rzp = new (window as any).Razorpay({
        key: rzpData.key_id,
        order_id: rzpData.razorpay_order_id,
        amount: rzpData.amount,
        currency: rzpData.currency,
        name: 'Farmline',
        description: `Order ${primaryId.slice(0, 8).toUpperCase()}`,
        prefill: { name: formData.name, contact: formData.phone, email: user.email },
        theme: { color: '#16a34a' },
        handler: async (resp: any) => {
          try {
            const { error: verErr } = await supabase.functions.invoke('razorpay-verify-payment', {
              body: {
                order_id: primaryId,
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_signature: resp.razorpay_signature,
              },
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            if (verErr) throw verErr;
            clearCart();
            setStep('confirmation');
            toast.success('Payment successful!');
          } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Verification failed');
          }
        },
        modal: {
          ondismiss: () => {
            toast.info('Payment cancelled. You can retry from your orders page.');
            setIsSubmitting(false);
          },
        },
      });
      rzp.on('payment.failed', (resp: any) => {
        toast.error(resp.error?.description || 'Payment failed');
      });
      rzp.open();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to place order';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0 && step !== 'confirmation') {
    return (
      <DashboardLayout title="Checkout" subtitle="Complete your purchase">
        <div className="flex flex-col items-center justify-center py-16">
          <ShoppingBag className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
          <p className="text-muted-foreground mb-4">Add some products to checkout</p>
          <Button onClick={() => navigate('/marketplace')}>
            Browse Products
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Checkout" subtitle="Complete your purchase">
      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {['details', 'payment', 'confirmation'].map((s, index) => (
            <div key={s} className="flex items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                step === s 
                  ? "bg-primary text-primary-foreground" 
                  : ['details', 'payment', 'confirmation'].indexOf(step) > index
                    ? "bg-success text-success-foreground"
                    : "bg-muted text-muted-foreground"
              )}>
                {['details', 'payment', 'confirmation'].indexOf(step) > index ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              {index < 2 && (
                <div className={cn(
                  "w-16 h-0.5 mx-2",
                  ['details', 'payment', 'confirmation'].indexOf(step) > index 
                    ? "bg-success" 
                    : "bg-muted"
                )} />
              )}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {step === 'details' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-card rounded-2xl p-6 border border-border"
              >
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  Delivery Details
                </h2>

                <div className="grid gap-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <div className="relative mt-1">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="pl-10"
                          placeholder="Your full name"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <div className="relative mt-1">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="pl-10"
                          placeholder="10-digit phone number"
                          maxLength={10}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Delivery Address *</Label>
                    <div className="relative mt-1">
                      <Home className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="pl-10"
                        placeholder="House/Flat no., Building, Street"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <div className="relative mt-1">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className="pl-10"
                          placeholder="Your city"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="pincode">Pincode *</Label>
                      <Input
                        id="pincode"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleInputChange}
                        placeholder="6-digit pincode"
                        maxLength={6}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Delivery Notes (Optional)</Label>
                    <Input
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Any special instructions"
                      className="mt-1"
                    />
                  </div>

                  <div className="rounded-xl border border-dashed border-border p-3 flex items-center justify-between gap-3">
                    <div className="text-sm">
                      <p className="font-medium flex items-center gap-2">
                        <Crosshair className="h-4 w-4 text-primary" />
                        Pin exact location
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {deliveryCoords
                          ? `Captured (${deliveryCoords.lat.toFixed(4)}, ${deliveryCoords.lng.toFixed(4)})`
                          : 'Helps us find a nearby delivery partner faster'}
                      </p>
                    </div>
                    <Button type="button" variant={deliveryCoords ? 'outline' : 'secondary'} size="sm" onClick={captureLocation} disabled={capturingLocation}>
                      {capturingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : deliveryCoords ? 'Update' : 'Use GPS'}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={() => navigate('/marketplace')}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back to Shop
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={() => validateDetails() && setStep('payment')}
                  >
                    Continue to Payment
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 'payment' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-card rounded-2xl p-6 border border-border"
              >
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Payment Method
                </h2>

                <div className="space-y-4">
                  {/* Razorpay Online Option */}
                  <label className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors",
                    paymentMethod === 'razorpay' ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
                  )}>
                    <input
                      type="radio" name="payment" className="sr-only"
                      checked={paymentMethod === 'razorpay'}
                      onChange={() => setPaymentMethod('razorpay')}
                    />
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                      paymentMethod === 'razorpay' ? "border-primary" : "border-muted-foreground"
                    )}>
                      {paymentMethod === 'razorpay' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Pay Online (UPI / Card / Netbanking)</p>
                      <p className="text-sm text-muted-foreground">Secure payment via Razorpay</p>
                    </div>
                    <span className="px-2 py-1 bg-success/10 text-success text-xs rounded-full">
                      Instant
                    </span>
                  </label>

                  {/* COD Option */}
                  <label className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors",
                    paymentMethod === 'cod' ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
                  )}>
                    <input
                      type="radio" name="payment" className="sr-only"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                    />
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                      paymentMethod === 'cod' ? "border-primary" : "border-muted-foreground"
                    )}>
                      {paymentMethod === 'cod' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Cash on Delivery</p>
                      <p className="text-sm text-muted-foreground">Pay when you receive your order</p>
                    </div>
                  </label>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={() => setStep('details')}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Placing Order...
                      </>
                    ) : (
                      <>Place Order - ₹{grandTotal.toFixed(2)}</>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 'confirmation' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card rounded-2xl p-8 border border-border text-center"
              >
                <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-10 w-10 text-success" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Order Placed Successfully!</h2>
                <p className="text-muted-foreground mb-6">
                  Thank you for your order. You will receive a confirmation shortly.
                </p>
                
                {orderId && (
                  <div className="bg-muted/50 rounded-xl p-4 mb-6">
                    <p className="text-sm text-muted-foreground">Order ID</p>
                    <p className="font-mono font-bold">{orderId.slice(0, 8).toUpperCase()}</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {orderId && paymentMethod === 'razorpay' && (
                    <Button variant="outline" onClick={() => navigate(`/invoice/${orderId}`)}>
                      View Invoice
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => navigate('/marketplace/orders')}>
                    View Orders
                  </Button>
                  <Button onClick={() => navigate('/marketplace')}>
                    Continue Shopping
                  </Button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Order Summary */}
          {step !== 'confirmation' && (
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl p-6 border border-border sticky top-24"
              >
                <h3 className="font-bold mb-4">Order Summary</h3>
                
                <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} × ₹{item.price}
                        </p>
                      </div>
                      <p className="font-medium text-sm">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery</span>
                    <span className={deliveryFee === 0 ? 'text-success' : ''}>
                      {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                    </span>
                  </div>
                  {deliveryFee > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Free delivery on orders above ₹500
                    </p>
                  )}
                  <div className="flex justify-between text-xs text-muted-foreground pt-1">
                    <span>Platform fee (11% — included in product price)</span>
                    <span>₹{platformFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                    <span>Total</span>
                    <span className="text-primary">₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
