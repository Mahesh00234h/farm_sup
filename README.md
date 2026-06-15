# 🌱 Farmaline

**AI-Powered Agricultural Ecosystem**

A complete agricultural ecosystem connecting **Farmers**, **Consumers**, **Veterinarians**, **Retailers**, and **Delivery Partners** — all powered by **Google Gemini AI**.

🔗 **Live Demo**: [farmaline.works](https://seed-to-sip-ai.lovable.app)  
📊 **Hackathon Presentation**: [/hackathon](https://seed-to-sip-ai.lovable.app/hackathon)

---

---

## 🧠 AI Integration (25% of Judging)

### 9 Gemini-Powered Features

| Feature | Model | Description | Highlight |
|---------|-------|-------------|-----------|
| 🔬 **Disease Detection** | Gemini 2.5 Flash (Vision) | Multi-modal image analysis for plant disease diagnosis with severity scoring, organic & chemical treatments | Vision AI |
| 🌾 **Crop Recommendations** | Gemini 3 Flash | Analyzes GPS, weather, soil & season to recommend optimal crops with yield predictions | Location-Aware |
| 🔍 **AI-Powered Search** | Gemini 3 Flash | Natural language search in English, Hindi & Hinglish with intent understanding | Multilingual NLP |
| 🐄 **Vet Consultation AI** | Gemini 3 Flash | Pre-consultation summaries analyzing symptoms & history with urgency levels | Medical AI |
| 📦 **Inventory Forecasting** | Gemini 3 Flash | Stock predictions, restock alerts & pricing recommendations for retailers | Predictive Analytics |
| 📊 **Market Insights** | Gemini 3 Flash | Localized pricing strategies & profitability analysis for farmers | Market Intelligence |
| ✅ **Quality Analysis** | Gemini 2.5 Flash (Vision) | Vision-based product quality verification from uploaded images | Vision AI |
| 📋 **Scheme Explanation** | Gemini 3 Flash | Simplifies government schemes into actionable steps for rural users | Document AI |
| 🤖 **General AI Assistant** | Gemini 3 Flash (Streaming) | Role-aware floating chatbot with real-time streaming responses | Streaming Chat |

> 💡 **Deep Gemini Integration**: All AI features use structured JSON outputs, vision capabilities for image analysis, and real-time streaming for chat — **NOT just basic chatbots or summaries**.

---

## 🖥️ Frontend Experience (5% of Judging)

### Rich UI Components
- ✅ Framer Motion animations throughout
- ✅ Interactive Leaflet maps with polylines
- ✅ Real-time data with TanStack Query
- ✅ Shadcn/UI component library
- ✅ Dark/Light theme support
- ✅ Mobile-first responsive design

### Interactive Features
- ✅ Farm boundary drawing with GPS
- ✅ Camera integration for disease detection
- ✅ Turn-by-turn navigation for delivery
- ✅ Real-time order tracking on maps
- ✅ Streaming AI chat responses
- ✅ Digital signature for proof of delivery

### Quick Stats
| Feature | Details |
|---------|---------|
| 🌐 Languages | 4 (EN, HI, MR, TE) |
| 🗺️ Live Maps | Leaflet + OpenRoute |
| 📷 Vision AI | Image Upload |
| 💬 Streaming | Real-time Chat |

---

## 🚀 Practicality (30% of Judging)

### Backend Infrastructure
- ✅ PostgreSQL with RLS policies
- ✅ Supabase Realtime for live tracking
- ✅ 12+ Edge Functions
- ✅ Secure file storage (certificates)
- ✅ Role-based access control

### Offline-First PWA
- ✅ IndexedDB with Dexie.js
- ✅ Service Worker caching
- ✅ Offline data persistence
- ✅ Auto-sync when online
- ✅ Installable on mobile

### Real-World Features
- ✅ Web Push Notifications (VAPID)
- ✅ Live GPS tracking
- ✅ Turn-by-turn navigation
- ✅ Multi-language (i18n)
- ✅ Proof of delivery with signature

### Why This Is Production-Ready

| Aspect | Details |
|--------|---------|
| 🌐 **Works in Rural India** | Offline-first architecture ensures farmers can use the app even with poor connectivity |
| 🔒 **Enterprise Security** | Row-Level Security policies ensure data isolation between users |
| 📱 **Mobile-Optimized** | 52px touch targets, mobile-stack layouts, installable PWA |
| ⚡ **Scalable Backend** | Serverless Edge Functions auto-scale with traffic |

---

## 💡 Innovation (40% of Judging)

> Farmaline goes **far beyond basic AI chatbots** by creating an interconnected ecosystem where AI drives **real-world agricultural decisions**.

### Innovative AI Applications

| Innovation | Description |
|------------|-------------|
| 🔬 **Vision-Based Disease Detection → Vet Escalation** | AI detects plant disease from photos, and if confidence is low, automatically escalates to a real veterinarian with pre-filled consultation data |
| 📍 **GPS + Weather + AI = Smart Farming** | Combines real GPS coordinates with live weather API and soil data to generate personalized crop recommendations |
| 🗺️ **AI-Powered Farm Mapping** | Draw farm boundaries on interactive maps, auto-calculate acreage, and get location-specific recommendations |

### Ecosystem Innovation

| Feature | Description |
|---------|-------------|
| 🔄 **Complete Supply Chain** | From farm → marketplace → delivery → consumer, with AI optimizing each step |
| 🚚 **Real-Time Delivery Tracking** | Live GPS tracking with turn-by-turn navigation using OpenRouteService, not just static updates |
| 📊 **AI for Every Role** | Each user type (farmer, consumer, vet, retailer, delivery) has role-specific AI features |

### Innovation Highlights

| Capability | Details |
|------------|---------|
| Multi-Modal AI | Text + Images |
| Multilingual NLP | EN/HI/Hinglish |
| Predictive AI | Inventory & Crops |
| Streaming Chat | Real-time Tokens |

---

## 🆕 Phase 2 Additions

The platform was extended with five major capability upgrades focused on **hands-free interaction**, **peer-to-peer commerce**, **vision-based quality assurance**, **logistics intelligence**, and **hardened security**.

### 🎤 1. Voice Input (Web Speech API)
| Aspect | Implementation |
|--------|----------------|
| **API** | `window.SpeechRecognition` / `webkitSpeechRecognition` |
| **Location** | `Mic` toggle button inside `AIAssistant.tsx` floating chat |
| **Language** | `lang = en-IN` (Indian English accent tuned) |
| **Behavior** | Live transcription → auto-submits to AI agent on final result |
| **Fallback** | Gracefully hidden if browser does not support the API |
| **Use Case** | Farmers with low literacy can speak commands like *"List 50 kg organic tomatoes at ₹40/kg"* |

### 🚜 2. Equipment Rental Marketplace
| Aspect | Implementation |
|--------|----------------|
| **Route** | `/farmer/equipment` → `EquipmentRentalPage.tsx` |
| **Tables** | `equipment_rentals` (listings) + `equipment_bookings` (date-range reservations) |
| **Categories** | Tractor, Harvester, Plough, Sprayer, Irrigation, Other |
| **Pricing** | Daily rate × number of days = `total_cost` (auto-computed) |
| **Flow** | Owner lists equipment → other farmers search/filter → book with start/end dates |
| **RLS** | Owners manage their own listings; renters can only see/insert their own bookings |
| **UI** | Search bar, category `Select`, animated cards (Framer Motion), dual `Dialog` modals for list/book |

### ✅ 3. AI Quality Grading (Vision)
| Aspect | Implementation |
|--------|----------------|
| **Route** | `/farmer/quality` → `QualityGradingPage.tsx` |
| **Edge Function** | `quality-analysis` |
| **Model** | Google Gemini 2.5 Flash (Vision) via Lovable AI Gateway |
| **Input** | Base64 image (camera capture supported via `capture="environment"`) |
| **Output (JSON)** | `qualityScore`, `grade (A+/A/B/C)`, `freshness`, `appearance`, `defects[]`, `strengths[]`, `improvements[]`, `marketablePricing`, `verificationBadge`, `summary` |
| **Business Value** | Farmers get an instant **verified quality badge** + suggested market price before listing produce |
| **Error Handling** | Maps `429` (rate limit) and `402` (credits) to friendly toasts |

### 🔄 4. Farmer-to-Farmer Direct Trading
| Aspect | Implementation |
|--------|----------------|
| **Route** | `/farmer/trading` → `TradingPage.tsx` |
| **Table** | `farmer_trades` (with **Supabase Realtime** enabled) |
| **Tabs** | *Marketplace* (open trades from other farmers) / *My Trades* (owned listings) |
| **Flow** | Seller creates trade (product, qty, unit, price/unit → auto `total_price`) → other farmers click **Accept Trade** → `buyer_id` set + status `accepted` |
| **Statuses** | `open` → `accepted` → `completed` / `cancelled` |
| **Why It Matters** | Cuts out middlemen — farmers trade seeds, surplus produce, or inputs directly |

### 🗺️ 5. Multi-Stop Route Optimization
| Aspect | Implementation |
|--------|----------------|
| **Location** | `ActiveOrdersPage.tsx` (delivery dashboard) |
| **Algorithm** | **Nearest-Neighbor** heuristic over `RoutePoint[]` from current driver GPS |
| **Trigger** | "Optimize Route" button appears when driver has **2+ active orders** and known location |
| **Result** | Reorders pending stops to minimize total drive distance; map polyline + `TurnByTurnDirections` re-render automatically |
| **Pairs With** | OpenRouteService routing + Supabase Realtime GPS broadcast |

---

## 🔒 Security Hardening (Phase 2)

A full security scan was run and **all 7 findings were resolved**:

| Issue | Fix |
|-------|-----|
| **Privilege escalation via self-registration** | Added `ALLOWED_ROLES` whitelist in `auth-register` Edge Function — `admin` role can never be self-assigned |
| **Spoofable AI agent identity** | `ai-agent` no longer trusts `userId` from request body. It now derives identity server-side via `supabaseAuth.auth.getClaims(token)` from the JWT |
| **Client passing user IDs** | `useAIAgent.ts` now sends the session `access_token` as a `Bearer` header instead of a body field |
| **`user_roles` admin insert** | New RLS policy: `WITH CHECK (auth.uid() = user_id AND role <> 'admin')` |
| **Delivery partner order tampering** | `orders` UPDATE policy now restricts delivery partners to only their **assigned** orders via `WITH CHECK` |
| **Leaked-password reuse** | Enabled **HIBP (Have I Been Pwned)** leaked-password protection in Supabase Auth |
| **Edge function CORS / auth checks** | All Phase 2 functions validate `Authorization: Bearer ...` before processing |

---

## 📋 Complete Feature List

### 👨‍🌾 Farmer Features
- Farm boundary mapping (GPS)
- Disease detection (AI Vision)
- Crop recommendations (AI)
- Weather integration
- Product listing & sales
- Order management
- Government schemes (AI)
- Vet booking

### 🛒 Consumer Features
- AI-powered marketplace search
- Multi-language support
- Cart & checkout
- Real-time order tracking
- Quality analysis (AI Vision)
- Push notifications
- Product recommendations (AI)

### 👨‍⚕️ Veterinarian Features
- Profile & verification
- Consultation management
- AI pre-consultation summaries
- Chat with farmers
- Video call support
- Disease history access
- Nearby doctor map

### 🏪 Retailer Features
- Inventory management
- AI stock forecasting
- Bulk ordering
- Partnership management
- Pricing recommendations (AI)
- Demand predictions (AI)

### 🚚 Delivery Features
- Order acceptance
- Turn-by-turn navigation
- Real-time GPS tracking
- Proof of delivery (signature)
- Earnings dashboard
- Route optimization
- **🆕 Multi-stop nearest-neighbor route optimization** (auto-reorders stops to minimize distance)

### 👨‍🌾 Farmer Phase 2 Additions
- **🆕 Equipment Rental Marketplace** — list/book farm machinery (`/farmer/equipment`)
- **🆕 AI Quality Grading** — Gemini Vision produce scoring with verified badge (`/farmer/quality`)
- **🆕 Farmer-to-Farmer Direct Trading** — realtime P2P trade marketplace (`/farmer/trading`)
- **🆕 Voice input** in AI Assistant — hands-free commands via Web Speech API (en-IN)

### 🛡️ Admin Features
- User management
- Vet verification
- Analytics dashboard
- Platform health monitoring
- Role-based access control

---

## 🛠️ Tech Stack

### Frontend
- React 19
- TypeScript
- Tailwind CSS
- Framer Motion
- Shadcn/UI

### Backend
- Supabase
- PostgreSQL
- Edge Functions
- Realtime
- RLS Policies

### Authentication
- Google OAuth 2.0
- Email/Password
- Auto-confirm (demo mode)
- Role-based session management
- JWT with secure cookies

### AI/ML
- Google Gemini
- Vision AI
- Structured Output
- Streaming SSE

### APIs
- OpenRouteService
- OpenWeatherMap
- Web Push (VAPID)
- Geolocation

### PWA
- Service Worker
- IndexedDB (Dexie)
- Offline Sync
- Install Prompt

### Maps
- Leaflet
- React-Leaflet
- Polyline Routes
- Custom Markers

### State Management
- TanStack Query
- React Context
- React Hook Form
- Zod Validation

### Internationalization
- i18next
- 4 Languages
- Language Detection
- RTL Support Ready

---

## 🔧 Technical Implementation Details

### 🗺️ Farm Area Calculation
| Aspect | Implementation |
|--------|----------------|
| **Library** | Leaflet with React-Leaflet bindings |
| **Drawing** | `leaflet-draw` plugin for polygon creation |
| **Algorithm** | Shoelace formula (Gauss's area formula) for polygon area |
| **GPS** | Browser Geolocation API for auto-centering |
| **Unit Conversion** | Square meters → Acres (÷ 4046.86) |
| **Storage** | Coordinates stored as JSON array in PostgreSQL |

```
Area = ½ |Σ(xᵢyᵢ₊₁ - xᵢ₊₁yᵢ)|
```

### 🚚 Route & Navigation Calculation
| Aspect | Implementation |
|--------|----------------|
| **Routing API** | OpenRouteService (driving-car profile) |
| **Edge Function** | `get-route-directions` proxies API calls securely |
| **Distance** | Road-accurate distance from ORS response |
| **ETA** | `distance / average_speed` (configurable km/h) |
| **Polylines** | Decoded from ORS geometry, rendered on Leaflet |
| **Turn-by-turn** | Instruction steps from ORS `steps` array |

### 📍 Real-Time Location Tracking
| Aspect | Implementation |
|--------|----------------|
| **GPS Updates** | `navigator.geolocation.watchPosition()` |
| **Realtime Sync** | Supabase Realtime (PostgreSQL LISTEN/NOTIFY) |
| **Table** | `delivery_locations` with lat/lng/heading/speed |
| **Update Frequency** | Every 5 seconds during active delivery |
| **Map Markers** | Custom pulsating CSS animation markers |

### 🌤️ Weather Integration
| Aspect | Implementation |
|--------|----------------|
| **API** | OpenWeatherMap API (Current Weather + Forecast) |
| **Edge Function** | `weather` function proxies calls with API key |
| **Location** | GPS coordinates from farm or browser |
| **Caching** | TanStack Query with 10-minute stale time |
| **Data Used** | Temperature, humidity, conditions for crop AI |

### 🔬 Disease Detection (Vision AI)
| Aspect | Implementation |
|--------|----------------|
| **Model** | Google Gemini 2.5 Flash with Vision |
| **Input** | Base64-encoded image from camera/upload |
| **Output** | Structured JSON with disease, severity, treatments |
| **Confidence** | Score 0-100, auto-escalates to vet if <70% |
| **Edge Function** | `disease-detection` handles image processing |

### 🌾 Crop Recommendation AI
| Aspect | Implementation |
|--------|----------------|
| **Model** | Google Gemini 3 Flash |
| **Inputs** | GPS location, weather data, soil type, season |
| **Output** | Top 3 crops with yield predictions, costs, risks |
| **Edge Function** | `crop-recommendation` combines all data sources |
| **Context** | Uses farm coordinates for localized advice |

### 🔍 AI-Powered Search
| Aspect | Implementation |
|--------|----------------|
| **Model** | Google Gemini 3 Flash |
| **Languages** | English, Hindi, Hinglish (code-mixed) |
| **Method** | Products sent to AI with query for semantic matching |
| **Output** | Ranked product IDs + search intent + suggestions |
| **Edge Function** | `ai-search` returns structured JSON |

### 💬 Streaming AI Chat
| Aspect | Implementation |
|--------|----------------|
| **Model** | Google Gemini 3 Flash |
| **Protocol** | Server-Sent Events (SSE) |
| **Streaming** | Token-by-token response rendering |
| **Context** | Role-aware (farmer/consumer/vet prompts differ) |
| **History** | Last 10 messages sent for conversation context |

### 📱 Offline-First PWA
| Aspect | Implementation |
|--------|----------------|
| **Service Worker** | Workbox via vite-plugin-pwa |
| **Local DB** | IndexedDB with Dexie.js ORM |
| **Cached Data** | Farms, weather, products, notifications |
| **Sync Strategy** | Queue mutations offline, replay when online |
| **Install** | Web App Manifest with icons (192px, 512px) |

### 🔔 Push Notifications
| Aspect | Implementation |
|--------|----------------|
| **Protocol** | Web Push API with VAPID keys |
| **Storage** | `push_subscriptions` table in PostgreSQL |
| **Edge Function** | `send-push-notification` triggers notifications |
| **Events** | Order updates, vet responses, weather alerts |

### 🔒 Authentication & Security
| Aspect | Implementation |
|--------|----------------|
| **Auth Provider** | Supabase Auth (email + password) |
| **Sessions** | JWT tokens with refresh rotation |
| **RLS Policies** | Row-Level Security on all tables |
| **Role System** | `user_roles` table with enum (6 roles) |
| **Vet Verification** | Admin approval + certificate upload required |

### 🗄️ Database Schema (Key Tables)
| Table | Purpose |
|-------|---------|
| `profiles` | User profile data linked to auth.users |
| `user_roles` | Role assignments (farmer/consumer/vet/etc) |
| `farms` | Farm boundaries, area, soil type |
| `products` | Marketplace listings from farmers |
| `orders` | Order management with status tracking |
| `delivery_locations` | Real-time GPS coordinates |
| `disease_detections` | AI analysis results with escalation status |
| `consultations` | Vet-farmer consultation sessions |
| `chat_messages` | Real-time chat for consultations |
| `vet_profiles` | Veterinarian credentials & availability |
| `notifications` | In-app notification storage |
| `push_subscriptions` | Web Push subscription endpoints |

---

## 🎮 Demo Paths

| Role | Path | Demo Features |
|------|------|---------------|
| Farmer | `/farmer` | Disease Detection, Crop AI |
| Consumer | `/marketplace` | AI Search, Quality Check |
| Veterinarian | `/veterinary` | Consultation AI |
| Retailer | `/retailer` | Inventory Forecasting |
| Delivery | `/delivery` | Navigation, Tracking |
| Admin | `/admin` | Platform Overview |

---

## 🚀 Getting Started

### Prerequisites
- Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Installation

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd <YOUR_PROJECT_NAME>

# Step 3: Install dependencies
npm i

# Step 4: Start the development server
npm run dev
```

---

## 📱 PWA Installation

Farmaline is a Progressive Web App that can be installed on any device:

1. Visit the app in your browser
2. Click the "Install" prompt or use browser menu
3. The app will be added to your home screen
4. Works offline with auto-sync when online

---

## 🔒 Security Features

- **Row-Level Security (RLS)**: Database policies ensure users only access their own data
- **Role-Based Access Control**: 6 distinct user roles with appropriate permissions
- **Secure Authentication**: Supabase Auth with email verification
- **HTTPS Only**: All communications encrypted
- **Vet Verification**: Admin approval required for veterinary professionals

---

## 🌍 Supported Languages

| Language | Code |
|----------|------|
| English | EN |
| Hindi | HI |
| Marathi | MR |
| Telugu | TE |

---

## 📄 License

This project was built for hackathon demonstration purposes.

---

## 🙏 Acknowledgments

- **Google Gemini** - AI/ML capabilities
- **Supabase** - Backend infrastructure
- **OpenRouteService** - Navigation & routing
- **OpenWeatherMap** - Weather data
- **Shadcn/UI** - Component library
- **Lovable** - Development platform

---

<p align="center">
  <strong>🌱 Farmaline - From Seed to Consumer, Powered by AI 🌱</strong>
</p>
#   f a r m _ s u p  
 