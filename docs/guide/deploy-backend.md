# Deploy Backend

This guide covers deploying the Peerpay Ledger Backend API to production environments.

## Prerequisites

Before deploying, ensure you have:

- ✅ Backend code tested and working locally
- ✅ MongoDB database (local or cloud)
- ✅ Environment variables configured
- ✅ Domain name (optional but recommended)
- ✅ SSL certificate (for HTTPS)

## Deployment Options

### 1. Railway (Recommended)

Railway provides easy deployment with automatic HTTPS and MongoDB integration.

#### Steps

1. **Create Railway Account**
   - Visit [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login
   railway login
   
   # Initialize project
   railway init
   ```

3. **Add MongoDB**
   - Go to Railway dashboard
   - Click "New" → "Database" → "MongoDB"
   - Copy connection string

4. **Configure Environment**
   ```bash
   # Set environment variables
   railway variables set MONGODB_URI="your_mongodb_uri"
   railway variables set JWT_SECRET="your_jwt_secret"
   railway variables set JWT_REFRESH_SECRET="your_refresh_secret"
   ```

5. **Deploy**
   ```bash
   # Deploy from GitHub
   railway up
   
   # Or deploy from local
   railway up --detach
   ```

6. **Get URL**
   - Railway will provide a public URL
   - Configure custom domain if needed

### 2. Render

Free tier available with automatic deployments.

#### Steps

1. **Create Render Account**
   - Visit [render.com](https://render.com)
   - Sign up with GitHub

2. **Create Web Service**
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Select backend directory

3. **Configure Build**
   ```
   Build Command: npm install && npm run build
   Start Command: npm run start:prod
   ```

4. **Add Environment Variables**
   ```
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   JWT_REFRESH_SECRET=your_refresh_secret
   PORT=3000
   NODE_ENV=production
   ```

5. **Deploy**
   - Render will auto-deploy on git push
   - Get your service URL

### 3. Heroku

Popular platform with easy setup.

#### Steps

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   heroku login
   ```

2. **Create Heroku App**
   ```bash
   cd backend
   heroku create peerpay-api
   ```

3. **Add MongoDB**
   ```bash
   heroku addons:create mongolab:sandbox
   ```

4. **Set Environment Variables**
   ```bash
   heroku config:set JWT_SECRET="your_secret"
   heroku config:set JWT_REFRESH_SECRET="your_refresh_secret"
   heroku config:set NODE_ENV=production
   ```

5. **Deploy**
   ```bash
   git push heroku main
   ```

6. **Open App**
   ```bash
   heroku open
   ```

### 4. DigitalOcean App Platform

Managed platform with good pricing.

#### Steps

1. **Create DigitalOcean Account**
   - Visit [digitalocean.com](https://www.digitalocean.com)
   - Create account

2. **Create App**
   - Go to Apps → Create App
   - Connect GitHub repository
   - Select backend directory

3. **Configure**
   ```
   Build Command: npm install && npm run build
   Run Command: npm run start:prod
   ```

4. **Add Database**
   - Add MongoDB database component
   - Or use external MongoDB Atlas

5. **Set Environment Variables**
   - Add all required env vars in dashboard

6. **Deploy**
   - Click "Deploy"
   - Get app URL

### 5. AWS (Advanced)

For full control and scalability.

#### Using AWS Elastic Beanstalk

1. **Install EB CLI**
   ```bash
   pip install awsebcli
   ```

2. **Initialize**
   ```bash
   cd backend
   eb init -p node.js peerpay-api
   ```

3. **Create Environment**
   ```bash
   eb create peerpay-production
   ```

4. **Set Environment Variables**
   ```bash
   eb setenv MONGODB_URI="your_uri" JWT_SECRET="your_secret"
   ```

5. **Deploy**
   ```bash
   eb deploy
   ```

#### Using AWS EC2 (Manual)

1. **Launch EC2 Instance**
   - Ubuntu 22.04 LTS
   - t2.micro or larger
   - Configure security groups (ports 22, 80, 443, 3000)

2. **Connect to Instance**
   ```bash
   ssh -i your-key.pem ubuntu@your-instance-ip
   ```

3. **Install Dependencies**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   
   # Install PM2
   sudo npm install -g pm2
   
   # Install MongoDB (optional)
   # Or use MongoDB Atlas
   ```

4. **Clone Repository**
   ```bash
   git clone https://github.com/Celestial-0/Peerpay.git
   cd Peerpay/backend
   npm install
   npm run build
   ```

5. **Configure Environment**
   ```bash
   nano .env
   # Add your environment variables
   ```

6. **Start with PM2**
   ```bash
   pm2 start dist/main.js --name peerpay-api
   pm2 save
   pm2 startup
   ```

7. **Setup Nginx (Optional)**
   ```bash
   sudo apt install nginx
   sudo nano /etc/nginx/sites-available/peerpay
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
   sudo ln -s /etc/nginx/sites-available/peerpay /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

8. **Setup SSL with Let's Encrypt**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

### 6. Docker Deployment

Deploy using Docker containers.

#### Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

#### Create docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - NODE_ENV=production
    depends_on:
      - mongodb
    restart: unless-stopped

  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped

volumes:
  mongodb_data:
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

## Database Setup

### MongoDB Atlas (Recommended)

1. **Create Account**
   - Visit [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for free

2. **Create Cluster**
   - Choose free tier (M0)
   - Select region closest to your app
   - Create cluster

3. **Configure Access**
   - Database Access → Add user
   - Network Access → Add IP (0.0.0.0/0 for all)

4. **Get Connection String**
   - Click "Connect"
   - Choose "Connect your application"
   - Copy connection string
   - Replace `<password>` with your password

5. **Use in App**
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/peerpay?retryWrites=true&w=majority
   ```

## Environment Variables

Required environment variables for production:

```bash
# Database
MONGODB_URI=your_mongodb_connection_string

# JWT Secrets
JWT_SECRET=your_very_secure_secret_key_min_32_chars
JWT_REFRESH_SECRET=your_very_secure_refresh_secret_min_32_chars

# App Configuration
NODE_ENV=production
PORT=3000

# CORS (optional)
CORS_ORIGIN=https://your-frontend-domain.com

# Optional
LOG_LEVEL=info
```

## Post-Deployment

### 1. Test API

```bash
# Health check
curl https://your-api-url.com/health

# Test auth
curl -X POST https://your-api-url.com/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'
```

### 2. Monitor Application

- Set up error tracking (Sentry)
- Configure logging (Winston, Logtail)
- Monitor uptime (UptimeRobot, Pingdom)
- Track performance (New Relic, DataDog)

### 3. Setup CI/CD

#### GitHub Actions Example

```yaml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'

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
          cd backend
          npm ci
      
      - name: Run tests
        run: |
          cd backend
          npm run test
      
      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway up --detach
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### 4. Security Checklist

- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Input validation active
- [ ] MongoDB secured
- [ ] Secrets rotated regularly
- [ ] Logs monitored
- [ ] Backups configured

## Troubleshooting

### App won't start

```bash
# Check logs
railway logs
# or
heroku logs --tail
# or
pm2 logs
```

### Database connection fails

- Verify MongoDB URI is correct
- Check network access in MongoDB Atlas
- Ensure IP is whitelisted

### Port issues

- Ensure PORT env var is set
- Check if port is available
- Verify firewall rules

### Memory issues

- Increase instance size
- Optimize queries
- Add caching
- Use connection pooling

## Scaling

### Horizontal Scaling

- Deploy multiple instances
- Use load balancer
- Session management (Redis)
- Database replication

### Vertical Scaling

- Increase instance resources
- Optimize code
- Database indexing
- Caching strategy

## Backup Strategy

```bash
# MongoDB backup
mongodump --uri="your_mongodb_uri" --out=/backup/$(date +%Y%m%d)

# Automated backups
# Use MongoDB Atlas automated backups
# Or setup cron job for mongodump
```

## Resources

- [NestJS Production Guide](https://docs.nestjs.com/recipes/deployment)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Railway Documentation](https://docs.railway.app/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)

---

Next: [Deploy Mobile App](/guide/deploy-mobile) | [Deploy Dashboard](/guide/deploy-dashboard)
