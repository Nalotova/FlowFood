# FlowFood

An AI-powered meal planner that works backwards from nutrition goals to real recipes. Instead of only logging what the user has already eaten, FlowFood uses target calories and macros, current fridge inventory, meal type, and personal preferences to generate a complete meal with exact gram amounts, recipe steps, and per-person portions.

FlowFood was built around a practical limitation of traditional calorie trackers: apps like FatSecret or similar tools record food well, but the user still has to decide what to eat in order to hit protein, fat, carb, and calorie targets. FlowFood reverses that workflow. The user sets nutrition goals first, then the AI creates a realistic meal from the food available at home.

## Core Concept

Traditional calorie tracker:

```text
User eats food -> user logs food -> app shows calories and macros
```

FlowFood:

```text
User defines kcal and macro goals
  + current meal type: breakfast, lunch, snack, or dinner
  + available fridge ingredients
  + preferences and cravings
  v
AI generates a meal that fits the target
  + exact grams
  + per-person portions
  + recipe steps
  + ingredient write-off
  + food log entry
```

The main product idea is macro-aware meal generation: the app does not just say what was eaten, it helps decide what to eat next.

## Project Highlights

- Reverse meal planning from target calories and macros to an actual recipe
- AI chef that generates meals from available fridge ingredients
- Personalized portions for multiple household members
- Meal-type awareness: breakfast, lunch, snack, dinner
- User cravings and preferences, such as "I want porridge, not eggs"
- Exact gram amounts for each ingredient and each person
- Recipe instructions with cooking steps and taste notes
- Inventory write-off after accepting a meal
- AI-assisted virtual fridge with text and image-based food entry
- Product recognition from package photos and nutrition labels
- Daily food log and nutrition summaries
- Firebase-backed household profiles, roles, invites, and permissions
- Mobile-first PWA-oriented interface for kitchen use

## Why This Is Different

Most food tracking apps are retrospective. They answer: "What did I eat?"

FlowFood is proactive. It answers: "What should I cook now to stay close to my goals, using what I already have?"

The app considers:

- Daily calorie target
- Protein, fat, and carbohydrate targets
- Calories already consumed today
- Remaining calories for the day
- Current meal type
- Available products in the fridge
- Ingredient amounts and units
- Allergies and forbidden foods
- Likes, dislikes, and user cravings
- Whether the family eats the same dish with different portions or separate dishes

## Key Features

### Macro-Targeted AI Meal Planning

The AI cooking service generates a full meal plan using available fridge items and target nutrition data.

Each generated meal includes:

- Meal name and explanation
- Full recipe with cooking steps
- Exact ingredient grams
- Per-person portions
- Calories, protein, fat, and carbs for each portion
- Total ingredient table
- Remaining fridge inventory after cooking
- Warnings if the meal cannot perfectly match targets or inventory constraints

### Preference-Aware Cooking

The user can guide the AI with natural language, for example:

- "I want porridge for breakfast"
- "Make it higher protein"
- "Do not use eggs"
- "Use the cottage cheese before it expires"
- "Make it more filling"
- "I want something warm, not a salad"

The AI then adapts the recipe while still respecting calorie, macro, inventory, and allergy constraints.

### Virtual Fridge

- Add food manually with calories and macronutrients
- Adjust product amounts directly from the fridge list
- Filter and search products by name, brand, and category
- Parse natural-language food input into structured product cards
- Detect similar existing products and merge quantities when appropriate
- Review AI-generated drafts before saving them

### Photo-Based Product Recognition

FlowFood can analyze photos of product packaging or nutrition labels and convert them into structured food items.

The recognition flow extracts:

- Product name and brand
- Package amount and unit
- Calories and macronutrients per 100g
- Food categories and storage state
- Confidence score, notes, and review warnings

### Household Profiles and Permissions

The app supports shared household use instead of a single-user-only model.

- Google sign-in
- Household creation and switching
- Pending invite handling
- Role-based permissions for editing, inviting, and managing members
- Individual food profiles with kcal targets, meal distribution, portion multipliers, allergies, forbidden foods, likes, and dislikes

### AI Chef Chat and Revisions

After a meal plan is generated, the user can chat with the AI chef to ask questions or request changes.

The AI can either:

- Explain why the meal was built this way
- Propose a revised cooking result with different ingredients, higher protein, fewer carbs, more satiety, or a different taste direction

The proposed revision is reviewed before being accepted.

### Cooking Acceptance Flow

When the user accepts a generated meal:

- Used ingredients are subtracted from the fridge
- A food log entry is created for each participant
- Portion nutrition is saved with the meal
- The cooking result can be stored in history

### Nutrition Tracking

- Daily food log entries
- Quick snack entry
- Per-profile nutrition summaries
- Remaining kcal for the day
- Protein, fat, and carb tracking
- Planned meal integration with daily totals

## Tech Stack

| Area | Technologies |
| --- | --- |
| Frontend | React 19, TypeScript, Vite |
| Styling and UI | Tailwind CSS, Motion, Lucide React |
| AI | Google Gemini via a shared AI client |
| Backend | Express, tsx |
| Auth and Data | Firebase Auth, Firestore |
| PWA | Web manifest, offline page, mobile app metadata |
| State and Domain Logic | Custom React hooks and services |
| Validation | Custom cooking and nutrition validation utilities |

## Architecture

```text
React / Vite App
  |
  |-- Household profiles and nutrition targets
  |-- Virtual fridge inventory
  |-- Food log and daily summaries
  |-- Macro-aware cooking planner
  |-- AI chef chat and revisions
        |
        v
AI Services
  |
  |-- fridgeAiService: natural-language food parsing
  |-- photoFoodRecognitionService: package and nutrition-label recognition
  |-- aiCookingService: meal planning from inventory and nutrition targets
  |-- chefChatService: questions and revisions for generated meals
        |
        v
Domain Services
  |
  |-- cookingService: meal target and macro calculations
  |-- cookingHistoryService: saved meal plans
  |-- foodLogService: daily nutrition entries
  |-- fridgeService: inventory persistence
  |-- householdService: roles, members, invites
        |
        v
Firebase / Express
  |
  |-- Firebase Auth
  |-- Firestore household and nutrition data
  |-- Express/Vite local runtime
```

## What I Built

- Designed a reverse-planning nutrition workflow: from target calories/macros to real meals
- Implemented a virtual fridge with structured nutrition data and AI-assisted item entry
- Built photo-based food recognition for product packages and nutrition labels
- Created a multi-profile nutrition model with calories, macros, meal distribution, preferences, allergies, and portion multipliers
- Implemented AI meal planning that respects inventory, restrictions, kcal targets, macros, meal type, and user cravings
- Added validation to check inventory usage, target deviations, and forbidden-food conflicts
- Built an acceptance workflow that writes off ingredients and creates food log entries
- Added AI chef chat for explaining or revising generated meal plans
- Implemented Firebase-backed authentication, household roles, invites, and persistence
- Built a mobile-first PWA-style interface for kitchen use

## Why This Project Matters

FlowFood demonstrates product thinking around AI as a decision-making layer, not just a text generator. The AI uses structured app data to generate a practical cooking decision, and that decision becomes persistent product state: inventory changes, food log entries, nutrition totals, and saved cooking history.

For recruiters, this project shows experience with:

- Building a complex React/TypeScript application
- Designing AI workflows with structured JSON outputs and validation
- Modeling real-world household, food, inventory, and nutrition data
- Integrating Firebase Auth and Firestore-backed persistence
- Building role-based multi-user product logic
- Turning AI-generated plans into concrete state changes inside the app
- Designing mobile-first interfaces for repeated daily use
- Creating a product workflow that improves on a familiar category of apps

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase project with Auth and Firestore configured
- Google Gemini API key

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Firebase configuration is loaded from `firebase-applet-config.json`.

### Run Locally

```bash
npm run dev
```

or:

```bash
npm start
```

### Build

```bash
npm run build
```

### Type Check

```bash
npm run lint
```

## Data Model Overview

FlowFood works with several connected domain models:

- `FoodItem` - fridge inventory, amount, unit, calories, macros, category, source, and state
- `UserProfile` - household member, daily kcal, meal distribution, preferences, allergies, and restrictions
- `CookingRequest` - selected participants, meal type, preferred/excluded foods, target strategy, and user comments
- `CookingResult` - AI-generated meal, portions, ingredients, inventory movements, recipe, warnings, and validation report
- `FoodLogEntry` - accepted meals, quick snacks, nutrition totals, and daily tracking
- `Household` - shared household, owner, members, roles, and invites

## Privacy and Safety Notes

The app handles household food data, personal nutrition targets, and user profiles. A production deployment should include strict Firestore security rules, consent-aware household sharing, and clear policies for AI-generated nutrition suggestions.

The AI chef should be treated as a meal-planning assistant, not medical or clinical nutrition advice.

## Roadmap

- Rename the GitHub repository from `Essen1` to `FlowFood`
- Add screenshots and a short product walkthrough
- Add a demo mode with sample household, fridge, and cooking data
- Add stronger tests for AI response validation and inventory write-off logic
- Add barcode scanning or product database lookup
- Add weekly meal planning and shopping list generation
- Improve offline support for kitchen use
- Add deployment instructions and production Firebase security notes

## License

Source files include an Apache-2.0 SPDX header.