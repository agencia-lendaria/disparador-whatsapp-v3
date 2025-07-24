# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **WhatsApp Dispatcher Pro v3** - a Next.js-based platform for mass WhatsApp message dispatching with multiple API support (Evolution API v2 and WhatsApp Cloud API). The application includes campaign management, contact importing, message scheduling, and real-time analytics.

## Development Commands

### Core Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint checks

### Testing
No test scripts are currently configured in package.json.

## Architecture & Tech Stack

### Frontend Framework
- **Next.js 14** with App Router (`app/` directory)
- **TypeScript** for type safety
- **Tailwind CSS** + **Shadcn/ui** for styling
- **React Hook Form** with **Zod** validation

### Backend & Database
- **Supabase** for authentication, database, and real-time features
- **PostgreSQL** with Row Level Security (RLS)
- Database schema includes: `api_configurations`, `campaigns`, `campaign_messages`, `campaign_contacts`, `sending_configurations`

### Key Integrations
- **Evolution API v2** for WhatsApp Web
- **WhatsApp Cloud API** (Meta) for official API
- **Google Sheets API** for contact importing and status updates
- **Supabase Auth** for user management

## Project Structure

### Hybrid Setup Warning
This project contains both Next.js (`app/`) and Vite (`src/`) configurations, which may cause conflicts. The active structure appears to be Next.js with:

- `app/` - Next.js App Router pages and layouts
- `components/` - Reusable React components organized by feature
  - `layout/` - Header, sidebar navigation
  - `providers/` - Auth and context providers  
  - `ui/` - Shadcn/ui components
- `lib/` - Utility functions and Supabase client setup

### Database Schema
The TypeScript database types in `lib/supabase.ts` define the complete data model for campaigns, API configurations, contacts, and sending configurations.

## Key Components & Features

### Authentication
- Supabase Auth with automatic redirect handling
- Email verification disabled per PRD requirements
- Auth state managed via `AuthProvider` component

### Campaign Management
- Multi-step campaign creation wizard
- Support for text, media, and interactive messages
- Contact import from CSV/Excel and Google Sheets
- Anti-spam controls with configurable delays and limits

### API Management  
- Support for multiple WhatsApp API types
- Encrypted token storage
- Connection testing before saving configurations

### Message Dispatching
- Queue-based processing system
- Real-time progress tracking
- Configurable retry logic and error handling
- Google Sheets integration for status updates

## Important Context

### Development Status
Based on the folder name, this version is currently non-functional and requires fixes. The PRD document indicates this is a comprehensive WhatsApp messaging platform with advanced features.

### Multi-API Support
The application is designed to work with:
1. Evolution API v2 (WhatsApp Web)  
2. Evolution API v2 (Cloud API Meta)
3. Direct WhatsApp Cloud API integration

### Security Considerations
- All API tokens should be encrypted in the database
- Row Level Security (RLS) policies must be properly configured
- Rate limiting should be implemented to prevent API abuse

## Database Schema Reference

Key tables:
- `api_configurations` - Stores encrypted API credentials and settings
- `campaigns` - Campaign metadata and scheduling
- `campaign_messages` - Message content and media
- `campaign_contacts` - Contact lists with status tracking
- `sending_configurations` - Anti-spam and timing controls

# Security prompt:

Please check through all the code you just wrote and make sure it follows security best practices. make sure there are no sensitive information in the front and and there are no vulnerabilities that can be exploited

# MCP
Utilize os MCPs (Model Context Protocol) abaixo para determinadas tarefas.
supabase -> Utilizar para implementar soluções completas de backend incluindo:
    - Banco de dados PostgreSQL com RLS (Row Level Security)
    - Sistema de autenticação (GoTrue) com JWT
    - API RESTful automática via PostgREST
    - Armazenamento de arquivos (Storage)
    - Funcionalidades Realtime para colaboração
    - Edge Functions para lógica serverless
    - Seguir convenções snake_case para tabelas e campos
context7 -> Utilizar para acessar documentação oficial sempre atualizada de bibliotecas e frameworks.
@magicuidesign/mcp -> Utilizar para criar e implementar componentes modernos de UI, seguindo boas práticas de design, acessibilidade e responsividade. Priorizar componentes reutilizáveis e consistência visual.