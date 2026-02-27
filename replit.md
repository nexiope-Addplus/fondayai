# Fonday - AI 피부 스캐너 & 뷰티 매거진

## Overview
A mobile-optimized SPA for AI skin scanning and beauty content curation. Users can scan their skin via camera, get instant analysis results, and browse beauty magazine articles. MVP prototype for the Fonday hardware skin scanner product.

## Architecture
- **Frontend-only SPA** - No backend API calls needed; all logic is in React frontend
- **React + Vite + Tailwind CSS** with framer-motion for animations
- **2-tab bottom navigation**: AI 스캔, 뷰티 매거진

## Key Files
- `client/src/pages/skin-scan.tsx` - Main page with all components (scan idle/scanning/result + magazine)
- `client/src/App.tsx` - App entry with routing
- `client/index.html` - HTML with Noto Sans KR + Playfair Display fonts
- `client/src/index.css` - Theme: deep green primary, coral accent, beige secondary

## Features
1. **AI 스캔 tab** - Large circular CTA button → camera capture → laser scanning animation (3s) → analysis results with scores
2. **분석 결과** - Skin condition scores (종합/수분/붉은기) with animated progress bars, locked hardware hook with blur, Fonday earlybird CTA
3. **뷰티 매거진 tab** - Magazine-style article cards with gradient thumbnails

## Design
- Colors: Deep Green (#2D5F4F), Coral (#D4836B), Beige (#F5F0EB)
- Fonts: Noto Sans KR (body) + Playfair Display (headings)
- Mobile-first, Korean language UI
- framer-motion page transitions and micro-interactions

## Dependencies
- framer-motion for animations
- lucide-react for icons
- No database or backend API required
