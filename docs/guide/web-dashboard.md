# Web Dashboard

## Overview

The Peerpay Ledger Web Dashboard is a powerful web-based interface built with **Next.js**, **React**, and **TypeScript**. It provides users with comprehensive tools for managing their finances, monitoring transactions, analyzing data, and viewing detailed insights into their lending and borrowing activities.

## Technology Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 16** | React framework with App Router |
| **TypeScript** | Type-safe development |
| **TailwindCSS** | Utility-first CSS framework |
| **shadcn/ui** | Beautiful UI component library |
| **Recharts** | Data visualization and charts |
| **Tanstack Table** | Advanced data tables |
| **Tanstack Query** | Server state management |
| **Zustand** | Client state management |
| **Axios** | HTTP client for API calls |
| **Socket.IO Client** | Real-time WebSocket communication |
| **NextAuth.js** | Authentication for admins |
| **Zod** | Schema validation |
| **React Hook Form** | Form management |

## Key Features

### 🔐 Authentication

#### Secure Access
- Secure login portal
- Session management
- JWT token authentication
- Activity logging
- Auto-logout on inactivity

### 📊 Dashboard Overview

#### Personal Analytics Summary
- **Total Lent** - Total amount lent to friends
- **Total Borrowed** - Total amount borrowed from friends
- **Net Balance** - Overall financial position
- **Active Transactions** - Pending transactions
- **Friends Count** - Number of connected friends
- **Recent Activity** - Latest transactions and updates

#### Visual Charts
- Transaction history over time (line chart)
- Lending vs borrowing trends (area chart)
- Transaction type distribution (pie chart)
- Balance per friend (bar chart)
- Monthly spending patterns
- Daily/weekly/monthly comparisons

#### Quick Stats Cards
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Total Lent     │  │  Total Borrowed │  │  Net Balance    │
│    $5,430       │  │     $2,150      │  │   +$3,280       │
│  ↑ 12.5%       │  │  ↑ 8.3%        │  │  ↑ 15.2%       │
└─────────────────┘  └─────────────────┘  └─────────────────┘

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Friends        │  │  Pending Txns   │  │  This Month     │
│       24        │  │        3        │  │     $1,250      │
│  ↑ 2          │  │  ↓ 1           │  │  ↑ $320        │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### 👥 Friends Management

#### Friends List
- **Advanced Table** with sorting, filtering, pagination
- **Search** by name, email
- **Filters** by balance, activity, status
- **Quick Actions** - View transactions, send money
- **Export** to CSV/Excel

#### Friend Details
- Complete profile information
- Balance with this friend
- Transaction history together
- Activity timeline
- Contact information

#### Friend Actions
- **View Profile** - Detailed friend information
- **View Transactions** - All transactions with friend
- **Create Transaction** - New lending/borrowing entry
- **Settlement** - Mark debts as settled
- **Remove Friend** - Disconnect from friend

#### Friend Analytics
- Transaction patterns per friend
- Balance trends over time
- Most active friends
- Settlement history

### 💰 Transaction Management

#### Transaction List
- **Real-time Updates** - Live transaction feed
- **Advanced Filters** - By type, status, amount, date, friend
- **Search** - By friend name, transaction ID
- **Sort** - By any column
- **Pagination** - Handle large datasets

#### Transaction Details
- Complete transaction information
- Friend details
- Amount and type (lent/borrowed)
- Status and timeline
- Remarks and notes
- Created and updated dates

#### Transaction Actions
- **View Details** - Full transaction information
- **Accept/Reject** - Approve or decline pending transactions
- **Add Notes** - Personal notes and remarks
- **Edit** - Modify pending transactions
- **Delete** - Remove transactions
- **Export** - Download transaction data

#### Transaction Analytics
- Volume trends over time
- Average transaction size
- Lending vs borrowing patterns
- Monthly spending analysis
- Transaction success rate
- Settlement tracking

### 🔔 Notification Center

#### Personal Notifications
- Friend request alerts
- Transaction updates
- Payment reminders
- Balance change notifications
- Friend activity updates

#### Notification Management
- **Mark as Read** - Individual or bulk
- **Delete** - Remove notifications
- **Filter** - By type, date, read status
- **Settings** - Configure notification preferences
- **History** - View all past notifications

### 📈 Analytics & Insights

#### Personal Reports
- **Lending Report** - Money lent analysis
- **Borrowing Report** - Money borrowed tracking
- **Balance Report** - Net balance trends
- **Friend Activity** - Transaction patterns with friends
- **Monthly Summary** - Month-over-month comparison
- **Settlement Report** - Debt settlement tracking

#### Custom Reports
- **Report Builder** - Create custom views
- **Data Filters** - Filter by date, friend, amount
- **Visualization Options** - Charts and graphs
- **Export Formats** - PDF, CSV, Excel
- **Date Ranges** - Custom time periods
- **Share Reports** - Download or print

#### Data Visualization
- Interactive charts and graphs
- Drill-down by friend or time period
- Date range selection
- Comparison views (month, year)
- Export to image

### ⚙️ Settings

#### Profile Settings
- Personal information
- Profile picture
- Contact details
- Timezone and locale
- Currency preferences
- Date/time formats

#### Security Settings
- Change password
- Session management
- Two-factor authentication
- Active sessions
- Login history
- Security alerts

#### Notification Settings
- Email notifications
- Push notifications
- Notification preferences by type
- Quiet hours
- Frequency settings

#### Privacy Settings
- Profile visibility
- Data sharing preferences
- Export personal data
- Delete account
- Privacy policy

### 🛡️ Security & Privacy

#### Activity Logs
- Login history
- Transaction history
- Profile changes
- Security events
- Session activity

#### Security Features
- Failed login tracking
- Session management
- Secure authentication
- Data encryption
- Privacy controls

#### Data Management
- Export personal data (GDPR)
- Delete account and data
- Privacy policy
- Terms of service
- Data retention settings

### 💬 Support

#### Help Center
- FAQs and guides
- Contact support
- Report issues
- Feature requests
- Documentation

#### Account Support
- Account recovery
- Password reset
- Profile issues
- Transaction disputes
- Technical support

## User Interface

### Design System

#### Layout
- **Sidebar Navigation** - Main menu
- **Top Bar** - User profile, notifications, search
- **Content Area** - Main dashboard content
- **Breadcrumbs** - Navigation trail
- **Footer** - Links and copyright

#### Components
- **Data Tables** - Advanced sortable tables
- **Charts** - Interactive visualizations
- **Cards** - Information containers
- **Modals** - Overlay dialogs
- **Forms** - Input forms with validation
- **Alerts** - Success, error, warning messages
- **Badges** - Status indicators
- **Tooltips** - Helpful hints

#### Theme
- **Light Mode** - Default theme
- **Dark Mode** - Eye-friendly dark theme
- **Custom Themes** - Brand customization
- **Responsive Design** - Mobile-friendly

### Navigation Structure

```
Dashboard
├── Overview
├── Friends
│   ├── All Friends
│   ├── Friend Requests
│   ├── Add Friend
│   └── Friend Details
├── Transactions
│   ├── All Transactions
│   ├── Lent
│   ├── Borrowed
│   ├── Pending
│   └── Create Transaction
├── Analytics
│   ├── Balance Trends
│   ├── Transaction Analytics
│   ├── Friend Analytics
│   └── Custom Reports
├── Notifications
│   ├── All Notifications
│   ├── Unread
│   └── Settings
└── Settings
    ├── Profile
    ├── Security
    ├── Notifications
    ├── Privacy
    └── Support
```

## Development

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Backend API running

### Setup

```bash
# Navigate to dashboard directory
cd dashboard

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your settings

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

### Project Structure

```
dashboard/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes
│   ├── (dashboard)/       # Dashboard routes
│   ├── api/              # API routes
│   └── layout.tsx        # Root layout
├── components/           # React components
│   ├── ui/              # shadcn/ui components
│   ├── charts/          # Chart components
│   ├── tables/          # Table components
│   └── forms/           # Form components
├── lib/                 # Utility functions
│   ├── api.ts          # API client
│   ├── auth.ts         # Auth utilities
│   └── utils.ts        # Helper functions
├── hooks/              # Custom React hooks
├── store/              # State management
├── types/              # TypeScript types
├── styles/             # Global styles
└── public/             # Static assets
```

### Environment Variables

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000

# Authentication
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your_secret_key

# Optional Analytics
ANALYTICS_ENABLED=true
```

## Features in Detail

### Real-time Dashboard

Live updates using WebSocket:

```typescript
// Real-time metrics update
- User count updates live
- Transaction feed in real-time
- Online users tracking
- System alerts
- Activity notifications
```

### Advanced Data Tables

Powerful table features:

- **Sorting** - Click column headers to sort
- **Filtering** - Filter by any column
- **Search** - Global and column search
- **Pagination** - Navigate large datasets
- **Column Visibility** - Show/hide columns
- **Export** - Download table data
- **Bulk Actions** - Select multiple rows

### Data Export

Export data in multiple formats:

```typescript
// Export options
- CSV - Comma-separated values
- Excel - .xlsx format
- PDF - Formatted reports
- JSON - Raw data
```

### Responsive Design

Optimized for all devices:

- **Desktop** - Full dashboard experience
- **Tablet** - Adapted layout
- **Mobile** - Mobile-friendly interface
- **Touch-friendly** - Large touch targets

## Security

### Authentication
- Secure user authentication
- Session-based authentication
- JWT token validation
- Biometric support (planned)
- Auto-logout on inactivity

### Authorization
- User-specific data access
- Privacy controls
- Action logging
- Secure sessions

### Data Protection
- HTTPS only
- CSRF protection
- XSS prevention
- SQL injection prevention
- Input sanitization

## Performance

### Optimization Techniques
- Server-side rendering (SSR)
- Static site generation (SSG)
- Incremental static regeneration (ISR)
- Image optimization
- Code splitting
- Lazy loading

### Caching
- API response caching
- Static asset caching
- Browser caching
- CDN integration

## Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Type checking
pnpm type-check

# Linting
pnpm lint
```

## Deployment

### Vercel (Recommended)

```bash
# Deploy to Vercel
vercel deploy

# Production deployment
vercel --prod
```

### Docker

```bash
# Build Docker image
docker build -t peerpay-dashboard .

# Run container
docker run -p 3001:3001 peerpay-dashboard
```

### Manual Deployment

```bash
# Build
pnpm build

# Start
pnpm start
```

## Monitoring

- **Error Tracking** - Sentry integration
- **Analytics** - Google Analytics
- **Performance** - Web Vitals monitoring
- **Uptime** - Status monitoring

## Future Features

- [ ] Advanced fraud detection with ML
- [ ] Automated report scheduling
- [ ] Custom dashboard widgets
- [ ] Multi-language support
- [ ] Advanced user segmentation
- [ ] A/B testing tools
- [ ] Revenue forecasting
- [ ] Mobile admin app

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [TailwindCSS](https://tailwindcss.com/docs)
- [Recharts](https://recharts.org/)

## Support

For issues or questions:
- Open an issue on [GitHub](https://github.com/Celestial-0/Peerpay/issues)
- Check the [Backend API](/backend/overview)
- Contact development team

---

Ready to deploy? Check out the [Deployment Guide](/guide/deploy-dashboard).
