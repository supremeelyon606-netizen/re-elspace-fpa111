# EL SPACE

<div align="center">
  <img src="public/logo.svg" alt="EL SPACE Logo" width="200" />
  <p><strong>Freelance Without the Friction.</strong></p>
</div>

## 🚀 Overview

EL SPACE is a curated freelance marketplace by EL VERSE TECHNOLOGIES. We connect vetted freelancers with premium clients, offering industry-low fees (3-7%) and instant payouts.

### Key Features

- ✅ **Vetted Talent** - Every freelancer is portfolio-reviewed
- ✅ **Escrow Protection** - Funds held securely until milestones are approved
- ✅ **Instant Pay** - Freelancers can withdraw earnings today (5% fee)
- ✅ **Daily Standups** - Slack integration keeps projects on track
- ✅ **1v1 Sessions** - Paid and free consultations with video calls
- ✅ **Communities** - Niche-specific groups for networking
- ✅ **Social Feed** - Share wins, ask questions, connect
- ✅ **Internal Wallet** - Seamless transfers between users
- ✅ **Dispute Resolution** - Fair mediation for conflicts

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Next.js API Routes, Node.js |
| Database | PostgreSQL, Prisma ORM |
| Cache | Redis |
| Real-time | Socket.io |
| Video | Daily.co |
| Payments | Korapay, PayPal |
| Storage | Cloudinary, Uploadthing |
| Email | Nodemailer, Resend |
| Analytics | PostHog, Mixpanel |
| Deployment | Vercel, Docker |

## 📦 Installation

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- npm or yarn

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/elverse/elspace.git
cd elspace
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

4. **Start Docker services (PostgreSQL, Redis, MinIO, MailHog)**
```bash
npm run docker:up
```

5. **Run database migrations**
```bash
npm run db:push
npm run db:seed
```

6. **Start the development server**
```bash
npm run dev
```

7. **Open http://localhost:3000**

### Docker Development

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop all services
docker-compose down
```

## 📁 Project Structure

```
elspace/
├── client/
│   ├── src/
│   │   ├── app/              # Next.js App Router
│   │   │   ├── (auth)/       # Authentication pages
│   │   │   ├── (main)/       # Authenticated pages
│   │   │   └── api/          # API routes
│   │   ├── components/       # React components
│   │   ├── lib/              # Utilities
│   │   ├── hooks/            # Custom hooks
│   │   └── types/            # TypeScript types
│   └── public/               # Static assets
├── server/
│   └── src/
│       ├── modules/          # Feature modules
│       ├── database/         # Prisma schema
│       └── websocket/        # Socket.io server
├── docker-compose.yml
└── package.json
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📦 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

```bash
# Manual deploy
vercel --prod
```

### Docker Production

```bash
# Build production image
docker build -t elspace:latest .

# Run container
docker run -p 3000:3000 --env-file .env.production elspace:latest
```

## 🔧 Database Management

```bash
# Open Prisma Studio
npm run db:studio

# Create migration
npm run db:migrate

# Apply migrations
npm run db:deploy

# Seed database
npm run db:seed

# Reset database
npm run db:push -- --force-reset
```

## 📊 Monitoring

- **Health Check**: `/api/health`
- **Metrics**: PostHog Dashboard
- **Logs**: Vercel Logs / Docker logs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

Copyright © 2026 EL VERSE TECHNOLOGIES. All rights reserved.

## 📞 Contact

- Website: [elspace.tech](https://elspace.tech)
- Email: hello@elspace.tech
- Twitter: [@elversetech](https://twitter.com/elversetech)
- LinkedIn: [EL VERSE TECHNOLOGIES](https://linkedin.com/company/elverse)
