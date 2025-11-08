# 🫙 FoodStorage

FoodStorage is a modern pantry companion built with Expo + React Native. Keep an eye on what’s in your fridge, spin up recipe ideas from what you already have, and manage your household kitchen with a single app.

---

## ✨ Highlights

- Smart storage cards with expiry tracking and status badges.
- AI-inspired recipe generator mock for future integrations.
- On-device receipt OCR to turn grocery tickets into storage items automatically.
- Light & dark themes wired through a custom `ThemeProvider`.
- Supabase-ready authentication flow with profile management.
- Floating bottom navigation for quick access to every section.

---

## 🚀 Quick Start

```bash
# install dependencies
npm install

# run on web / iOS / Android
npx expo start
```

Pick the platform from Expo Dev Tools or press the corresponding key in the terminal prompt.

---

## 🧭 App Map

- `Home`: snapshot of inventory health and upcoming expirations.
- `Storage`: searchable list of pantry items with status tags.
- `Recipes`: curated suggestions plus a generator action.
- `Favorites`: bookmark future meal wins.
- `Profile`: update identity, toggle theme, manage credentials.

---

## 🛠️ Stack

- **Framework**: Expo (React Native)
- **Navigation**: React Navigation (stack + tabs)
- **State & Data**: React Query, Supabase JS client
- **UI**: React Native core components, `lucide-react-native` icons
- **Tooling**: TypeScript, ESLint, Babel

---

## 📂 Project Layout

```
src/
├─ navigation/     # navigators, tab config, param types
├─ providers/      # theme, auth, toast context providers
├─ screens/        # feature screens (Storage, Recipes, Profile, etc.)
├─ lib/            # Supabase client + generated types
├─ assets/         # fonts, images, design tokens
└─ scripts/        # helper scripts for CI or maintenance
```

---

## 🎛️ Available Scripts

```bash
npm run lint        # lint with ESLint
npm run typecheck   # validate TypeScript types
npm run android     # open Android emulator (requires setup)
npm run ios         # open iOS simulator (macOS only)
npm run web         # run in the browser
```

---

## 🎨 Theming Tips

- Theme colors live in `src/providers/ThemeProvider.tsx`.
- Access colors via `useThemeMode()` for consistent styling.
- Components should consume theme tokens instead of hardcoded hex values.

---

## 🔒 Auth & Data

- Supabase is preconfigured for email-based auth.
- Profile data syncs through React Query (`profile` cache key).
- Mocked recipe/storage datasets make the app demo-friendly even without a backend.

---

## 🤝 Contributing

1. Fork & create a feature branch.
2. Stick to TypeScript + ESLint conventions (`npm run lint`).
3. Open a PR describing the change, screenshots welcome!

---

## 📬 Support

Questions, suggestions, or bug reports? Open an issue or reach the maintainer directly. Happy cooking!

---
