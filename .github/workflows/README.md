# GitHub Actions Workflows

This directory contains automated workflows for the Nursery Management System.

## 🚀 Render Auto Deploy

**File:** `render-auto-deploy.yml`

Automatically deploys the application to Render when code is pushed to the `main` branch.

### Features
- ✅ Automatic deployment on push to main
- ✅ Manual deployment trigger via GitHub UI
- ✅ Health check verification after deployment
- ✅ Build step with error handling
- ✅ 45-minute timeout protection

### Required Secrets

Add these secrets in your GitHub repository settings:
**Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `RENDER_API_KEY` | Your Render API key | Go to [Render Account Settings](https://dashboard.render.com/u/settings) → API Keys → Create API Key |
| `RENDER_SERVICE_ID` | Your Render service ID | Go to your service in Render → Service ID is in the URL: `srv-XXXXX` |

### How to Get Render Credentials

#### 1. Get RENDER_API_KEY
1. Go to: https://dashboard.render.com/u/settings
2. Scroll to **API Keys**
3. Click **Create API Key**
4. Give it a name: `GitHub Actions Deploy`
5. Click **Create**
6. Copy the key immediately (you won't see it again!)

#### 2. Get RENDER_SERVICE_ID
1. Go to: https://dashboard.render.com/
2. Click on your service: `nursery-management-system-dari-alhanonah`
3. Look at the URL: `https://dashboard.render.com/web/srv-XXXXXXXXX`
4. Copy the `srv-XXXXXXXXX` part - this is your SERVICE_ID

### Setup Instructions

1. **Add Secrets to GitHub:**
   ```
   Repository → Settings → Secrets and variables → Actions
   → New repository secret
   ```

2. **Add both secrets:**
   - Name: `RENDER_API_KEY`, Value: `rnd_xxx...`
   - Name: `RENDER_SERVICE_ID`, Value: `srv-xxx...`

3. **Test the workflow:**
   - Push to main branch, or
   - Go to: Actions → Render Auto Deploy → Run workflow

### Workflow Triggers

- **Automatic:** Every push to `main` branch
- **Manual:** Actions tab → Render Auto Deploy → Run workflow button

### Health Check

The workflow verifies deployment by checking:
```
https://nursery-management-system-dari-alhanonah.onrender.com/health
```

Expected response: HTTP 200 OK

### Troubleshooting

**Problem:** Deployment triggered but health check fails
- **Solution:** Check if your app has a `/health` endpoint
- Add this to your Express app:
  ```javascript
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
  });
  ```

**Problem:** "Missing RENDER_API_KEY" error
- **Solution:** Verify secrets are added correctly in repository settings

**Problem:** Timeout after 45 minutes
- **Solution:** Check Render logs for build errors
- Verify dependencies are cacheable

### Deployment URL

Production: https://nursery-management-system-dari-alhanonah.onrender.com

---

## Other Workflows

- **autodeploy.yml** - Legacy deployment workflow
- **deploy-render.yml** - Simple deploy hook workflow
- **monitoring-dashboard.yml** - System monitoring
- **jekyll-docker.yml** - Documentation builds

---

## Best Practices

1. ✅ Always test in a staging environment first
2. ✅ Use semantic versioning for releases
3. ✅ Monitor Render logs after deployment
4. ✅ Keep secrets secure and rotate them regularly
5. ✅ Add health checks to your application

## Support

- GitHub Actions Docs: https://docs.github.com/en/actions
- Render API Docs: https://render.com/docs/api
- Render Deploy Hooks: https://render.com/docs/deploy-hooks
