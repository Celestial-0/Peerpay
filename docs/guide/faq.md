# Frequently Asked Questions

Common questions and answers about Peerpay Ledger.

---

## General

### What is Peerpay Ledger?

Peerpay Ledger is a peer-to-peer money lending and borrowing platform that helps friends track their financial transactions. It provides a mobile app for users and a web dashboard for administrators.

### Is Peerpay Ledger free to use?

Yes, Peerpay Ledger is open-source and free to use. You can self-host it or contribute to the project.

### What platforms are supported?

- **Mobile:** iOS and Android (React Native)
- **Web:** Modern browsers (Chrome, Firefox, Safari, Edge)
- **Backend:** Cross-platform (Node.js)

---

## Getting Started

### How do I set up Peerpay Ledger?

Follow our [Quick Start Guide](/guide/quick-start) for step-by-step instructions.

### What are the system requirements?

**For Development:**
- Node.js 18+
- MongoDB 6.0+
- npm or yarn
- Git

**For Production:**
- VPS or cloud hosting (AWS, DigitalOcean, etc.)
- MongoDB Atlas or self-hosted MongoDB
- Domain name (optional)

### Do I need coding knowledge to use it?

- **As a user:** No coding knowledge required
- **For deployment:** Basic command-line knowledge helpful
- **For development:** JavaScript/TypeScript knowledge required

---

## Features

### Can I track multiple transactions with the same friend?

Yes! You can have unlimited transactions with each friend. The app shows a running balance and transaction history.

### Does it support group transactions?

Currently, Peerpay Ledger supports peer-to-peer transactions only. Group transactions are planned for future releases.

### Can I set reminders for payments?

Yes, the notification system can send reminders for pending transactions.

### Is there a transaction limit?

No built-in transaction limits. You can configure limits in the backend if needed.

---

## Security & Privacy

### Is my data secure?

Yes! Peerpay Ledger uses:
- JWT authentication
- Password hashing with bcrypt
- HTTPS encryption (in production)
- MongoDB security best practices

### Who can see my transactions?

Only you and the friend involved in a transaction can see it. Admins have access to all data for moderation purposes.

### Can I delete my account?

Yes, you can request account deletion through the app. This will remove all your data from the system.

### How is my password stored?

Passwords are hashed using bcrypt with salt rounds before storage. Plain text passwords are never stored.

---

## Technical

### What database does it use?

MongoDB with TypeORM for object-relational mapping.

### Can I use a different database?

The current implementation is MongoDB-specific. Migrating to other databases would require code changes.

### Does it support real-time updates?

Yes! The backend uses WebSocket (Socket.IO) for real-time notifications and updates.

### Can I customize the UI?

Yes, the frontend code is open-source. You can modify colors, layouts, and features.

### How do I add new features?

1. Fork the repository
2. Create a feature branch
3. Implement your feature
4. Submit a pull request

See our [Contributing Guide](/contributing) for details.

---

## Deployment

### Where can I deploy Peerpay Ledger?

- **Backend:** Any Node.js hosting (Heroku, DigitalOcean, AWS, Railway)
- **Database:** MongoDB Atlas, self-hosted MongoDB
- **Mobile App:** App Store, Google Play Store
- **Web Dashboard:** Vercel, Netlify, GitHub Pages

### How much does hosting cost?

**Free Tier Options:**
- MongoDB Atlas: 512MB free
- Railway: $5/month credit
- Vercel/Netlify: Free for static sites

**Paid Options:**
- VPS: $5-20/month
- MongoDB Atlas: $9+/month
- App Store: $99/year
- Google Play: $25 one-time

### Do I need a domain name?

Not required, but recommended for production. You can use:
- Free subdomains from hosting providers
- Custom domain ($10-15/year)

### How do I update to the latest version?

```bash
git pull origin main
npm install
npm run build
```

See [Deployment Guides](/guide/deploy-backend) for platform-specific instructions.

---

## Troubleshooting

### The app won't connect to the backend

1. Check backend is running
2. Verify API URL in app config
3. Check firewall/network settings
4. Ensure CORS is configured correctly

### I forgot my password

Use the "Forgot Password" feature in the app, or contact an administrator to reset it.

### Transactions aren't syncing

1. Check internet connection
2. Verify WebSocket connection
3. Try logging out and back in
4. Check backend logs for errors

### The build fails

1. Clear node_modules: `rm -rf node_modules && npm install`
2. Check Node.js version: `node --version`
3. Update dependencies: `npm update`
4. Check for error messages in build logs

---

## Contributing

### How can I contribute?

- Report bugs via [GitHub Issues](https://github.com/Celestial-0/Peerpay/issues)
- Submit feature requests
- Contribute code via pull requests
- Improve documentation
- Help other users

### What should I know before contributing?

- TypeScript/JavaScript
- NestJS (backend)
- React Native (mobile)
- React (web dashboard)
- MongoDB basics

See our [Contributing Guide](/contributing) for coding standards and workflow.

### Where can I get help?

- [GitHub Discussions](https://github.com/Celestial-0/Peerpay/discussions)
- [GitHub Issues](https://github.com/Celestial-0/Peerpay/issues)
- Documentation: [https://celestial-0.github.io/Peerpay/](https://celestial-0.github.io/Peerpay/)

---

## Roadmap

### What features are planned?

- Group transactions
- Multiple currencies
- Receipt uploads
- Payment integrations
- Analytics dashboard
- Mobile notifications
- Dark mode improvements

### When will feature X be released?

Check our [GitHub Projects](https://github.com/Celestial-0/Peerpay/projects) for the development roadmap and timeline.

---

## Still Have Questions?

- Check the [Documentation](/guide/introduction)
- Search [GitHub Issues](https://github.com/Celestial-0/Peerpay/issues)
- Open a new issue
- Contact: yashkumarsingh@ieee.com

---

**Last Updated:** November 6, 2025  
**Maintained By:** Celestial
