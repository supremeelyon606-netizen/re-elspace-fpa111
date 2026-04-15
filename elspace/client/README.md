# EL SPACE Frontend - Next.js 14 App Router Boilerplate

Complete frontend implementation for the EL SPACE freelancing platform with Next.js 14, TypeScript, Tailwind CSS, and shadcn/ui.

## 🏗️ Architecture

### Project Structure

```
src/
├── app/
│   ├── layout.tsx                 # Root layout with 6 providers
│   ├── page.tsx                   # Landing page
│   ├── (auth)/                    # Auth route group
│   │   ├── login/page.tsx         # Login with 2FA
│   │   ├── register/page.tsx      # Register with role selection
│   │   └── [...routes]
│   └── (main)/                    # Protected routes
│       ├── layout.tsx             # Protected layout with session check
│       ├── dashboard/page.tsx     # Role-based dashboard
│       ├── sessions/page.tsx      # 1v1 session bookings
│       ├── communities/page.tsx   # Community discovery
│       ├── feed/page.tsx          # Social feed
│       ├── notifications/page.tsx # Notification hub
│       ├── messages/page.tsx      # Direct messaging
│       ├── projects/page.tsx      # Project browsing
│       ├── disputes/page.tsx      # Dispute resolution
│       ├── wallet/page.tsx        # Wallet management
│       ├── settings/page.tsx      # Account settings
│       ├── profile/[userId]/page.tsx    # User profiles
│       └── [...other routes]
├── components/
│   ├── providers/
│   │   ├── AuthProvider.tsx       # NextAuth SessionProvider
│   │   ├── QueryProvider.tsx      # React Query setup
│   │   ├── SocketProvider.tsx     # Socket.io context
│   │   ├── ToastProvider.tsx      # Toast notifications
│   │   ├── ThemeProvider.tsx      # Dark mode toggle
│   │   └── index.ts               # Provider barrel export
│   ├── ui/
│   │   ├── button.tsx             # shadcn/ui Button
│   │   ├── card.tsx               # shadcn/ui Card
│   │   ├── icons.tsx              # Icon mapping component
│   │   └── [...other ui components]
│   └── [...other components]
├── hooks/
│   ├── useToast.ts                # Toast notification hook
│   ├── useSocket.ts               # Socket.io connection hook
│   └── [...other hooks]
├── lib/
│   ├── utils.ts                   # 30+ utility functions
│   ├── api.ts                     # API client with error handling
│   └── [...other utilities]
└── types/
    └── [...type definitions]
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm or yarn package manager
- PostgreSQL or MongoDB for backend
- Express.js backend running

### Installation

```bash
cd elspace/client

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

### Configuration

Create `.env.local` with:

```env
# NextAuth
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_URL_SERVER=http://localhost:3000

# API
NEXT_PUBLIC_API_URL=http://localhost:5000

# OAuth (optional)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-secret
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-secret

# Socket.io
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000

# Daily.co Video (optional)
NEXT_PUBLIC_DAILY_API_KEY=your-daily-api-key
NEXT_PUBLIC_DAILY_ROOM_PREFIX=elspace-
```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Format code with Prettier
npm run format
```

Visit `http://localhost:3000` in your browser.

## 🔐 Authentication Flow

### Login Page (`/login`)
- Email/password validation with Zod
- Two-factor authentication (2FA) support
- OAuth integration (Google, GitHub)
- Remember me functionality
- Error handling with toast notifications

### Register Page (`/register`)
- Role selection (Freelancer/Client)
- Password strength validation (8+ chars, uppercase, lowercase, number)
- Email verification
- Terms & privacy acceptance
- Social signup options

### Protected Routes
- All routes under `(main)` group require authentication
- Automatic redirect to login if session expires
- Loading spinner during auth check

## 🎨 UI System

### Components (shadcn/ui)

- **Button** - Primary action component with variants
- **Card** - Content container with header/footer sections
- **Input** - Text input with validation support
- **Textarea** - Multi-line text input
- **Badge** - Status/category labels
- **Avatar** - User profile images with fallbacks
- **Dialog** - Modal dialogs for actions
- **Tabs** - Content organization
- **Select** - Dropdown selection
- **Switch** - Toggle switches
- **Tabs** - Tab-based content views

### Design System

- **Colors:**
  - Primary: Cyan-500 for CTAs
  - Secondary: Amber-500 for secondary actions
  - Success: Green for positive outcomes
  - Destructive: Red for dangerous actions
  - Muted: Gray for disabled/secondary text

- **Fonts:**
  - Display: Space Grotesk (headings)
  - Body: Inter (content)

- **Spacing:** Tailwind standard (4px units)
- **Dark Mode:** Built-in with next-themes

## 📊 Data Management

### React Query Setup

```typescript
// Fetching data
const { data, isLoading, error } = useQuery({
  queryKey: ['projects'],
  queryFn: () => fetch('/api/projects').then(r => r.json())
})

// Mutations
const { mutate } = useMutation({
  mutationFn: (data) => api.post('/projects', data),
  onSuccess: () => {
    toast({ title: 'Success' })
    queryClient.invalidateQueries({ queryKey: ['projects'] })
  }
})
```

### API Client

```typescript
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'

// GET request
const projects = await apiGet('/api/projects')

// POST with authentication
const result = await apiPost('/api/projects', { title: 'New Project' })

// Error handling
try {
  await apiDelete('/api/projects/123')
} catch (error) {
  if (error.status === 404) {
    // Handle not found
  }
}
```

## 🔔 Real-Time Features

### WebSocket / Socket.io

```typescript
import { useSocket } from '@/hooks/useSocket'

export function ChatComponent() {
  const socket = useSocket()

  useEffect(() => {
    socket?.on('message:new', (data) => {
      // Handle new message
    })

    return () => socket?.off('message:new')
  }, [socket])
}
```

### Available Namespaces

- `/messages` - Direct messaging
- `/sessions` - Session updates
- `/feed` - Social feed reactions
- `/notifications` - Real-time notifications
- `/admin` - Admin panel updates

## 📋 Form Validation

### Using Zod + React Hook Form

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password too short')
})

export function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema)
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
    </form>
  )
}
```

## 🎯 Page Features

### Dashboard (`/dashboard`)
- Role-based welcome message
- Key metrics cards (projects, earnings, etc.)
- Recent activity feed
- Quick action buttons
- Tab-based content organization

### Sessions (`/sessions`)
- Upcoming/Past/Discover tabs
- Session booking interface
- Freelancer availability display
- Session join functionality

### Communities (`/communities`)
- Discover/My Communities/Trending tabs
- Search functionality
- Community member counts
- Join community buttons

### Feed (`/feed`)
- Create post form
- For You/Following/Trending tabs
- Post cards with engagement
- Like/comment/share interactions

### Messages (`/messages`)
- Conversation list with search
- Unread badges
- Message preview
- Direct link to chat threads

### Projects (`/projects`)
- Role-based view (My Projects vs Browse)
- Active/Completed/Archived tabs
- Project filtering and search
- Apply to project functionality

### Wallet (`/wallet`)
- Balance display (Available/Pending/Total)
- Deposit/Withdraw dialogs
- Payment method selection
- Transaction history

### Settings (`/settings`)
- Account information
- Notification preferences
- Theme/Language/Timezone
- Security (2FA, password, sessions)

## 🛠️ Utilities

### Formatting Functions

```typescript
import {
  formatCurrency,    // $1,234.56
  formatDate,        // January 1, 2024
  formatTime,        // 12:30 PM
  formatDateTime,    // January 1, 2024 at 12:30 PM
  getTimeAgo,        // 2 hours ago
  formatNumber,      // 1,234
  formatRating,      // 4.5
  formatDuration,    // 2h 30m
  getInitials        // JD (from "John Doe")
} from '@/lib/utils'
```

### Object Utilities

```typescript
import {
  chunk,             // Split array into smaller arrays
  flatten,           // Flatten nested arrays
  groupBy,           // Group objects by property
  unique,            // Get unique array values
  debounce,          // Debounce function
  throttle           // Throttle function
} from '@/lib/utils'
```

## 📱 Responsive Design

All pages are mobile-first with breakpoints:
- `md:` - Tablet and up (768px)
- `lg:` - Desktop and up (1024px)
- `xl:` - Large desktop (1280px)

## 🔄 State Management

### Session State
- Managed by NextAuth via SessionProvider
- Access via `useSession()` hook
- Automatically persisted in sessions

### Server State (React Query)
- Automatic caching and invalidation
- Background refetching
- Optimistic updates support
- Devtools available in development

### Client State (Zustand-ready)
- Prepare for client-side state needs
- Use stores for UI state that doesn't need server sync

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Connect your GitHub repo to Vercel
# Set environment variables in Vercel dashboard
# Push to main branch to deploy
```

### Docker

```bash
# Build image
docker build -t elspace-client .

# Run container
docker run -p 3000:3000 elspace-client
```

### Environment Variables for Production

```env
NEXTAUTH_SECRET=your-production-secret
NEXTAUTH_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SOCKET_URL=https://socket.yourdomain.com
```

## 📚 Learning Resources

- [Next.js 14 Documentation](https://nextjs.org/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [NextAuth.js](https://next-auth.js.org)
- [Socket.io Client](https://socket.io/docs/v4/client-api/)

## 🐛 Troubleshooting

### Session undefined in client component
- Ensure using `'use client'` directive
- Wrap component with SessionProvider (already done in layout)
- Check NEXTAUTH_SECRET in environment

### API requests failing
- Verify backend is running
- Check NEXT_PUBLIC_API_URL
- Look for CORS errors in browser console
- Ensure authentication token is valid

### Styling issues
- Clear `.next` build cache
- Reinstall Tailwind CSS
- Rebuild with `npm run build`

## 📄 License

EL SPACE © 2024. All rights reserved.

## 🤝 Support

For issues or questions:
- Open an issue on GitHub
- Contact: support@elspace.io
