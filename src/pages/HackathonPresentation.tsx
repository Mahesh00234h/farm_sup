import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Sparkles, 
  Monitor, 
  Rocket, 
  Lightbulb,
  ChevronRight,
  ChevronLeft,
  Leaf,
  Stethoscope,
  ShoppingCart,
  Truck,
  Store,
  Shield,
  Globe,
  Wifi,
  WifiOff,
  Camera,
  Map,
  MessageSquare,
  TrendingUp,
  FileText,
  Search,
  Bell,
  Navigation,
  Users,
  Database,
  Zap,
  CheckCircle2,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const slides = [
  {
    id: 'intro',
    title: 'Farmaline',
    subtitle: 'AI-Powered Agricultural Ecosystem',
    content: (
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-primary/10 text-primary">
            <Leaf className="h-8 w-8" />
            <span className="text-2xl font-bold">Farmaline</span>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A complete agricultural ecosystem connecting <strong>Farmers</strong>, <strong>Consumers</strong>, <strong>Veterinarians</strong>, <strong>Retailers</strong>, and <strong>Delivery Partners</strong> — all powered by <span className="text-primary font-semibold">Google Gemini AI</span>.
          </p>
        </div>
        
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 max-w-4xl mx-auto">
          {[
            { icon: Leaf, label: 'Farmers', color: 'text-green-500' },
            { icon: ShoppingCart, label: 'Consumers', color: 'text-blue-500' },
            { icon: Stethoscope, label: 'Veterinarians', color: 'text-purple-500' },
            { icon: Store, label: 'Retailers', color: 'text-orange-500' },
            { icon: Truck, label: 'Delivery', color: 'text-red-500' },
            { icon: Shield, label: 'Admins', color: 'text-slate-500' },
          ].map((role, i) => (
            <motion.div
              key={role.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50"
            >
              <role.icon className={cn("h-8 w-8", role.color)} />
              <span className="text-sm font-medium">{role.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    )
  },
  {
    id: 'ai-integration',
    title: 'AI Integration',
    subtitle: '25% of Judging Criteria',
    badge: { text: '9 Gemini-Powered Features', variant: 'default' as const },
    content: (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              title: '🔬 Disease Detection',
              model: 'Gemini 2.5 Flash (Vision)',
              description: 'Multi-modal image analysis for plant disease diagnosis with severity scoring, organic & chemical treatments',
              highlight: 'Vision AI'
            },
            {
              title: '🌾 Crop Recommendations',
              model: 'Gemini 3 Flash',
              description: 'Analyzes GPS, weather, soil & season to recommend optimal crops with yield predictions',
              highlight: 'Location-Aware'
            },
            {
              title: '🔍 AI-Powered Search',
              model: 'Gemini 3 Flash',
              description: 'Natural language search in English, Hindi & Hinglish with intent understanding',
              highlight: 'Multilingual NLP'
            },
            {
              title: '🐄 Vet Consultation AI',
              model: 'Gemini 3 Flash',
              description: 'Pre-consultation summaries analyzing symptoms & history with urgency levels',
              highlight: 'Medical AI'
            },
            {
              title: '📦 Inventory Forecasting',
              model: 'Gemini 3 Flash',
              description: 'Stock predictions, restock alerts & pricing recommendations for retailers',
              highlight: 'Predictive Analytics'
            },
            {
              title: '📊 Market Insights',
              model: 'Gemini 3 Flash',
              description: 'Localized pricing strategies & profitability analysis for farmers',
              highlight: 'Market Intelligence'
            },
            {
              title: '✅ Quality Analysis',
              model: 'Gemini 2.5 Flash (Vision)',
              description: 'Vision-based product quality verification from uploaded images',
              highlight: 'Vision AI'
            },
            {
              title: '📋 Scheme Explanation',
              model: 'Gemini 3 Flash',
              description: 'Simplifies government schemes into actionable steps for rural users',
              highlight: 'Document AI'
            },
            {
              title: '🤖 General AI Assistant',
              model: 'Gemini 3 Flash (Streaming)',
              description: 'Role-aware floating chatbot with real-time streaming responses',
              highlight: 'Streaming Chat'
            },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{feature.title}</CardTitle>
                    <Badge variant="outline" className="text-xs">{feature.highlight}</Badge>
                  </div>
                  <p className="text-xs text-primary font-mono">{feature.model}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 flex items-center gap-4">
          <Brain className="h-10 w-10 text-primary shrink-0" />
          <div>
            <p className="font-semibold">Deep Gemini Integration</p>
            <p className="text-sm text-muted-foreground">
              All AI features use structured JSON outputs, vision capabilities for image analysis, and real-time streaming for chat — <strong>NOT just basic chatbots or summaries</strong>.
            </p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'frontend',
    title: 'Frontend Experience',
    subtitle: '5% of Judging Criteria',
    content: (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-primary" />
                Rich UI Components
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                'Framer Motion animations throughout',
                'Interactive Leaflet maps with polylines',
                'Real-time data with TanStack Query',
                'Shadcn/UI component library',
                'Dark/Light theme support',
                'Mobile-first responsive design'
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Interactive Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                'Farm boundary drawing with GPS',
                'Camera integration for disease detection',
                'Turn-by-turn navigation for delivery',
                'Real-time order tracking on maps',
                'Streaming AI chat responses',
                'Digital signature for proof of delivery'
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Globe, label: '4 Languages', desc: 'EN, HI, MR, TE' },
            { icon: Map, label: 'Live Maps', desc: 'Leaflet + OpenRoute' },
            { icon: Camera, label: 'Vision AI', desc: 'Image Upload' },
            { icon: MessageSquare, label: 'Streaming', desc: 'Real-time Chat' },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="text-center p-4 rounded-xl bg-muted/50"
            >
              <item.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="font-semibold">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    )
  },
  {
    id: 'practicality',
    title: 'Practicality',
    subtitle: '30% of Judging Criteria',
    badge: { text: 'Production-Ready', variant: 'default' as const },
    content: (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-green-500/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <Database className="h-5 w-5" />
                Backend Infrastructure
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> PostgreSQL with RLS policies</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Supabase Realtime for live tracking</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> 12+ Edge Functions</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Secure file storage (certificates)</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Role-based access control</div>
            </CardContent>
          </Card>
          
          <Card className="border-blue-500/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <WifiOff className="h-5 w-5" />
                Offline-First PWA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> IndexedDB with Dexie.js</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Service Worker caching</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Offline data persistence</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Auto-sync when online</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Installable on mobile</div>
            </CardContent>
          </Card>
          
          <Card className="border-purple-500/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-600">
                <Bell className="h-5 w-5" />
                Real-World Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Web Push Notifications (VAPID)</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Live GPS tracking</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Turn-by-turn navigation</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Multi-language (i18n)</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Proof of delivery with signature</div>
            </CardContent>
          </Card>
        </div>
        
        <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl p-6">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Why This Is Production-Ready
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">🌐 Works in Rural India</p>
              <p className="text-muted-foreground">Offline-first architecture ensures farmers can use the app even with poor connectivity</p>
            </div>
            <div>
              <p className="font-medium">🔒 Enterprise Security</p>
              <p className="text-muted-foreground">Row-Level Security policies ensure data isolation between users</p>
            </div>
            <div>
              <p className="font-medium">📱 Mobile-Optimized</p>
              <p className="text-muted-foreground">52px touch targets, mobile-stack layouts, installable PWA</p>
            </div>
            <div>
              <p className="font-medium">⚡ Scalable Backend</p>
              <p className="text-muted-foreground">Serverless Edge Functions auto-scale with traffic</p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'innovation',
    title: 'Innovation',
    subtitle: '40% of Judging Criteria',
    badge: { text: 'Beyond Chatbots & Summaries', variant: 'destructive' as const },
    content: (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Farmaline goes <strong>far beyond basic AI chatbots</strong> by creating an interconnected ecosystem where AI drives <span className="text-primary font-semibold">real-world agricultural decisions</span>.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-2 border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                Innovative AI Applications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="font-medium">🔬 Vision-Based Disease Detection → Vet Escalation</p>
                <p className="text-sm text-muted-foreground">AI detects plant disease from photos, and if confidence is low, automatically escalates to a real veterinarian with pre-filled consultation data</p>
              </div>
              <div className="space-y-2">
                <p className="font-medium">📍 GPS + Weather + AI = Smart Farming</p>
                <p className="text-sm text-muted-foreground">Combines real GPS coordinates with live weather API and soil data to generate personalized crop recommendations</p>
              </div>
              <div className="space-y-2">
                <p className="font-medium">🗺️ AI-Powered Farm Mapping</p>
                <p className="text-sm text-muted-foreground">Draw farm boundaries on interactive maps, auto-calculate acreage, and get location-specific recommendations</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-orange-500/50 bg-orange-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-500" />
                Ecosystem Innovation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="font-medium">🔄 Complete Supply Chain</p>
                <p className="text-sm text-muted-foreground">From farm → marketplace → delivery → consumer, with AI optimizing each step</p>
              </div>
              <div className="space-y-2">
                <p className="font-medium">🚚 Real-Time Delivery Tracking</p>
                <p className="text-sm text-muted-foreground">Live GPS tracking with turn-by-turn navigation using OpenRouteService, not just static updates</p>
              </div>
              <div className="space-y-2">
                <p className="font-medium">📊 AI for Every Role</p>
                <p className="text-sm text-muted-foreground">Each user type (farmer, consumer, vet, retailer, delivery) has role-specific AI features</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[
            { title: 'Multi-Modal AI', desc: 'Text + Images', icon: Eye },
            { title: 'Multilingual NLP', desc: 'EN/HI/Hinglish', icon: Globe },
            { title: 'Predictive AI', desc: 'Inventory & Crops', icon: TrendingUp },
            { title: 'Streaming Chat', desc: 'Real-time Tokens', icon: Zap },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="text-center p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20"
            >
              <item.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="font-semibold text-sm">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    )
  },
  {
    id: 'features',
    title: 'Complete Feature List',
    subtitle: 'All Platform Capabilities',
    content: (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              role: '👨‍🌾 Farmer',
              features: [
                'Farm boundary mapping (GPS)',
                'Disease detection (AI Vision)',
                'Crop recommendations (AI)',
                'Weather integration',
                'Product listing & sales',
                'Order management',
                'Government schemes (AI)',
                'Vet booking'
              ]
            },
            {
              role: '🛒 Consumer',
              features: [
                'AI-powered marketplace search',
                'Multi-language support',
                'Cart & checkout',
                'Real-time order tracking',
                'Quality analysis (AI Vision)',
                'Push notifications',
                'Product recommendations (AI)'
              ]
            },
            {
              role: '👨‍⚕️ Veterinarian',
              features: [
                'Profile & verification',
                'Consultation management',
                'AI pre-consultation summaries',
                'Chat with farmers',
                'Video call support',
                'Disease history access',
                'Nearby doctor map'
              ]
            },
            {
              role: '🏪 Retailer',
              features: [
                'Inventory management',
                'AI stock forecasting',
                'Bulk ordering',
                'Partnership management',
                'Pricing recommendations (AI)',
                'Demand predictions (AI)'
              ]
            },
            {
              role: '🚚 Delivery',
              features: [
                'Order acceptance',
                'Turn-by-turn navigation',
                'Real-time GPS tracking',
                'Proof of delivery (signature)',
                'Earnings dashboard',
                'Route optimization'
              ]
            },
            {
              role: '🛡️ Admin',
              features: [
                'User management',
                'Vet verification',
                'Analytics dashboard',
                'Platform health monitoring',
                'Role-based access control'
              ]
            },
          ].map((roleData, i) => (
            <Card key={roleData.role} className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{roleData.role}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {roleData.features.map((feature, j) => (
                    <li key={j} className="text-sm flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  },
  {
    id: 'tech-stack',
    title: 'Tech Stack',
    subtitle: 'Modern Production Architecture',
    content: (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { category: 'Frontend', items: ['React 19', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'Shadcn/UI'] },
            { category: 'Backend', items: ['Supabase', 'PostgreSQL', 'Edge Functions', 'Realtime', 'RLS Policies'] },
            { category: 'AI/ML', items: ['Google Gemini', 'Vision AI', 'Structured Output', 'Streaming SSE'] },
            { category: 'APIs', items: ['OpenRouteService', 'OpenWeatherMap', 'Web Push (VAPID)', 'Geolocation'] },
          ].map((stack) => (
            <Card key={stack.category}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-primary">{stack.category}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {stack.items.map((item) => (
                    <li key={item} className="text-sm text-muted-foreground">{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { category: 'PWA', items: ['Service Worker', 'IndexedDB (Dexie)', 'Offline Sync', 'Install Prompt'] },
            { category: 'Maps', items: ['Leaflet', 'React-Leaflet', 'Polyline Routes', 'Custom Markers'] },
            { category: 'State', items: ['TanStack Query', 'React Context', 'React Hook Form', 'Zod Validation'] },
            { category: 'i18n', items: ['i18next', '4 Languages', 'Language Detection', 'RTL Support Ready'] },
          ].map((stack) => (
            <Card key={stack.category}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-primary">{stack.category}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {stack.items.map((item) => (
                    <li key={item} className="text-sm text-muted-foreground">{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  },
  {
    id: 'demo',
    title: 'Live Demo',
    subtitle: 'Experience Farmaline',
    content: (
      <div className="text-center space-y-8">
        <div className="inline-block p-8 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30">
          <Sparkles className="h-16 w-16 text-primary mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">Ready for Demo!</h3>
          <p className="text-muted-foreground max-w-md">
            Register as different user types to explore role-specific AI features
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
          {[
            { role: 'Farmer', path: '/farmer', demo: 'Disease Detection, Crop AI' },
            { role: 'Consumer', path: '/marketplace', demo: 'AI Search, Quality Check' },
            { role: 'Veterinarian', path: '/veterinary', demo: 'Consultation AI' },
            { role: 'Retailer', path: '/retailer', demo: 'Inventory Forecasting' },
            { role: 'Delivery', path: '/delivery', demo: 'Navigation, Tracking' },
            { role: 'Admin', path: '/admin', demo: 'Platform Overview' },
          ].map((item) => (
            <div key={item.role} className="p-4 rounded-xl bg-muted/50 text-left">
              <p className="font-semibold">{item.role}</p>
              <p className="text-xs text-muted-foreground">{item.demo}</p>
            </div>
          ))}
        </div>
        
        <div className="flex justify-center gap-4">
          <Button asChild size="lg">
            <a href="/register">Create Demo Account</a>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="/">View Landing Page</a>
          </Button>
        </div>
      </div>
    )
  }
];

export default function HackathonPresentation() {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const goToSlide = (index: number) => {
    if (index >= 0 && index < slides.length) {
      setCurrentSlide(index);
    }
  };
  
  const slide = slides[currentSlide];
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Progress value={((currentSlide + 1) / slides.length) * 100} className="h-1 rounded-none" />
      </div>
      
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur border-b z-40 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="font-bold">Farmaline</span>
            <Badge variant="secondary" className="ml-2">Hackathon</Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{currentSlide + 1} / {slides.length}</span>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 px-4 py-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Slide Header */}
              <div className="text-center space-y-2">
                <h1 className="text-3xl md:text-4xl font-bold">{slide.title}</h1>
                <p className="text-lg text-muted-foreground">{slide.subtitle}</p>
                {slide.badge && (
                  <Badge variant={slide.badge.variant} className="mt-2">
                    {slide.badge.text}
                  </Badge>
                )}
              </div>
              
              {/* Slide Content */}
              <div className="mt-8">
                {slide.content}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      
      {/* Navigation */}
      <footer className="sticky bottom-0 bg-background/95 backdrop-blur border-t px-4 py-4 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => goToSlide(currentSlide - 1)}
            disabled={currentSlide === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          
          <div className="flex gap-1.5 overflow-x-auto px-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => goToSlide(i)}
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all",
                  i === currentSlide ? "bg-primary w-6" : "bg-muted hover:bg-muted-foreground/50"
                )}
              />
            ))}
          </div>
          
          <Button
            onClick={() => goToSlide(currentSlide + 1)}
            disabled={currentSlide === slides.length - 1}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </footer>
    </div>
  );
}
