# Hugo Landing Page - Deployment Guide

## 🚀 Deploying to Netlify

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial Hugo landing page"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### Step 2: Connect to Netlify

1. Go to [Netlify](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Choose GitHub and select your repository
4. Build settings will auto-detect (already configured in netlify.toml)
5. Click "Deploy site"

### Step 3: Verify Forms

After deployment:
1. Visit your live site
2. Submit a test form
3. Check submissions at: Netlify Dashboard → Forms → Active Forms
4. You'll see "user-access" and "investor-access" forms

## 📊 Form Submissions

### Viewing Submissions
- **Netlify Dashboard**: Forms tab shows all submissions
- **Email Notifications**: Set up in Forms → Settings → Form notifications
- **CSV Export**: Available in Netlify dashboard
- **API Access**: Available with Netlify Functions (paid plan)

### Local Development
Forms work differently locally:
- **Local**: Saves to localStorage (Cmd/Ctrl + Shift + D to download)
- **Production**: Sends to Netlify Forms

## 🔧 Configuration

### Environment Variables (if needed)
In Netlify Dashboard → Site settings → Environment variables

### Custom Domain
1. Go to Domain settings
2. Add custom domain
3. Follow DNS configuration steps

## 📧 Email Notifications

To receive email notifications for form submissions:
1. Go to Forms → Settings → Form notifications
2. Add email address
3. Choose notification type (all submissions or digest)

## 🎯 Form Limits

**Free Tier**: 100 submissions/month
- After 100, forms still work but go to spam folder
- Upgrade to paid plan for more submissions

## 🐛 Troubleshooting

### Forms Not Working?
1. Check that HTML forms exist in public/index.html
2. Verify form names match exactly
3. Check browser console for errors
4. Ensure netlify attribute is present

### Build Failing?
1. Check Node version (Netlify uses Node 18 by default)
2. Verify all dependencies are in package.json
3. Check build logs in Netlify dashboard

## 📝 Testing Checklist

- [ ] Deploy to Netlify
- [ ] Submit test user form
- [ ] Submit test investor form  
- [ ] Check Netlify Forms dashboard
- [ ] Set up email notifications
- [ ] Test on mobile devices
- [ ] Verify animations work
- [ ] Check responsive design

## 🔄 Updates

To update the site:
```bash
git add .
git commit -m "Update description"
git push
```

Netlify automatically deploys on push to main branch.

## 💾 Backup Data

Regularly export form submissions:
1. Netlify Dashboard → Forms
2. Select form → Download CSV
3. Store backups securely

## 🚨 Important Notes

- Form submissions count against monthly limit immediately
- Spam submissions also count toward limit
- Enable CAPTCHA if receiving spam (Forms → Settings → Spam filter)
- Consider upgrading if expecting > 100 submissions/month