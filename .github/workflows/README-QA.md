# 🧪 Automated QA Testing Workflow

This directory contains the automated QA testing workflow that runs after each Render deployment.

## 📋 Workflow: qa-auto-test.yml

**Trigger:** Automatically runs after the "🚀 Render Auto Deploy" workflow completes successfully

**Manual Trigger:** Can also be run manually via GitHub Actions UI

---

## 🎯 What It Does

1. **Site Availability Check**
   - Tests if the deployed site is reachable
   - Returns HTTP status code

2. **Route Testing**
   - Tests all major routes:
     - Homepage (/)
     - Dashboard (/dashboard)
     - Students (/students)
     - Teachers (/teachers)
     - Attendance (/attendance)
     - Behavior (/behavior)
     - Reports (/reports)
     - Settings (/settings)

3. **Icon Library Verification**
   - Checks if FontAwesome CDN is loaded
   - Detects FontAwesome version
   - Verifies icon classes are present

4. **PWA Checks**
   - Verifies manifest.json is accessible
   - Checks favicon.svg availability

5. **Report Generation**
   - Creates detailed QA-TEST-REPORT.md
   - Includes pass/fail status for each test
   - Calculates overall pass rate
   - Commits report back to repository

---

## 📊 Report Format

The generated `QA-TEST-REPORT.md` includes:

- Test timestamp
- Site availability status
- Route testing results (table format)
- FontAwesome detection
- PWA manifest checks
- Overall summary with pass rate

---

## 🚀 How to Use

### Automatic (Recommended)
The workflow runs automatically after each deployment. Just:
1. Push code to main branch
2. Wait for Render deployment
3. QA workflow runs automatically
4. Check `QA-TEST-REPORT.md` for results

### Manual Trigger
1. Go to GitHub Actions
2. Select "🧪 Post-Deploy UI & Icons QA Test"
3. Click "Run workflow"
4. Select branch
5. Click "Run workflow"

---

## 📈 Reading the Report

### Status Indicators

| Symbol | Meaning |
|--------|---------|
| ✅ | Test passed (HTTP 200) |
| ⚠️ | Warning (redirect or not critical) |
| ❌ | Test failed |

### Pass Rate

- **≥90%:** Excellent - All critical features working
- **70-89%:** Good - Minor issues may exist
- **50-69%:** Needs Attention - Several routes failing
- **<50%:** Critical - Major issues detected

---

## 🔍 Troubleshooting

### QA Workflow Doesn't Run

**Problem:** Workflow doesn't trigger after deployment

**Solutions:**
1. Check workflow file syntax: `yamllint .github/workflows/qa-auto-test.yml`
2. Verify "Render Auto Deploy" workflow name matches exactly
3. Check GitHub Actions permissions in repository settings

### Report Not Committed

**Problem:** QA report isn't pushed back to repository

**Solutions:**
1. Check GitHub token permissions (needs write access)
2. Verify branch protection rules allow bot commits
3. Check workflow logs for push errors

### Tests Timing Out

**Problem:** Tests timeout after 20 minutes

**Solutions:**
1. Render may be slow to deploy - increase wait time
2. Check Render deployment logs for issues
3. Verify site is actually deployed and accessible

### All Routes Return 404

**Problem:** Every route test fails with 404

**Possible Causes:**
1. Routes not implemented yet (normal for new projects)
2. Server routing not configured properly
3. App requires authentication for these routes

---

## 🛠️ Customization

### Add New Routes

Edit the `ROUTES` array in `qa-auto-test.yml`:

```yaml
declare -A ROUTES=(
  [YourPage]="/your-route"
  [Another]="/another-route"
)
```

### Change Timeout

Adjust the workflow timeout:

```yaml
jobs:
  qa-test:
    timeout-minutes: 20  # Change this value
```

### Modify Wait Time

Change deployment stabilization wait:

```yaml
sleep 30  # Change to desired seconds
```

---

## 📝 Example Report Output

```markdown
# 🧪 Automated QA Test Report

**Generated:** 2025-10-13 12:00:00 UTC
**Deployment URL:** https://nursery-management-system-dari-alhanonah.onrender.com

## 📊 Test Results

### 🌍 Site Availability
✅ **Site is reachable** (HTTP 200)

### 🔗 Route Testing
| Route | Status | HTTP Code |
|-------|--------|-----------|
| Homepage | ✅ Pass | 200 |
| Dashboard | ❌ Fail | 404 |
| Students | ❌ Fail | 404 |

### 🎨 Icon Library Verification
✅ **FontAwesome CDN detected**
   - Version: `font-awesome/6.5.0`

### 📈 Summary
- **Total Routes Tested:** 8
- **Passed:** 2
- **Failed:** 6
- **Pass Rate:** 25%

⚠️ **Overall Status:** NEEDS ATTENTION
```

---

## 🎯 Best Practices

1. **Review Reports Regularly**
   - Check QA reports after each deployment
   - Track trends in pass rates
   - Address failing routes promptly

2. **Keep Routes Updated**
   - Add new routes as they're developed
   - Remove deprecated routes
   - Update expected status codes

3. **Monitor FontAwesome**
   - Ensure CDN is always loaded
   - Verify icon classes work
   - Update version as needed

4. **Use Manual Triggers**
   - Test before major releases
   - Verify fixes after deployments
   - Debug specific issues

---

## 🔗 Related Workflows

- `render-auto-deploy.yml` - Deploys to Render (triggers this workflow)
- `autodeploy.yml` - Alternative deployment workflow
- `deploy-render.yml` - Simple deploy hook

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)
- [FontAwesome Documentation](https://fontawesome.com/docs)
- [Render Documentation](https://render.com/docs)

---

**Created:** 2025-10-13  
**Maintained by:** Automated QA System  
**Last Updated:** 2025-10-13
