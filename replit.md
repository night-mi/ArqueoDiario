# Overview

This is a comprehensive cash reconciliation management system built for tracking and managing daily cash box audits at gas stations. The application is designed to help businesses process multiple cash boxes, calculate denomination breakdowns, and generate detailed reconciliation reports. It features a 5-step wizard interface that guides users through configuration, cash box entry, validation, totals summary, and dual reporting phases with complete offline functionality.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The frontend is built with **React 18** using **TypeScript** and follows a component-based architecture with:

- **React Router (Wouter)**: Lightweight client-side routing for navigation
- **TanStack Query**: Server state management and data fetching with caching
- **React Hook Form**: Form state management with validation
- **Zod**: Schema validation for type-safe data handling
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Shadcn/ui**: Pre-built component library built on Radix UI primitives

The frontend uses a **5-step wizard pattern** with a centralized state management approach through React Context for the reconciliation workflow. Components are organized into reusable UI components and feature-specific components for the cash reconciliation process. The system supports dual reporting capabilities: by individual cash boxes and by date with consolidated totals and denomination breakdowns.

## Backend Architecture

The backend is built with **Express.js** and follows a RESTful API design:

- **Express.js**: Web framework for handling HTTP requests and responses
- **TypeScript**: Type safety across the entire backend
- **In-memory storage**: Currently uses a Map-based storage system for development
- **Modular routing**: Separated route handlers for different API endpoints
- **Error handling**: Centralized error handling middleware

The backend implements a **repository pattern** through the `IStorage` interface, allowing for easy swapping between different storage implementations (currently in-memory, prepared for database integration).

## Data Storage Architecture

**Current Implementation**: In-memory storage using JavaScript Maps for development and testing purposes.

**Database Schema Design**: The application is designed with Drizzle ORM and PostgreSQL in mind:
- **Cash Boxes Table**: Stores individual cash box records with denomination breakdowns
- **Reconciliation Sessions Table**: Stores summary data for completed reconciliation sessions
- **UUID Primary Keys**: Uses PostgreSQL's `gen_random_uuid()` for unique identifiers

## State Management

**Frontend State**: 
- **React Context**: Manages wizard state and cash box data during the reconciliation process
- **TanStack Query**: Handles server state, caching, and API communication
- **React Hook Form**: Manages form state with real-time validation

**Backend State**:
- **Stateless API**: Each request is independent with no server-side session storage
- **Data persistence**: Through the storage layer (currently in-memory, designed for database)

## Component Design Patterns

The application uses several key design patterns:

- **5-Step Wizard Pattern**: Complete cash reconciliation workflow including totals summary and dual reporting
- **Repository Pattern**: Abstracted data access layer for future database integration
- **Provider Pattern**: Context providers for shared state management
- **Compound Components**: Shadcn/ui components built on Radix UI primitives
- **Real-time Calculations**: Dynamic breakdown totals and validation across all components
- **Dual Reporting System**: Both individual cash box reports and consolidated date-based reports

## Recent Changes (August 2025)

### Unified Build System Implementation (Latest - August 2025)
- **Single Workflow Script**: Created `build-unified.sh` compatible with all APK compilation methods
- **Multi-Platform Support**: Unified system for web deployment and Android APK generation
- **Cloud Build Integration**: Direct support for Ionic Appflow, CodeMagic, and GitHub Actions
- **Local Compilation Ready**: Complete Android Studio compatibility with SDK verification
- **Web Application Live**: Deployed as accessible web application with permanent URL capability
- **Comprehensive Documentation**: Complete workflow guide with all compilation options

### Code Quality Improvements (August 2025)
- **Enhanced Security**: Added comprehensive error handling, rate limiting, CORS configuration, and helmet security
- **Testing Infrastructure**: Complete Vitest setup with MSW for API mocking and comprehensive test examples
- **Professional Documentation**: Added detailed JSDoc comments, complete README.md, and development guidelines
- **Performance Optimizations**: Implemented optimistic updates, skeleton loading states, and better error boundaries
- **Development Experience**: Enhanced package.json with proper scripts, linting, formatting, and type checking
- **Production Ready**: Environment variables, security middleware, and deployment configurations

## Recent Changes (August 2025)

### System Simplification
- **Streamlined Design**: Removed all historical tracking, database storage, and complex features
- **Simplified UI**: Eliminated history pages, save functionality, and navigation buttons
- **Report Enhancement**: Improved visual design with company branding (Estación de Servicio El Alto, SAVICMASA SL)
- **Clean Interface**: Reduced eye strain with better colors, typography, and simplified layouts

### Final Implementation (August 2025)
- **Worker Management**: Implemented fully editable worker dropdown with localStorage persistence
- **Manual Entry**: Users can add/remove worker names dynamically with intuitive interface
- **Enhanced Reports**: Added detailed bills/coins breakdown in consolidated date reports
- **Report Consistency**: Unified visual styling between both report types (by boxes and by date)
- **Print Optimization**: Professional print buttons on both reports with clean layouts
- **Date Sorting**: Cash box reports now automatically sort by date chronologically (oldest to newest)

### Current Features
- **5-Step Wizard**: Complete offline cash reconciliation workflow
- **Editable Worker System**: Dynamic worker management with local storage
- **Enhanced Visual Reports**: Two report types with detailed bill/coin breakdowns
- **Consistent Design**: Unified professional styling across all components
- **Print Functionality**: Optimized printable reports for paper usage
- **Complete Offline Operation**: Full functionality without internet dependencies
- **Unified Workflow System**: Single build script compatible with all APK compilation methods
- **Web Application Deployment**: Live web version with accessible URL
- **Multi-Platform Compatibility**: Works as web app and Android APK

# External Dependencies

## Core Framework Dependencies
- **React 18**: Frontend framework with concurrent features
- **Express.js**: Backend web framework
- **TypeScript**: Static typing for both frontend and backend
- **Vite**: Build tool and development server

## Database and ORM
- **Drizzle ORM**: Type-safe database toolkit
- **@neondatabase/serverless**: PostgreSQL database driver for serverless environments
- **PostgreSQL**: Primary database (configured but not currently connected)

## UI and Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Headless UI component primitives
- **Shadcn/ui**: Pre-built component library
- **Lucide React**: Icon library

## Form and Validation
- **React Hook Form**: Form state management
- **Zod**: Schema validation and type inference
- **@hookform/resolvers**: Integration between React Hook Form and Zod

## State Management and Data Fetching
- **TanStack Query**: Server state management and caching
- **Wouter**: Lightweight React router

## Development Tools
- **Replit Integration**: Development environment optimizations
- **ESBuild**: JavaScript bundler for production builds
- **PostCSS**: CSS processing with Autoprefixer

## Mobile Application (APK) Configuration

The application has been configured with **Capacitor 7.4.2** to generate Android APK files:

- **App Configuration**: `capacitor.config.ts` with app ID `com.gasolinera.arqueos`
- **Android Project**: Complete Android project generated in `android/` directory
- **Build Scripts**: Automated build scripts for local and CI/CD compilation
- **GitHub Actions**: Automated APK generation workflow configured (`.github/workflows/build-apk.yml`)
- **Mobile Optimization**: Responsive design optimized for touch interfaces

### APK Generation Options
1. **Ionic Appflow**: Specialized Capacitor cloud builds (RECOMMENDED) 
2. **CodeMagic**: Visual CI/CD with Capacitor templates
3. **Local Android Studio**: Complete control with manual setup
4. **GitHub Actions**: Multiple workflows available (complex setup)
5. **GitLab CI/CD**: More build minutes and robust runners

### Recent APK Improvements (August 2025)
- **Alternative Build Solutions**: Created comprehensive guide for multiple APK compilation methods
- **Ionic Appflow Integration**: Recommended specialized Capacitor cloud build service (5-10 min builds)
- **Multiple CI/CD Options**: CodeMagic, GitLab CI, Bitrise alternatives documented
- **Local Build Guide**: Complete Android Studio setup for offline compilation
- **GitHub Actions Portfolio**: 6 different workflow approaches with debugging and compatibility fixes
- **Java Compatibility Solutions**: Multiple approaches to resolve "invalid source release: 21" errors
- **Build Method Comparison**: Detailed analysis of pros/cons for each compilation approach
- **Zero-Config Options**: Services requiring minimal setup vs full control manual approaches

## Production Considerations
The application is designed to easily transition from the current in-memory storage to a full PostgreSQL database by implementing the existing `IStorage` interface with Drizzle ORM queries. The mobile application maintains full offline functionality with local data persistence.