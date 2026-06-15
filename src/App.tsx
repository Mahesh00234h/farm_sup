import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { ProtectedRoute, PublicRoute } from "@/components/auth/ProtectedRoute";

// Loading Component
const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// Core Pages (kept static as they're frequently accessed)
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import VerifyOtpPage from "./pages/VerifyOtpPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import NotFound from "./pages/NotFound";
import InstallPage from "./pages/InstallPage";
import HackathonPresentation from "./pages/HackathonPresentation";

// PWA Components
import { InstallPrompt } from "./components/pwa/InstallPrompt";
import { OfflineIndicator } from "./components/pwa/OfflineIndicator";
import { SyncIndicator } from "./components/pwa/SyncIndicator";
import { UpdatePrompt } from "./components/pwa/UpdatePrompt";
import AutoTranslator from "./components/i18n/AutoTranslator";
import NativeTutorial from "./components/onboarding/NativeTutorial";

// Lazy loaded Farmer Pages
const FarmerDashboard = lazy(() => import("./pages/farmer/FarmerDashboard"));
const FarmMapPage = lazy(() => import("./pages/farmer/FarmMapPage"));
const WeatherCropsPage = lazy(() => import("./pages/farmer/WeatherCropsPage"));
const DiseasePage = lazy(() => import("./pages/farmer/DiseasePage"));
const ProductsPage = lazy(() => import("./pages/farmer/ProductsPage"));
const FarmerOrdersPage = lazy(() => import("./pages/farmer/OrdersPage"));
const SchemesPage = lazy(() => import("./pages/farmer/SchemesPage"));
const EquipmentRentalPage = lazy(() => import("./pages/farmer/EquipmentRentalPage"));
const TradingPage = lazy(() => import("./pages/farmer/TradingPage"));
const QualityGradingPage = lazy(() => import("./pages/farmer/QualityGradingPage"));

// Lazy loaded Veterinary Pages
const VetDashboard = lazy(() => import("./pages/veterinary/VetDashboard"));
const VetProfileSetup = lazy(() => import("./pages/veterinary/VetProfileSetup"));
const ConsultationsPage = lazy(() => import("./pages/veterinary/ConsultationsPage"));
const ChatPage = lazy(() => import("./pages/veterinary/ChatPage"));
const DoctorMapPage = lazy(() => import("./pages/veterinary/DoctorMapPage"));

// Lazy loaded Consumer Pages
const MarketplacePage = lazy(() => import("./pages/consumer/MarketplacePage"));
const CheckoutPage = lazy(() => import("./pages/consumer/CheckoutPage"));
const OrdersPage = lazy(() => import("./pages/consumer/OrdersPage"));

// Lazy loaded Retailer Pages
const RetailerDashboard = lazy(() => import("./pages/retailer/RetailerDashboard"));
const BulkOrdersPage = lazy(() => import("./pages/retailer/BulkOrdersPage"));
const PartnershipsPage = lazy(() => import("./pages/retailer/PartnershipsPage"));
const InventoryPage = lazy(() => import("./pages/retailer/InventoryPage"));

// Lazy loaded Delivery Pages
const DeliveryDashboard = lazy(() => import("./pages/delivery/DeliveryDashboard"));
const ActiveOrdersPage = lazy(() => import("./pages/delivery/ActiveOrdersPage"));

// Lazy loaded Admin Pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const VetVerification = lazy(() => import("./pages/admin/VetVerification"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const AnalyticsDashboard = lazy(() => import("./pages/admin/AnalyticsDashboard"));

// Lazy loaded Shared Pages
const OrderTrackingPage = lazy(() => import("./pages/shared/OrderTrackingPage"));
const ProfilePage = lazy(() => import("./pages/shared/ProfilePage"));
const SettingsPage = lazy(() => import("./pages/shared/SettingsPage"));
const InvoicePage = lazy(() => import("./pages/shared/InvoicePage"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <OfflineIndicator />
          <InstallPrompt />
          <UpdatePrompt />
          <SyncIndicator />
          <AutoTranslator />
          <NativeTutorial />
          <BrowserRouter>
          <Routes>
{/* Public Routes */}
            <Route path="/" element={
              (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.())
                ? <Navigate to="/login" replace />
                : <LandingPage />
            } />
            <Route path="/hackathon" element={<HackathonPresentation />} />
            <Route path="/install" element={<InstallPage />} />
            <Route path="/login" element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            } />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/verify-otp" element={<VerifyOtpPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="/farmer" element={
              <ProtectedRoute allowedRoles={['farmer']}>
                <Suspense fallback={<PageLoader />}>
                  <FarmerDashboard />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/farmer/map" element={
              <ProtectedRoute allowedRoles={['farmer']}>
                <Suspense fallback={<PageLoader />}>
                  <FarmMapPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/farmer/weather" element={
              <ProtectedRoute allowedRoles={['farmer']}>
                <Suspense fallback={<PageLoader />}>
                  <WeatherCropsPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/farmer/disease" element={
              <ProtectedRoute allowedRoles={['farmer']}>
                <Suspense fallback={<PageLoader />}>
                  <DiseasePage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/farmer/products" element={
              <ProtectedRoute allowedRoles={['farmer']}>
                <Suspense fallback={<PageLoader />}>
                  <ProductsPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/farmer/orders" element={
              <ProtectedRoute allowedRoles={['farmer']}>
                <Suspense fallback={<PageLoader />}>
                  <FarmerOrdersPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/farmer/schemes" element={
              <ProtectedRoute allowedRoles={['farmer']}>
                <Suspense fallback={<PageLoader />}>
                  <SchemesPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/farmer/equipment" element={
              <ProtectedRoute allowedRoles={['farmer']}>
                <Suspense fallback={<PageLoader />}>
                  <EquipmentRentalPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/farmer/trading" element={
              <ProtectedRoute allowedRoles={['farmer']}>
                <Suspense fallback={<PageLoader />}>
                  <TradingPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/farmer/quality" element={
              <ProtectedRoute allowedRoles={['farmer']}>
                <Suspense fallback={<PageLoader />}>
                  <QualityGradingPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/farmer/dashboard" element={<Navigate to="/farmer" replace />} />
            <Route path="/farmer/market" element={<Navigate to="/farmer/trading" replace />} />
            <Route path="/farmer/marketplace" element={<Navigate to="/farmer/trading" replace />} />
            <Route path="/farmer/*" element={<Navigate to="/farmer" replace />} />

            {/* Veterinary Routes */}
            <Route path="/veterinary" element={
              <ProtectedRoute allowedRoles={['veterinary']}>
                <Suspense fallback={<PageLoader />}>
                  <VetDashboard />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/veterinary/settings" element={
              <ProtectedRoute allowedRoles={['veterinary']}>
                <Suspense fallback={<PageLoader />}>
                  <VetProfileSetup />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/veterinary/consultations" element={
              <ProtectedRoute allowedRoles={['veterinary']}>
                <Suspense fallback={<PageLoader />}>
                  <ConsultationsPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/veterinary/chat" element={
              <ProtectedRoute allowedRoles={['veterinary']}>
                <Suspense fallback={<PageLoader />}>
                  <ChatPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/veterinary/map" element={
              <ProtectedRoute allowedRoles={['veterinary', 'farmer']}>
                <Suspense fallback={<PageLoader />}>
                  <DoctorMapPage />
                </Suspense>
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Suspense fallback={<PageLoader />}>
                  <AdminDashboard />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Suspense fallback={<PageLoader />}>
                  <UserManagement />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/admin/vets" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Suspense fallback={<PageLoader />}>
                  <VetVerification />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/admin/analytics" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Suspense fallback={<PageLoader />}>
                  <AnalyticsDashboard />
                </Suspense>
              </ProtectedRoute>
            } />

            {/* Consumer Routes */}
            <Route path="/marketplace" element={
              <ProtectedRoute allowedRoles={['consumer']}>
                <Suspense fallback={<PageLoader />}>
                  <MarketplacePage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/marketplace/checkout" element={
              <ProtectedRoute allowedRoles={['consumer']}>
                <Suspense fallback={<PageLoader />}>
                  <CheckoutPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/marketplace/orders" element={
              <ProtectedRoute allowedRoles={['consumer']}>
                <Suspense fallback={<PageLoader />}>
                  <OrdersPage />
                </Suspense>
              </ProtectedRoute>
            } />

            {/* Order Tracking - accessible by multiple roles */}
            <Route path="/track/:orderId" element={
              <ProtectedRoute allowedRoles={['consumer', 'farmer', 'delivery', 'retailer']}>
                <Suspense fallback={<PageLoader />}>
                  <OrderTrackingPage />
                </Suspense>
              </ProtectedRoute>
            } />

            {/* Retailer Routes */}
            <Route path="/retailer" element={
              <ProtectedRoute allowedRoles={['retailer']}>
                <Suspense fallback={<PageLoader />}>
                  <RetailerDashboard />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/retailer/orders" element={
              <ProtectedRoute allowedRoles={['retailer']}>
                <Suspense fallback={<PageLoader />}>
                  <BulkOrdersPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/retailer/inventory" element={
              <ProtectedRoute allowedRoles={['retailer']}>
                <Suspense fallback={<PageLoader />}>
                  <InventoryPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/retailer/partnerships" element={
              <ProtectedRoute allowedRoles={['retailer']}>
                <Suspense fallback={<PageLoader />}>
                  <PartnershipsPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/delivery" element={
              <ProtectedRoute allowedRoles={['delivery']}>
                <Suspense fallback={<PageLoader />}>
                  <DeliveryDashboard />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/delivery/orders" element={
              <ProtectedRoute allowedRoles={['delivery']}>
                <Suspense fallback={<PageLoader />}>
                  <ActiveOrdersPage />
                </Suspense>
              </ProtectedRoute>
            } />

            {/* 404 */}
            {/* Shared account routes (any authenticated role) */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}><ProfilePage /></Suspense>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>
              </ProtectedRoute>
            } />
            {/* Role-prefixed aliases so links like /farmer/settings, /consumer/profile work */}
            <Route path="/farmer/profile" element={<ProtectedRoute allowedRoles={['farmer']}><Suspense fallback={<PageLoader />}><ProfilePage /></Suspense></ProtectedRoute>} />
            <Route path="/farmer/settings" element={<ProtectedRoute allowedRoles={['farmer']}><Suspense fallback={<PageLoader />}><SettingsPage /></Suspense></ProtectedRoute>} />
            <Route path="/consumer/profile" element={<ProtectedRoute allowedRoles={['consumer']}><Suspense fallback={<PageLoader />}><ProfilePage /></Suspense></ProtectedRoute>} />
            <Route path="/consumer/settings" element={<ProtectedRoute allowedRoles={['consumer']}><Suspense fallback={<PageLoader />}><SettingsPage /></Suspense></ProtectedRoute>} />
            <Route path="/retailer/profile" element={<ProtectedRoute allowedRoles={['retailer']}><Suspense fallback={<PageLoader />}><ProfilePage /></Suspense></ProtectedRoute>} />
            <Route path="/retailer/settings" element={<ProtectedRoute allowedRoles={['retailer']}><Suspense fallback={<PageLoader />}><SettingsPage /></Suspense></ProtectedRoute>} />
            <Route path="/delivery/profile" element={<ProtectedRoute allowedRoles={['delivery']}><Suspense fallback={<PageLoader />}><ProfilePage /></Suspense></ProtectedRoute>} />
            <Route path="/delivery/settings" element={<ProtectedRoute allowedRoles={['delivery']}><Suspense fallback={<PageLoader />}><SettingsPage /></Suspense></ProtectedRoute>} />
            <Route path="/admin/profile" element={<ProtectedRoute allowedRoles={['admin']}><Suspense fallback={<PageLoader />}><ProfilePage /></Suspense></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><Suspense fallback={<PageLoader />}><SettingsPage /></Suspense></ProtectedRoute>} />
            <Route path="/veterinary/profile" element={<ProtectedRoute allowedRoles={['veterinary']}><Suspense fallback={<PageLoader />}><ProfilePage /></Suspense></ProtectedRoute>} />

            <Route path="/invoice/:orderId" element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}><InvoicePage /></Suspense>
              </ProtectedRoute>
            } />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
