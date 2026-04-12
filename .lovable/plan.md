
# ListingOS — Real Estate Agent SaaS App

## Overview
A dark, sleek B2B SaaS app with two AI-powered tools for real estate agents: a Listing Description Generator and an Open House Follow-Up Email Generator.

## Pages & Layout

### Landing Page (`/`)
- Dark hero section with bold headline ("Your Listings. Elevated."), subheadline about AI-powered tools for modern agents, and a glowing CTA button ("Get Started") that navigates to the dashboard
- Minimal feature cards highlighting the two tools
- Smooth scroll animations on entry

### Dashboard Layout (`/dashboard`)
- Collapsible dark sidebar with ListingOS branding, nav links to both tools, and a polished icon-based collapsed state
- Smooth animated page transitions between tools using framer-motion

### Tool 1: Listing Description Generator (`/dashboard/listing`)
- Clean form with fields: Property Address, Beds, Baths, Sq Ft, Key Features (multi-line), Neighborhood Vibe
- "Generate Description" button → calls Lovable AI to produce a polished MLS listing description
- Result displayed in a styled card with a one-click "Copy to Clipboard" button
- Streaming output so text appears progressively

### Tool 2: Open House Follow-Up Email (`/dashboard/follow-up`)
- Form with fields: Attendee Name, Property Address, Notes from Showing
- "Generate Email" button → calls Lovable AI to produce a warm, personalized follow-up email
- Result displayed with copy-to-clipboard functionality
- Streaming output

## Design
- Dark theme throughout (near-black backgrounds, subtle borders, muted text)
- Accent color: a premium gold or electric blue for CTAs and highlights
- Clean typography, generous spacing, glass-morphism cards
- Smooth page transitions with framer-motion

## Backend
- One Supabase Edge Function per tool (or one with branching) calling Lovable AI Gateway
- System prompts tailored for real estate copy on the backend
- Streaming SSE responses for real-time text generation

## Tech
- React + Tailwind dark theme + shadcn/ui components
- framer-motion for animations
- Lovable Cloud + AI Gateway for generation
