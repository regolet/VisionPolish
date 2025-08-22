# VisionPolish Production Deployment Guide

## Prerequisites

- Node.js 18+ 
- Supabase project
- Domain name (optional)
- SSL certificate (for production)

## Environment Setup

1. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Configure environment variables:**
   ```bash
   VITE_APP_NAME=VisionPolish
   VITE_APP_URL=https://your-domain.com
   VITE_APP_ENV=production
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## Database Setup

1. **Run the production RLS policies:**
   ```sql
   -- In your Supabase SQL editor
   \i supabase/production-rls-policies.sql
   ```

2. **Verify database schema:**
   ```sql
   -- Check tables exist
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

3. **Create admin user:**
   ```sql
   -- Create your admin account
   INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at)
   VALUES ('admin@yourdomain.com', crypt('secure_password', gen_salt('bf')), NOW(), NOW(), NOW());
   
   INSERT INTO profiles (id, role, full_name, is_active)
   VALUES ((SELECT id FROM auth.users WHERE email = 'admin@yourdomain.com'), 'admin', 'Administrator', true);
   ```

## Build & Deploy

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run production build:**
   ```bash
   npm run build
   ```

3. **Test build locally:**
   ```bash
   npm run preview
   ```

4. **Deploy to hosting platform:**
   - Netlify: Connect GitHub repo, auto-deploy on push
   - Vercel: `vercel --prod`
   - Traditional hosting: Upload `dist/` folder

## Security Checklist

### Environment Security
- [ ] All environment variables set correctly
- [ ] No sensitive data in client-side code
- [ ] API keys restricted to specific domains
- [ ] HTTPS enabled for production

### Database Security  
- [ ] RLS policies enabled and tested
- [ ] Service role key secured
- [ ] Database backups configured
- [ ] Audit logging enabled

### Application Security
- [ ] Input validation on all forms
- [ ] File upload restrictions in place
- [ ] Rate limiting configured
- [ ] Error messages don't expose sensitive data

## Performance Optimization

1. **Enable compression:**
   ```javascript
   // vite.config.js
   export default {
     build: {
       rollupOptions: {
         output: {
           manualChunks: {
             vendor: ['react', 'react-dom'],
             supabase: ['@supabase/supabase-js'],
             ui: ['lucide-react']
           }
         }
       }
     }
   }
   ```

2. **Configure CDN caching:**
   - Static assets: 1 year cache
   - HTML files: No cache
   - API responses: Appropriate cache headers

3. **Image optimization:**
   - Use WebP format when possible
   - Implement lazy loading
   - Optimize image sizes

## Monitoring & Alerts

1. **Error monitoring:**
   - Set up Sentry or similar service
   - Configure error alerts
   - Monitor error rates

2. **Performance monitoring:**
   - Set up Web Vitals tracking
   - Monitor page load times
   - Track user interactions

3. **Database monitoring:**
   - Monitor query performance
   - Set up connection pool alerts
   - Track storage usage

## Backup Strategy

1. **Database backups:**
   - Automated daily backups
   - Point-in-time recovery enabled
   - Backup retention policy

2. **File storage backups:**
   - Regular bucket snapshots
   - Cross-region replication
   - Backup testing procedures

## Maintenance

1. **Regular updates:**
   - Security patches
   - Dependency updates
   - Feature releases

2. **Database maintenance:**
   - Regular ANALYZE and VACUUM
   - Index optimization
   - Query performance review

3. **Monitoring:**
   - Weekly performance reports
   - Monthly security audit
   - Quarterly disaster recovery test

## Troubleshooting

### Common Issues

1. **Authentication not working:**
   - Check Supabase URL and keys
   - Verify RLS policies
   - Check network connectivity

2. **Images not loading:**
   - Verify Supabase Storage setup
   - Check bucket policies
   - Confirm CORS configuration

3. **Slow performance:**
   - Check database query performance
   - Optimize images and assets
   - Enable CDN caching

### Support

- Documentation: See README.md
- Issues: GitHub Issues
- Emergency: Contact admin team

## Rollback Procedure

1. **Code rollback:**
   ```bash
   git checkout previous-stable-version
   npm run build
   # Deploy previous version
   ```

2. **Database rollback:**
   ```sql
   -- Restore from backup if needed
   -- Test thoroughly before switching traffic
   ```

3. **Verification:**
   - Test critical user flows
   - Verify all integrations working
   - Monitor error rates post-rollback