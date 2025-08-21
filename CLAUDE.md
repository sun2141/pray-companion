# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Type checking
npm run type-check

# Build with bundle analysis
npm run build:analyze

# Preview production build
npm run preview

# Clean build artifacts
npm run clean

# Health check
npm run health-check
```

## Architecture Overview

This is a Korean prayer companion PWA built with Next.js 15, featuring AI-generated prayers with TTS functionality. The application follows EasyNext foundation with feature-based architecture and Korean language support.

### Core Stack
- **Next.js 15** with App Router and Turbopack for development
- **React 19** with client-side components (all components use `use client` directive)
- **TypeScript** for type safety
- **Tailwind CSS** + **shadcn/ui** for styling and components
- **Supabase** for authentication and database
- **OpenAI API** for prayer generation
- **Naver TTS API** for Korean voice synthesis
- **React Query (@tanstack/react-query)** for server state management
- **Zustand** for lightweight global state management
- **React Hook Form** + **Zod** for form handling and validation

### Authentication Architecture
The app uses a layered authentication system:
- **AuthProvider** (context) wraps the app and provides auth state
- **useAuth** hook manages Supabase authentication
- **ProtectedRoute** component guards authenticated pages
- Environment-based configuration via `src/lib/env.ts`

### API Routes Structure
```
src/app/api/
├── auth/                  # Authentication endpoints
│   ├── signin/           # User sign in
│   ├── signout/          # User sign out
│   ├── signup/           # User registration
│   └── user/             # User profile
├── prayer/
│   └── generate/         # AI prayer generation
├── tts/
│   └── generate/         # Text-to-speech conversion
└── health/               # Health check endpoint
```

### Feature Architecture
Features are organized by domain with clear separation:
```
src/features/
├── auth/                 # Authentication forms and modals
├── prayer/               # Prayer generation and management
├── tts/                  # Text-to-speech functionality
├── companion-count/      # User engagement tracking
├── image-card/           # Visual prayer cards
└── subscription/         # Premium features
```

### Provider Stack
The app uses a comprehensive provider hierarchy:
1. **AuthProvider** - Supabase authentication state
2. **ThemeProvider** - Dark/light theme with system detection
3. **QueryClientProvider** - React Query for server state

### PWA Configuration
- Comprehensive metadata for SEO and social sharing
- Korean language support (`lang="ko"`)
- Apple Web App capabilities
- Service worker manifest at `/manifest.json`
- Optimized viewport for mobile devices

## Key Development Guidelines

### Component Requirements
- **Always use `'use client'` directive** for all components
- Use **promise-based params** for page.tsx files
- Prefer **client components** over server components
- Korean language content should use proper UTF-8 encoding

### Authentication Patterns
- Use `useAuthContext()` to access authentication state
- Wrap protected pages with `<ProtectedRoute>`
- Environment variables are validated via `validateEnv()`
- Server-only variables (OPENAI_API_KEY, NAVER credentials) are not exposed to client

### API Integration
- **OpenAI**: Prayer generation with Korean prompts
- **Naver TTS**: Korean voice synthesis for prayers
- **Supabase**: User management and data persistence
- **Crypto-js**: Secure handling of sensitive data

### Library Usage
- **date-fns**: Date and time handling
- **ts-pattern**: Type-safe branching logic
- **@tanstack/react-query**: Server state management
- **zustand**: Global state management
- **react-use**: Common React hooks
- **es-toolkit**: Utility functions (preferred over lodash)
- **lucide-react**: Icons
- **zod**: Schema validation
- **react-hook-form**: Form management
- **framer-motion**: Animations and transitions
- **axios**: HTTP client for API calls

### Code Style
- Follow **functional programming** principles
- Use **early returns** instead of nested conditionals
- Prefer **descriptive names** and **constants over functions**
- Apply **DRY principle** and **composition over inheritance**
- Use **TypeScript** for all files
- ESLint is configured but ignored during builds

### Environment Management
All environment variables are centralized in `src/lib/env.ts`:
- Public variables: Supabase URL/keys, app URL, environment
- Server-only: OpenAI API key, Naver credentials, service role key
- Validation helper ensures required variables are present

### Image Configuration
Next.js config allows images from any hostname (`**` pattern) for flexible external image sources.

### Theme Support
Comprehensive theming with next-themes:
- Light/dark mode with system preference detection
- Smooth transitions disabled for performance
- Theme persistence across sessions

<guideline>
- @claude-rules/senior-developer-guideline.md
</guideline>

<vooster-docs>
- @vooster-docs/prd.md
- @vooster-docs/architecture.md
- @vooster-docs/guideline.md
- @vooster-docs/clean-code.md
- @vooster-docs/isms-p.md
</vooster-docs>