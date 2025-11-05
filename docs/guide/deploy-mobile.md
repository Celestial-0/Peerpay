# Deploy Mobile App

This guide covers building and deploying the Peerpay Ledger Mobile App to iOS App Store and Google Play Store.

## Prerequisites

- ✅ Expo account ([expo.dev](https://expo.dev))
- ✅ Apple Developer account ($99/year) for iOS
- ✅ Google Play Developer account ($25 one-time) for Android
- ✅ EAS CLI installed
- ✅ App tested on physical devices
- ✅ Backend API deployed and accessible

## Setup

### 1. Install EAS CLI

```bash
npm install -g eas-cli
```

### 2. Login to Expo

```bash
eas login
```

### 3. Configure Project

```bash
cd mobile
eas build:configure
```

This creates `eas.json`:

```json
{
  "cli": {
    "version": ">= 5.2.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

## Environment Configuration

### Create Production Environment

Create `.env.production`:

```bash
API_BASE_URL=https://your-api-domain.com
WS_URL=wss://your-api-domain.com
EXPO_PUBLIC_API_KEY=your_production_api_key
```

### Update app.json

```json
{
  "expo": {
    "name": "Peerpay Ledger",
    "slug": "peerpay-ledger",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.peerpay.ledger",
      "buildNumber": "1",
      "infoPlist": {
        "NSFaceIDUsageDescription": "Use Face ID for quick and secure login"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.peerpay.ledger",
      "versionCode": 1,
      "permissions": [
        "USE_BIOMETRIC",
        "USE_FINGERPRINT"
      ]
    },
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

## Build for iOS

### 1. Prepare Assets

Ensure you have:
- **App Icon** - 1024x1024px PNG
- **Splash Screen** - 2048x2048px PNG
- **Screenshots** - Various sizes for App Store

### 2. Build for iOS

```bash
# Development build
eas build --profile development --platform ios

# Production build
eas build --profile production --platform ios
```

### 3. Configure iOS Credentials

EAS will prompt you to:
- Create or use existing Apple Developer account
- Generate distribution certificate
- Create provisioning profile
- Configure push notification keys

### 4. Submit to App Store

```bash
eas submit --platform ios
```

You'll need:
- Apple ID
- App-specific password
- App Store Connect API key (recommended)

### 5. App Store Connect

1. **Create App**
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - Click "My Apps" → "+" → "New App"
   - Fill in app information

2. **App Information**
   - Name: Peerpay Ledger
   - Category: Finance
   - Age Rating: 4+

3. **Pricing**
   - Set to Free

4. **App Privacy**
   - Fill out privacy questionnaire
   - Data collection disclosure

5. **Screenshots**
   - Upload for all required sizes
   - 6.5" iPhone (1284x2778)
   - 5.5" iPhone (1242x2208)
   - iPad Pro (2048x2732)

6. **Description**
   ```
   Peerpay Ledger - Simplify peer-to-peer lending and borrowing
   
   Track money lent to and borrowed from friends with confidence. 
   Eliminate awkward conversations and forgotten debts through 
   real-time tracking and smart settlements.
   
   Features:
   • Track money lent and borrowed
   • Real-time notifications
   • Secure authentication with Face ID
   • Transaction history
   • Friend management
   • Balance summaries
   
   Perfect for managing shared expenses, group trips, and 
   personal loans between friends.
   ```

7. **Keywords**
   ```
   money, lending, borrowing, friends, finance, ledger, tracking, debt, loan, expense
   ```

8. **Submit for Review**
   - Add build from EAS
   - Submit for review
   - Wait for approval (1-3 days)

## Build for Android

### 1. Prepare Assets

Ensure you have:
- **App Icon** - 512x512px PNG
- **Feature Graphic** - 1024x500px PNG
- **Screenshots** - At least 2 screenshots

### 2. Build for Android

```bash
# Development build
eas build --profile development --platform android

# Production build (AAB for Play Store)
eas build --profile production --platform android
```

### 3. Configure Android Credentials

EAS will:
- Generate keystore automatically
- Or use existing keystore

### 4. Submit to Play Store

```bash
eas submit --platform android
```

You'll need:
- Google Play Console account
- Service account JSON key

### 5. Google Play Console

1. **Create App**
   - Go to [Google Play Console](https://play.google.com/console)
   - Click "Create app"
   - Fill in app details

2. **App Information**
   - Name: Peerpay Ledger
   - Category: Finance
   - Tags: Finance, Money Management

3. **Store Listing**
   - Short description (80 chars):
     ```
     Track money lent and borrowed from friends. Simple, secure, transparent.
     ```
   
   - Full description (4000 chars):
     ```
     Peerpay Ledger - Your Personal Finance Tracker for Friends
     
     Simplify peer-to-peer lending and borrowing with Peerpay Ledger. 
     Keep track of money you've lent to friends and borrowed from them, 
     all in one secure, easy-to-use app.
     
     KEY FEATURES:
     
     💰 Money Tracking
     • Record money lent to friends
     • Track money borrowed from friends
     • View real-time balance updates
     • See net balance at a glance
     
     👥 Friend Management
     • Send and accept friend requests
     • View friend online status
     • Manage friend connections
     • See transaction history per friend
     
     🔔 Real-time Notifications
     • Instant transaction updates
     • Friend request notifications
     • Balance change alerts
     • Push notifications
     
     🔐 Security & Privacy
     • Secure authentication
     • Biometric login (fingerprint/face)
     • Encrypted data storage
     • Privacy-focused design
     
     📊 Transaction Management
     • Two-phase approval system
     • Accept or reject transactions
     • Add remarks and notes
     • Complete transaction history
     • Filter and search
     
     WHY PEERPAY LEDGER?
     
     ✓ Transparency - Both parties agree on every transaction
     ✓ No Awkwardness - Clear records eliminate uncomfortable conversations
     ✓ Always Updated - Real-time sync across all devices
     ✓ Simple & Intuitive - Easy to use for everyone
     ✓ Secure - Your data is protected
     
     PERFECT FOR:
     • Shared expenses with roommates
     • Group trip settlements
     • Personal loans between friends
     • Splitting bills and costs
     • Tracking informal debts
     
     Download Peerpay Ledger today and take control of your 
     peer-to-peer finances!
     ```

4. **Graphics**
   - Upload app icon
   - Upload feature graphic
   - Upload screenshots (phone and tablet)

5. **Content Rating**
   - Complete questionnaire
   - Should be rated Everyone

6. **Pricing & Distribution**
   - Set to Free
   - Select countries
   - Accept terms

7. **App Content**
   - Privacy policy URL
   - Ads declaration (No ads)
   - Target audience
   - Data safety

8. **Release**
   - Create production release
   - Upload AAB from EAS
   - Add release notes
   - Submit for review

## Over-The-Air (OTA) Updates

EAS Update allows you to push updates without app store review.

### 1. Configure EAS Update

```bash
eas update:configure
```

### 2. Publish Update

```bash
# Publish to production
eas update --branch production --message "Bug fixes and improvements"
```

### 3. Auto-Update in App

Updates are downloaded automatically when app starts.

**Limitations:**
- Can't update native code
- Can't change app.json config
- Only JavaScript/assets

## Testing Before Release

### TestFlight (iOS)

```bash
# Build for internal testing
eas build --profile preview --platform ios
```

1. Upload to TestFlight
2. Add internal testers
3. Distribute build
4. Collect feedback

### Internal Testing (Android)

```bash
# Build for internal testing
eas build --profile preview --platform android
```

1. Create internal testing track
2. Upload APK/AAB
3. Add testers by email
4. Distribute build

## App Store Optimization (ASO)

### Keywords Research
- Use App Store optimization tools
- Research competitor keywords
- Target relevant finance keywords

### Screenshots Best Practices
- Show key features
- Use device frames
- Add captions
- Highlight benefits
- Use consistent branding

### App Preview Video (Optional)
- 15-30 seconds
- Show app in action
- Highlight key features
- No audio required

## Monitoring & Analytics

### 1. Expo Analytics

```bash
# View analytics
eas analytics
```

### 2. Firebase Analytics

```bash
# Install Firebase
expo install @react-native-firebase/app @react-native-firebase/analytics
```

### 3. Sentry (Error Tracking)

```bash
# Install Sentry
expo install sentry-expo
```

## Version Management

### Increment Version

Update `app.json`:

```json
{
  "expo": {
    "version": "1.0.1",
    "ios": {
      "buildNumber": "2"
    },
    "android": {
      "versionCode": 2
    }
  }
}
```

### Semantic Versioning

- **Major** (1.0.0): Breaking changes
- **Minor** (1.1.0): New features
- **Patch** (1.0.1): Bug fixes

## Post-Launch

### 1. Monitor Reviews
- Respond to user reviews
- Address common issues
- Gather feedback

### 2. Track Metrics
- Downloads
- Active users
- Retention rate
- Crash rate

### 3. Iterate
- Fix bugs quickly
- Add requested features
- Improve UX based on feedback

## Troubleshooting

### Build Fails

```bash
# Clear cache
eas build:clear-cache

# Retry build
eas build --profile production --platform ios --clear-cache
```

### Submission Rejected

Common reasons:
- Missing privacy policy
- Incomplete app information
- Guideline violations
- Crashes on review

### OTA Update Not Working

- Check branch name
- Verify app is configured for updates
- Check network connectivity
- Review update logs

## Checklist

### Pre-Launch
- [ ] App tested on real devices
- [ ] All features working
- [ ] No critical bugs
- [ ] Backend API stable
- [ ] Privacy policy created
- [ ] Terms of service created
- [ ] App icons and screenshots ready
- [ ] Store listings written
- [ ] Developer accounts active

### Launch
- [ ] Build uploaded
- [ ] Store listing complete
- [ ] Submitted for review
- [ ] Monitoring configured
- [ ] Support email setup

### Post-Launch
- [ ] Monitor crash reports
- [ ] Respond to reviews
- [ ] Track analytics
- [ ] Plan updates
- [ ] Gather user feedback

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [EAS Submit](https://docs.expo.dev/submit/introduction/)
- [App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Play Store Guidelines](https://play.google.com/about/developer-content-policy/)

---

Next: [Deploy Dashboard](/guide/deploy-dashboard) | [Backend Deployment](/guide/deploy-backend)
