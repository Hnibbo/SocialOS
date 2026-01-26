# SocialOS Deployment Guide

## 🚀 Production Deployment Setup

This guide provides comprehensive instructions for deploying SocialOS to production on Vercel.

### Prerequisites

1. Vercel account with project access
2. Supabase project with all migrations applied
3. Stripe account for payments
4. LiveKit account for real-time communication (optional but recommended)
5. SendGrid account for email notifications (optional)

### Deployment Configuration Files

#### 1. `vercel.json` - Vercel Configuration
```json
{
  "rewrites": [
    {
      "source": "/:path*",
      "destination": "/index.html"
    }
  ]
}
```
**Purpose**: Handles client-side routing for React Router by rewriting all paths to `index.html`.

#### 2. `package.json` - Build Configuration
```json
{
  "scripts": {
    "build": "vite build",
    "dev": "vite",
    "preview": "vite preview"
  }
}
```
**Production Build**: `npm run build` (outputs to `dist/` directory)

#### 3. `vite.config.ts` - Vite Configuration
- **Build Output**: `dist/` directory
- **Code Splitting**: Enabled with manual chunk configuration
- **Compression**: Gzip and Brotli compression
- **PWA Support**: Service Worker with auto-update
- **Minification**: ESBuild

### Environment Variables

#### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://your-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous public API key | `eyJh...` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_live_...` |

#### Optional Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_LIVEKIT_URL` | LiveKit server URL (for video calls) | `wss://your-livekit-server.livekit.cloud` |
| `VITE_LIVEKIT_API_KEY` | LiveKit API key | `AP...` |
| `VITE_SENDGRID_API_KEY` | SendGrid API key (for emails) | `SG...` |
| `VITE_GOOGLE_ANALYTICS_ID` | Google Analytics 4 ID | `G-...` |
| `VITE_POSTHOG_KEY` | PostHog analytics key | `phc_...` |
| `VITE_SENTRY_DSN` | Sentry error tracking DSN | `https://...@o12345.ingest.sentry.io/123456` |

### Step-by-Step Deployment Instructions

#### 1. Vercel Project Setup

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Link Vercel Project**:
   ```bash
   vercel link
   ```
   - Select your existing project or create a new one
   - Choose the appropriate Vercel scope

3. **Configure Environment Variables**:
   ```bash
   vercel env add VITE_SUPABASE_URL production
   vercel env add VITE_SUPABASE_ANON_KEY production
   vercel env add VITE_STRIPE_PUBLISHABLE_KEY production
   # Add optional variables as needed
   ```
   OR configure via Vercel Dashboard > Settings > Environment Variables

#### 2. Build and Deploy

1. **Test Build Locally**:
   ```bash
   npm run build
   ```
   This should create a `dist/` directory with production files.

2. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

3. **Monitor Deployment**:
   - Check deployment status in Vercel Dashboard
   - Review logs for any errors

#### 3. Post-Deployment Verification

1. **Check Application Health**:
   - Visit the production URL
   - Verify all routes are accessible
   - Test authentication flow (signup, login, password reset)
   - Test map functionality and real-time features

2. **Test Payment Integration**:
   - Test Stripe checkout flow (use test cards)
   - Verify payments are recorded in Stripe dashboard

3. **Monitor Performance**:
   - Check Vercel analytics
   - Monitor Supabase Edge Function logs
   - Set up error tracking alerts

### Edge Functions (Supabase)

#### Required Functions

| Function | Status | Purpose |
|----------|--------|---------|
| `admin-agent` | Active | Admin operations and moderation |
| `generate-livekit-token` | Active | Generates LiveKit tokens for video calls |
| `find_nearby_activities` | Active | Finds nearby activities based on location |
| `stripe-admin` | Active | Stripe admin operations |
| `stripe-connect` | Active | Stripe Connect integration |

#### Deployment Verification

```bash
# Check function status
supabase functions list
```

### Performance Optimizations

#### Build Optimizations
- **Code Splitting**: Automatic chunking for vendor libraries
- **Compression**: Gzip and Brotli compression enabled
- **Tree Shaking**: Dead code elimination via Vite
- **Lazy Loading**: All pages use React.lazy() for on-demand loading

#### Runtime Optimizations
- **Performance Monitoring**: Built-in performance monitoring
- **Error Tracking**: Real-time error tracking via `performance.ts`
- **Long Task Monitoring**: Identifies performance bottlenecks
- **LCP/CLS Tracking**: Core Web Vitals monitoring

### Security & Compliance

#### Completed
- ✅ Row Level Security (RLS) policies on all tables
- ✅ Secure environment variable handling
- ✅ HTTPS-only connections
- ✅ Auth token validation
- ✅ Input sanitization
- ✅ CSRF protection

#### Ongoing
- ⏳ Content Security Policy (CSP) headers
- ⏳ Rate limiting on API endpoints
- ⏳ Data retention policy implementation
- ⏳ GDPR compliance documentation

### Scalability Considerations

1. **Vercel Auto-Scaling**: Handles traffic spikes automatically
2. **Supabase Scaling**: Database scales with demand
3. **Edge Caching**: Static assets served via Vercel CDN
4. **Rate Limiting**: Implement before viral growth
5. **Load Testing**: Test with simulated traffic before launch

### Support Resources

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://app.supabase.com
- **Stripe Dashboard**: https://dashboard.stripe.com
- **LiveKit Dashboard**: https://cloud.livekit.io
- **Logs**: Check Supabase Edge Function logs

### Troubleshooting

#### Common Issues

1. **Build Failed**:
   - Check Node.js version compatibility (Node 18 or higher)
   - Verify all dependencies are installed (`npm install`)
   - Check for TypeScript errors (`npm run lint`)

2. **Environment Variables Not Loaded**:
   - Verify variables are correctly set in Vercel
   - Check variable prefix (must start with `VITE_`)
   - Restart deployment if changes were made

3. **API Connection Errors**:
   - Verify Supabase project URL and anon key
   - Check CORS configuration in Supabase
   - Test API endpoints directly using Supabase Dashboard

### Rollback Procedure

1. **Vercel Deployments**: Each deployment is immutable
2. **Rollback to Previous Version**: In Vercel Dashboard, go to Deployments > Select deployment > Click "Redeploy"
3. **Database Changes**: Use migrations for rollback

## 📝 Deployment Checklist

- [ ] Environment variables configured in Vercel
- [ ] All dependencies installed (`npm install`)
- [ ] Build process tested locally (`npm run build`)
- [ ] Supabase migrations applied
- [ ] Edge functions deployed and active
- [ ] Stripe account connected
- [ ] Domain DNS configured
- [ ] SSL certificate verified
- [ ] All routes tested
- [ ] Authentication flow tested
- [ ] Payments integration tested
- [ ] Real-time features tested
- [ ] Performance monitoring configured

## 🚀 Ready for Production

Once all checklist items are completed, your SocialOS application is ready for production deployment!
