# Project Structure

This document outlines the structure of the Next.js WebSocket Chat Application.

## Directory Layout

```
.
├── src/
│   ├── app/                 # Next.js App Router pages and API routes
│   ├── components/          # React components
│   │   ├── auth/            # Authentication forms (Login, Register)
│   │   ├── chat/            # Chat room components
│   │   └── dashboard/       # Dashboard components (Room list, Friend list)
│   ├── dao/                 # Data Access Objects (Supabase integration)
│   ├── hooks/               # Custom React Hooks
│   │   ├── auth/            # Auth hooks (useLogin, useRegister)
│   │   ├── chat/            # Chat hooks (useChat, useWebSocket, useRoomJoin)
│   │   └── dashboard/       # Dashboard hooks (useRoomList, useRoomCreate)
│   ├── i18n/                # Internationalization (locales, context)
│   ├── lib/                 # Utilities and constants
│   │   ├── crypto.ts        # Cryptography utilities
│   │   ├── routes.ts        # Route definitions
│   │   └── ...
│   ├── models/              # Domain models
│   ├── server/              # Backend server (Socket.io)
│   │   └── server.js        # Main server entry point
│   ├── styles/              # CSS modules and global styles
│   └── types/               # TypeScript type definitions
│       ├── dto.ts           # Data Transfer Objects
│       ├── entities.ts      # Database Entities
│       ├── events.ts        # Socket Events
│       └── uimodel.ts       # UI Models
├── public/                  # Static assets
└── ...
```

## Key Components

- **src/server/server.js**: The custom Node.js server that handles both Next.js requests and Socket.io WebSocket connections.
- **src/dao**: Contains DAO classes that abstract database interactions (Supabase).
- **src/hooks**: Contains business logic and state management, separated by feature.
- **src/i18n**: Handles multi-language support (English/Korean).

## Conventions

- **Imports**: Use absolute imports with `@/` alias (e.g., `@/components/...`).
- **Constants**: Store shared constants in `src/lib` or specific feature folders.
- **Types**: Define shared types in `src/types`.
