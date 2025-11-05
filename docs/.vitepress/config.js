export default {
  title: 'Peerpay Ledger',
  description: 'P2P money lending and borrowing platform - Complete documentation',
  base: '/Peerpay/',
  
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: 'https://v8sn4u5d65xaovfn.public.blob.vercel-storage.com/Peerpay%20logo%20dark.svg' }]
  ],
  
  themeConfig: {
    logo: {
      light: 'https://v8sn4u5d65xaovfn.public.blob.vercel-storage.com/Peerpay%20logo%20light..svg',
      dark: 'https://v8sn4u5d65xaovfn.public.blob.vercel-storage.com/Peerpay%20logo%20dark.svg',
    },
    
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/introduction' },
      { text: 'Backend API', link: '/backend/overview' },
      { 
        text: 'v0.0.1',
        items: [
          { text: 'Changelog', link: '/changelog' },
          { text: 'Contributing', link: '/contributing' }
        ]
      }
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/introduction' },
            { text: 'Quick Start', link: '/guide/quick-start' },
            { text: 'Architecture', link: '/guide/architecture' },
            { text: 'Tech Stack', link: '/guide/tech-stack' }
          ]
        },
        {
          text: 'Features',
          items: [
            { text: 'Mobile App', link: '/guide/mobile-app' },
            { text: 'Web Dashboard', link: '/guide/web-dashboard' },
            { text: 'Backend API', link: '/guide/backend-api' }
          ]
        },
        {
          text: 'Deployment',
          items: [
            { text: 'Backend', link: '/guide/deploy-backend' },
            { text: 'Mobile App', link: '/guide/deploy-mobile' },
            { text: 'Web Dashboard', link: '/guide/deploy-dashboard' }
          ]
        }
      ],
      '/backend/': [
        {
          text: 'Backend Documentation',
          items: [
            { text: 'Overview', link: '/backend/overview' },
            { text: 'Quick Start', link: '/backend/quick-start' },
            { text: 'Environment Setup', link: '/backend/environment' }
          ]
        },
        {
          text: 'Core Modules',
          items: [
            { text: 'Authentication', link: '/backend/auth' },
            { text: 'User Management', link: '/backend/user' },
            { text: 'Friend System', link: '/backend/friend' },
            { text: 'Transactions', link: '/backend/transaction' },
            { text: 'Notifications', link: '/backend/notification' },
            { text: 'Realtime (WebSocket)', link: '/backend/realtime' },
            { text: 'Common Utilities', link: '/backend/common' }
          ]
        },
        {
          text: 'Advanced',
          items: [
            { text: 'Database Schema', link: '/backend/database' },
            { text: 'Security', link: '/backend/security' },
            { text: 'Testing', link: '/backend/testing' },
            { text: 'Performance', link: '/backend/performance' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Celestial-0/Peerpay' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025 Yash Kumar Singh'
    },

    search: {
      provider: 'local'
    },

    editLink: {
      pattern: 'https://github.com/Celestial-0/Peerpay/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    }
  },

  markdown: {
    theme: 'material-theme-palenight',
    lineNumbers: true
  }
}
