# 🌱 Farmaline

**AI-Powered Agricultural Ecosystem**

A complete agricultural ecosystem connecting **Farmers**, **Consumers**, **Veterinarians**, **Retailers**, and **Delivery Partners** — all powered by **Google Gemini AI**.

🔗 **[Live Demo](https://seed-to-sip-ai.lovable.app)** | 📊 **[Hackathon Presentation](https://seed-to-sip-ai.lovable.app/hackathon)**

---

## 📋 Table of Contents

- [AI Integration](#-ai-integration)
- [Frontend Experience](#-frontend-experience)
- [Practicality & Backend](#-practicality--backend)
- [Innovation Highlights](#-innovation-highlights)
- [Phase 2 Features](#-phase-2-additions)
- [Security](#-security-hardening)
- [Feature List](#-complete-feature-list)
- [Tech Stack](#-tech-stack)
- [Implementation Details](#-technical-implementation-details)
- [Getting Started](#-getting-started)

---

## 🧠 AI Integration (25% of Judging)

### 9 Gemini-Powered Features

| Feature | Model | Description |
|---------|-------|-------------|
| 🔬 **Disease Detection** | Gemini 2.5 Flash (Vision) | Multi-modal image analysis for plant disease diagnosis with severity scoring |
| 🌾 **Crop Recommendations** | Gemini 3 Flash | GPS, weather, soil & season analysis for optimal crop selection |
| 🔍 **AI-Powered Search** | Gemini 3 Flash | Multilingual NLP (English, Hindi, Hinglish) with intent understanding |
| 🐄 **Vet Consultation AI** | Gemini 3 Flash | Pre-consultation summaries analyzing symptoms with urgency levels |
| 📦 **Inventory Forecasting** | Gemini 3 Flash | Stock predictions & restock alerts for retailers |
| 📊 **Market Insights** | Gemini 3 Flash | Localized pricing strategies for farmers |
| ✅ **Quality Analysis** | Gemini 2.5 Flash (Vision) | Product quality verification from uploaded images |
| 📋 **Scheme Explanation** | Gemini 3 Flash | Simplifies government schemes for rural users |
| 🤖 **AI Assistant** | Gemini 3 Flash (Streaming) | Role-aware floating chatbot with real-time responses |

> 💡 All AI features use **structured JSON outputs**, **vision capabilities** for image analysis, and **real-time streaming** — not just basic chatbots.

---

## 🖥️ Frontend Experience (5% of Judging)

### Rich UI Components
- ✅ Framer Motion animations
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

---

## 🚀 Practicality & Backend (30% of Judging)

### Backend Infrastructure
- ✅ PostgreSQL with RLS policies
- ✅ Supabase Realtime for live tracking
- ✅ 12+ Edge Functions
- ✅ Secure file storage (certificates)
- ✅ Role-based access control (6 roles)

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
- ✅ Multi-language support (4 languages)
- ✅ Proof of delivery with signature

### Why This Is Production-Ready

| Aspect | Details |
|--------|---------|
| 🌐 **Rural India Compatible** | Offline-first architecture for poor connectivity |
| 🔒 **Enterprise Security** | Row-Level Security ensures data isolation |
| 📱 **Mobile-Optimized** | 52px touch targets, mobile-stack layouts |
| ⚡ **Scalable Backend** | Serverless Edge Functions auto-scale |

---

## 💡 Innovation (40% of Judging)

> Farmaline goes **far beyond basic AI chatbots** by creating an interconnected ecosystem where AI drives **real-world agricultural decisions**.

### Innovative AI Applications

| Innovation | Description |
|------------|-------------|
| 🔬 **Disease Detection → Vet Escalation** | AI detects plant disease; low confidence automatically escalates to veterinarian |
| 📍 **GPS + Weather + AI = Smart Farming** | Real GPS + live weather + soil data for personalized recommendations |
| 🗺️ **AI-Powered Farm Mapping** | Draw boundaries, auto-calculate acreage, get location-specific recommendations |

### Complete Supply Chain
- 🔄 Farm → Marketplace → Delivery → Consumer
- 🚚 Real-time GPS tracking with turn-by-turn navigation
- 📊 Role-specific AI features for each user type
- 🔀 Multi-stop route optimization for delivery

---

## 🆕 Phase 2 Additions

Extended with five major capability upgrades:

### 🎤 Voice Input (Web Speech API)

| Aspect | Implementation |
|--------|----------------|
| **API** | `window.SpeechRecognition` (webkitSpeechRecognition fallback) |
| **Location** | Mic toggle inside `AIAssistant.tsx` floating chat |
| **Language** | `en-IN` (Indian English accent tuned) |
| **Behavior** | Live transcription → auto-submits to AI |
| **Use Case** | Farmers with low literacy can speak commands |

### 🚜 Equipment Rental Marketplace

| Aspect | Implementation |
|--------|----------------|
| **Route** | `/farmer/equipment` → `EquipmentRentalPage.tsx` |
| **Tables** | `equipment_rentals` + `equipment_bookings` |
| **Categories** | Tractor, Harvester, Plough, Sprayer, Irrigation |
| **Pricing** | Daily rate × number of days |
| **Flow** | List → Search → Book with date ranges |
| **UI** | Search bar, category select, animated cards |

### ✅ AI Quality Grading (Vision)

| Aspect | Implementation |
|--------|----------------|
| **Route** | `/farmer/quality` → `QualityGradingPage.tsx` |
| **Model** | Google Gemini 2.5 Flash (Vision) |
| **Input** | Base64 image (camera support included) |
| **Output** | Grade (A+/A/B/C), defects, freshness, pricing |
| **Value** | Instant verified badge + market price |

### 🔄 Farmer-to-Farmer Direct Trading

| Aspect | Implementation |
|--------|----------------|
| **Route** | `/farmer/trading` → `TradingPage.tsx` |
| **Table** | `farmer_trades` (Supabase Realtime enabled) |
| **Tabs** | Marketplace (open trades) / My Trades (owned) |
| **Flow** | Create trade → Accept → Complete |
| **Benefit** | Cuts out middlemen, direct P2P trading |

### 🗺️ Multi-Stop Route Optimization

| Aspect | Implementation |
|--------|----------------|
| **Location** | `ActiveOrdersPage.tsx` (delivery dashboard) |
| **Algorithm** | Nearest-Neighbor heuristic |
| **Trigger** | 2+ active orders with known location |
| **Result** | Auto-reorder stops to minimize distance |
| **Integration** | OpenRouteService + Supabase Realtime |

---

## 🔒 Security Hardening (Phase 2)

**All 7 findings resolved:**

| Issue | Fix |
|-------|-----|
| Privilege escalation via self-registration | `ALLOWED_ROLES` whitelist in auth-register |
| Spoofable AI agent identity | Server-side identity verification via JWT |
| Client passing user IDs | Bearer token in Authorization header |
| `user_roles` admin insert | RLS policy with role restrictions |
| Delivery partner order tampering | UPDATE policy restricted to assigned orders |
| Leaked-password reuse | HIBP protection enabled |
| Edge function CORS / auth checks | Bearer token validation on all functions |

---

## 👥 Complete Feature List

### 👨‍🌾 Farmer Features
- Farm boundary mapping (GPS)
- Disease detection (AI Vision)
- Crop recommendations (AI)
- Weather integration
- Product listing & sales
- Order management
- Government schemes (AI)
- Vet booking
- **[NEW]** Equipment rental marketplace
- **[NEW]** AI quality grading
- **[NEW]** Direct farmer-to-farmer trading
- **[NEW]** Voice input support

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
- **[NEW]** Multi-stop route optimization

### 👨‍💼 Admin Features
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
- Realtime (LISTEN/NOTIFY)
- RLS Policies

### Authentication
- Google OAuth 2.0
- Email/Password
- JWT with secure cookies
- Role-based session management

### AI/ML
- Google Gemini (3 Flash & 2.5 Flash)
- Vision AI
- Structured JSON outputs
- Streaming SSE

### APIs & Services
- OpenRouteService (routing)
- OpenWeatherMap (weather)
- Web Push API (VAPID)
- Geolocation API

### PWA & Offline
- Service Worker (Workbox)
- IndexedDB (Dexie.js)
- Offline sync
- Install prompt

### Maps & Navigation
- Leaflet
- React-Leaflet
- Polyline routes
- Custom markers

### State Management & Forms
- TanStack Query
- React Context
- React Hook Form
- Zod validation

### Internationalization
- i18next
- 4 languages (EN, HI, MR, TE)
- Language detection
- RTL support ready

---

## 🔧 Technical Implementation Details

### 🗺️ Farm Area Calculation

| Aspect | Implementation |
|--------|----------------|
| **Library** | Leaflet with React-Leaflet |
| **Drawing** | leaflet-draw plugin |
| **Algorithm** | Shoelace formula (Gauss's area formula) |
| **GPS** | Browser Geolocation API |
| **Unit Conversion** | Square meters → Acres (÷ 4046.86) |
| **Storage** | JSON array in PostgreSQL |

```
Area = ½ |Σ(xᵢyᵢ₊₁ - xᵢ₊₁yᵢ)|
```

### 🚚 Route & Navigation

| Aspect | Implementation |
|--------|----------------|
| **API** | OpenRouteService (driving-car profile) |
| **Edge Function** | `get-route-directions` proxies calls |
| **Distance** | Road-accurate distance from ORS |
| **ETA** | distance / average_speed |
| **Polylines** | Decoded from ORS geometry |
| **Turn-by-turn** | Instructions from ORS steps array |

### 📍 Real-Time Location Tracking

| Aspect | Implementation |
|--------|----------------|
| **GPS Updates** | `navigator.geolocation.watchPosition()` |
| **Sync** | Supabase Realtime (PostgreSQL LISTEN/NOTIFY) |
| **Table** | `delivery_locations` (lat/lng/heading/speed) |
| **Frequency** | Every 5 seconds during delivery |
| **UI** | Pulsating CSS animation markers |

### 🌤️ Weather Integration

| Aspect | Implementation |
|--------|----------------|
| **API** | OpenWeatherMap (Current + Forecast) |
| **Edge Function** | `weather` function with API key |
| **Data** | Temperature, humidity, conditions |
| **Caching** | TanStack Query (10-minute stale time) |

### 🔬 Disease Detection (Vision AI)

| Aspect | Implementation |
|--------|----------------|
| **Model** | Google Gemini 2.5 Flash (Vision) |
| **Input** | Base64-encoded image |
| **Output** | Structured JSON (disease, severity, treatments) |
| **Confidence** | Score 0-100, escalates to vet if <70% |
| **Edge Function** | `disease-detection` |

### 🌾 Crop Recommendation AI

| Aspect | Implementation |
|--------|----------------|
| **Model** | Google Gemini 3 Flash |
| **Inputs** | GPS, weather, soil type, season |
| **Output** | Top 3 crops with yield predictions |
| **Context** | Farm coordinates for localization |
| **Edge Function** | `crop-recommendation` |

### 🔍 AI-Powered Search

| Aspect | Implementation |
|--------|----------------|
| **Model** | Google Gemini 3 Flash |
| **Languages** | English, Hindi, Hinglish |
| **Method** | Semantic matching with AI |
| **Output** | Ranked product IDs + intent |
| **Edge Function** | `ai-search` |

### 💬 Streaming AI Chat

| Aspect | Implementation |
|--------|----------------|
| **Model** | Google Gemini 3 Flash |
| **Protocol** | Server-Sent Events (SSE) |
| **Streaming** | Token-by-token rendering |
| **Context** | Role-aware prompts (farmer/consumer/vet) |
| **History** | Last 10 messages for conversation |

### 📱 Offline-First PWA

| Aspect | Implementation |
|--------|----------------|
| **Service Worker** | Workbox via vite-plugin-pwa |
| **Local DB** | IndexedDB with Dexie.js |
| **Cached** | Farms, weather, products, notifications |
| **Sync** | Queue mutations offline, replay online |
| **Install** | Web App Manifest (192px, 512px icons) |

### 🔔 Push Notifications

| Aspect | Implementation |
|--------|----------------|
| **Protocol** | Web Push API with VAPID keys |
| **Storage** | `push_subscriptions` table |
| **Edge Function** | `send-push-notification` |
| **Events** | Orders, vet responses, weather alerts |

### 🔒 Authentication & Security

| Aspect | Implementation |
|--------|----------------|
| **Provider** | Supabase Auth (email + password) |
| **Sessions** | JWT with refresh rotation |
| **Database** | Row-Level Security (RLS) on all tables |
| **Roles** | 6 distinct roles with permissions |
| **Vet Verification** | Admin approval + certificate upload |

### 🗄️ Database Schema (Key Tables)

| Table | Purpose |
|-------|---------|
| `profiles` | User profile data linked to auth.users |
| `user_roles` | Role assignments (farmer/consumer/vet/etc) |
| `farms` | Farm boundaries, area, soil type |
| `products` | Marketplace listings from farmers |
| `orders` | Order management with status tracking |
| `delivery_locations` | Real-time GPS coordinates |
| `disease_detections` | AI analysis results |
| `consultations` | Vet-farmer consultation sessions |
| `chat_messages` | Real-time chat for consultations |
| `vet_profiles` | Veterinarian credentials & availability |
| `equipment_rentals` | Farm equipment listings |
| `equipment_bookings` | Equipment rental reservations |
| `farmer_trades` | P2P farmer trading listings |
| `notifications` | In-app notification storage |
| `push_subscriptions` | Web Push endpoints |

---

## 🎮 Demo Paths

| Role | Path | Features |
|------|------|----------|
| Farmer | `/farmer` | Disease Detection, Crop AI, Equipment Rental |
| Consumer | `/marketplace` | AI Search, Quality Check, Orders |
| Veterinarian | `/veterinary` | Consultation AI, Chat |
| Retailer | `/retailer` | Inventory Forecasting, Bulk Orders |
| Delivery | `/delivery` | Navigation, Tracking, Route Optimization |
| Admin | `/admin` | User Management, Analytics |

---

## 🚀 Getting Started

### Prerequisites
- Node.js & npm installed — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to project directory
cd farm_sup

# Install dependencies
npm i

# Start development server
npm run dev
```

### Access the app
Open `http://localhost:5173` in your browser

---

## 📱 PWA Installation

Farmaline is a Progressive Web App and can be installed on any device:

1. Visit the app in your browser
2. Click the "Install" prompt (or use browser menu)
3. App will be added to your home screen
4. Works offline with auto-sync when online

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

Built for hackathon demonstration purposes.

---

## 🙏 Acknowledgments

- **Google Gemini** — AI/ML capabilities
- **Supabase** — Backend infrastructure
- **OpenRouteService** — Navigation & routing
- **OpenWeatherMap** — Weather data
- **Shadcn/UI** — Component library
- **Lovable** — Development platform

---

<p align="center">
  <strong>🌱 Farmaline - From Seed to Consumer, Powered by AI 🌱</strong>
</p>
