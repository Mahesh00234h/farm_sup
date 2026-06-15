# Project Memory

## Core
- Mobile-first UX: 85vw sidebars, 52px min touch targets, h-14 sticky header.
- Brand: Farmaline. Warm cream tones, NO high-saturation green. Hide Lovable badge. PWA icons for favicon.
- Stack: Supabase (RLS, Realtime, Edge Functions), @tanstack/react-query.
- Auth: Custom email/pwd only via Edge Functions. NO Google OAuth.

## Memories
- [Auth Flow & RBAC](mem://features/auth) — Strict 6-role RBAC, custom auth-register Edge Function
- [Logistics & Delivery](mem://features/logistics) — ETA Haversine, OpenRouteService routing, 10% commission
- [AI Intelligence Suite](mem://ai/core-intelligence-suite) — Gemini 2.5/3 Flash tool-calling, SSE streaming, weather integration
- [Marketplace & Checkout](mem://features/marketplace/consumer-experience) — 3-step COD checkout, localized cart, wishlist
- [Veterinary System](mem://features/veterinary/system-overview) — Doctor discovery, consultation booking, verification workflow
- [Retailer Module](mem://features/retailer/module-overview) — Inventory tracking, bulk agreements, AI demand forecasting
- [PWA Offline Sync](mem://tech/pwa-offline-sync) — Dexie IndexedDB offline-first, queue and Supabase reconcile
- [i18n Support](mem://style/i18n-support) — English, Hindi, Marathi, Telugu via i18next
- [Map Visualizations](mem://style/map-visualization-standards) — Leaflet modes (Satellite/Hybrid/Street), CSS constraints
- [Farmer Tools](mem://features/farmer/land-area-calculation) — Area calculation via Shoelace formula, Crop Price Ticker
- [Government Schemes](mem://features/farmer/gov-schemes-ai) — Gemini 3 Flash Edge Function for Indian agri schemes
- [Notifications](mem://features/notifications-system) — Web Push with VAPID for order status updates
- [Landing Page Design](mem://style/landing-page-design) — Warm cream-toned identity, soft hero-gradient
- [Hackathon Presentation](mem://docs/hackathon-presentation-strategy) — Interactive Framer Motion pitch deck at /hackathon
- [API Documentation](mem://docs/api-documentation-resource) — Backend guide at public/api-documentation.md
- [Phase 2 Features](mem://features/phase2-additions) — Voice input, equipment rental, quality grading, multi-stop optimization, farmer trading
