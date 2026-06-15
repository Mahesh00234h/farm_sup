---
name: Phase 2 Feature Additions
description: Voice input, equipment rental, AI quality grading, multi-stop route optimization, farmer-to-farmer trading
type: feature
---

## Voice Input (Web Speech API)
- Mic button in AIAssistant component using SpeechRecognition API
- Auto-submits transcribed text; lang=en-IN
- Falls back gracefully if browser doesn't support

## Equipment Rental Marketplace
- Tables: equipment_rentals, equipment_bookings
- Routes: /farmer/equipment
- Farmers list equipment with daily rate; others can book with date range

## AI Quality Grading
- Route: /farmer/quality
- Uses existing quality-analysis edge function (Gemini 2.5 Flash vision)
- Returns structured JSON: qualityScore, grade, freshness, defects, marketability, verification badge

## Multi-stop Route Optimization
- Added to /delivery/orders (ActiveOrdersPage)
- Nearest-neighbor algorithm reorders delivery stops
- "Optimize Route" button appears when 2+ active orders and driver location known

## Farmer-to-Farmer Direct Trading
- Table: farmer_trades with realtime enabled
- Route: /farmer/trading
- Tabs: Marketplace (open trades) / My Trades
- Farmers create trade listings; other farmers can accept
