# Deploy Dashboard

This guide covers deploying the Peerpay Ledger Web Dashboard to production.

## Prerequisites

- ✅ Dashboard code tested locally
- ✅ Backend API deployed and accessible
- ✅ Environment variables configured
- ✅ Domain name (optional)
- ✅ Git repository

## Deployment Options

### 1. Vercel (Recommended)

Vercel is the recommended platform for Next.js applications with zero-configuration deployments.

#### Steps

1. **Create Vercel Account**
   - Visit [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Import Project**
   - Click "New Project"
   - Import your GitHub repository
   - Select dashboard directory

3. **Configure Build**
   ```
   Framework Preset: Next.js
   Root Directory: dashboard
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

4. **Environment Variables**
   Add in Vercel dashboard:
   ```
   NEXT_PUBLIC_API_URL=https://your-api-domain.com
   NEXT_PUBLIC_WS_URL=wss://your-api-domain.com
   NEXTAUTH_URL=https://your-dashboard-domain.com
   NEXTAUTH_SECRET=your_nextauth_secret_min_32_chars
   ```

5. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy automatically
   - Get your deployment URL

6. **Custom Domain** (Optional)
   - Go to Project Settings → Domains
   - Add your custom domain
   - Configure DNS records

#### Automatic Deployments

Vercel automatically deploys:
- **Production**: Pushes to `main` branch
- **Preview**: Pull requests and other branches

### 2. Netlify

Another excellent option for Next.js apps.

#### Steps

1. **Create Netlify Account**
   - Visit [netlify.com](https://www.netlify.com)
   - Sign up with GitHub

2. **Import Project**
   - Click "Add new site" → "Import an existing project"
   - Connect GitHub repository
   - Select dashboard directory

3. **Build Settings**
   ```
   Base directory: dashboard
   Build command: npm run build
   Publish directory: .next
   ```

4. **Environment Variables**
   ```
   NEXT_PUBLIC_API_URL=https://your-api-domain.com
   NEXT_PUBLIC_WS_URL=wss://your-api-domain.com
   NEXTAUTH_URL=https://your-dashboard-domain.netlify.app
   NEXTAUTH_SECRET=your_nextauth_secret
   ```

5. **Deploy**
   - Click "Deploy site"
   - Wait for build to complete

6. **Custom Domain**
   - Site settings → Domain management
   - Add custom domain
   - Configure DNS

### 3. Railway

Simple deployment with good pricing.

#### Steps

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login**
   ```bash
   railway login
   ```

3. **Initialize Project**
   ```bash
   cd dashboard
   railway init
   ```

4. **Configure**
   ```bash
   # Set environment variables
   railway variables set NEXT_PUBLIC_API_URL="https://your-api.com"
   railway variables set NEXTAUTH_SECRET="your_secret"
   ```

5. **Deploy**
   ```bash
   railway up
   ```

6. **Get URL**
   - Railway provides a public URL
   - Configure custom domain if needed

### 4. DigitalOcean App Platform

Managed platform with predictable pricing.

#### Steps

1. **Create App**
   - Go to Apps → Create App
   - Connect GitHub repository
   - Select dashboard directory

2. **Configure**
   ```
   Build Command: npm run build
   Run Command: npm start
   HTTP Port: 3000
   ```

3. **Environment Variables**
   Add all required variables in dashboard

4. **Deploy**
   - Click "Deploy"
   - Monitor build progress

### 5. Docker Deployment

Deploy using Docker containers.

#### Create Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

#### Update next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // ... other config
}

module.exports = nextConfig
```

#### Create docker-compose.yml

```yaml
version: '3.8'

services:
  dashboard:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
      - NEXT_PUBLIC_WS_URL=${NEXT_PUBLIC_WS_URL}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    restart: unless-stopped
```

#### Deploy

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### 6. AWS (Advanced)

#### Using AWS Amplify

1. **Create Amplify App**
   - Go to AWS Amplify Console
   - Connect GitHub repository
   - Select dashboard directory

2. **Build Settings**
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - cd dashboard
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: dashboard/.next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

3. **Environment Variables**
   Add in Amplify console

4. **Deploy**
   - Amplify auto-deploys on git push

#### Using EC2 + Nginx

1. **Launch EC2 Instance**
   - Ubuntu 22.04 LTS
   - t2.small or larger
   - Configure security groups

2. **Install Dependencies**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   
   # Install PM2
   sudo npm install -g pm2
   ```

3. **Clone and Build**
   ```bash
   git clone https://github.com/Celestial-0/Peerpay.git
   cd Peerpay/dashboard
   npm install
   npm run build
   ```

4. **Configure Environment**
   ```bash
   nano .env.production
   # Add your environment variables
   ```

5. **Start with PM2**
   ```bash
   pm2 start npm --name "peerpay-dashboard" -- start
   pm2 save
   pm2 startup
   ```

6. **Setup Nginx**
   ```bash
   sudo apt install nginx
   sudo nano /etc/nginx/sites-available/dashboard
   ```
   
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   
   ```bash
   sudo ln -s /etc/nginx/sites-available/dashboard /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

7. **Setup SSL**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## Environment Variables

Required environment variables:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://your-api-domain.com
NEXT_PUBLIC_WS_URL=wss://your-api-domain.com

# NextAuth Configuration
NEXTAUTH_URL=https://your-dashboard-domain.com
NEXTAUTH_SECRET=your_very_secure_secret_min_32_chars

# Optional
NODE_ENV=production
```

## Build Optimization

### 1. Enable Compression

```javascript
// next.config.js
module.exports = {
  compress: true,
  // ...
}
```

### 2. Image Optimization

```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['your-api-domain.com'],
    formats: ['image/avif', 'image/webp'],
  },
}
```

### 3. Bundle Analysis

```bash
# Install analyzer
npm install @next/bundle-analyzer

# Analyze bundle
ANALYZE=true npm run build
```

## Performance Optimization

### 1. Enable Caching

```javascript
// next.config.js
module.exports = {
  headers: async () => [
    {
      source: '/:all*(svg|jpg|png)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ],
}
```

### 2. Use CDN

- Vercel automatically uses CDN
- For custom deployments, use Cloudflare or AWS CloudFront

### 3. Optimize Fonts

```javascript
// app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })
```

## Security

### 1. Security Headers

```javascript
// next.config.js
module.exports = {
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-DNS-Prefetch-Control',
          value: 'on'
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload'
        },
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN'
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        {
          key: 'Referrer-Policy',
          value: 'origin-when-cross-origin'
        }
      ]
    }
  ]
}
```

### 2. Environment Variables

- Never commit `.env` files
- Use platform-specific secret management
- Rotate secrets regularly

### 3. Authentication

- Use strong NEXTAUTH_SECRET
- Enable HTTPS only
- Configure session timeout

## Monitoring

### 1. Vercel Analytics

```bash
npm install @vercel/analytics
```

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### 2. Error Tracking (Sentry)

```bash
npm install @sentry/nextjs
```

```bash
npx @sentry/wizard@latest -i nextjs
```

### 3. Performance Monitoring

- Use Vercel Speed Insights
- Monitor Core Web Vitals
- Track page load times

## CI/CD

### GitHub Actions

```yaml
name: Deploy Dashboard

on:
  push:
    branches: [main]
    paths:
      - 'dashboard/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd dashboard
          npm ci
      
      - name: Build
        run: |
          cd dashboard
          npm run build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.API_URL }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: ./dashboard
```

## Testing Before Deploy

```bash
# Build locally
npm run build

# Test production build
npm start

# Run tests
npm test

# Type check
npm run type-check

# Lint
npm run lint
```

## Post-Deployment

### 1. Verify Deployment

- [ ] Dashboard loads correctly
- [ ] API connection works
- [ ] Authentication functional
- [ ] All pages accessible
- [ ] No console errors

### 2. Monitor Logs

```bash
# Vercel
vercel logs

# Railway
railway logs

# PM2
pm2 logs peerpay-dashboard
```

### 3. Performance Check

- Run Lighthouse audit
- Check Core Web Vitals
- Test on different devices
- Verify load times

## Troubleshooting

### Build Fails

```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

### Environment Variables Not Working

- Ensure variables start with `NEXT_PUBLIC_` for client-side
- Rebuild after changing variables
- Check variable names match exactly

### 404 Errors

- Verify routing configuration
- Check `next.config.js` settings
- Ensure all pages are exported

## Checklist

- [ ] Environment variables configured
- [ ] Build succeeds locally
- [ ] All tests passing
- [ ] Security headers configured
- [ ] SSL/HTTPS enabled
- [ ] Custom domain configured
- [ ] Monitoring setup
- [ ] Error tracking enabled
- [ ] Performance optimized
- [ ] Backup strategy in place

## Resources

- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Security Best Practices](https://nextjs.org/docs/advanced-features/security-headers)

---

Previous: [Deploy Backend](/guide/deploy-backend) | [Deploy Mobile](/guide/deploy-mobile)
