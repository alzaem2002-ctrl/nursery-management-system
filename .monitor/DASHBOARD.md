# 🌐 Monitoring Dashboard Documentation

## Overview

The Monitoring Dashboard provides real-time visibility into the production system's health through automated checks every 12 hours. It updates both the README.md and a dedicated GitHub Pages dashboard.

## 🎯 Features

### Auto-Updated Metrics
- ✅ **Uptime Status** - Real-time deployment availability
- ⚡ **Response Time** - HTTP request latency in milliseconds
- 📊 **Performance Score** - Overall system performance rating (0-100)
- 🔗 **Endpoint Health** - Critical endpoints status check
- 📈 **Overall Status** - Aggregated health indicator

### Dual Dashboard System
1. **README Dashboard** - Embedded table in repository README
2. **GitHub Pages** - Full interactive web dashboard

## 📍 Access Points

### README Dashboard
View in repository: `README.md` at the top of the file

The table updates automatically every 12 hours with:
- Last check timestamp
- Current uptime status
- Response time metrics
- Performance score
- Endpoint test results
- Overall system status

### GitHub Pages Dashboard
**URL**: https://alzaem2002-ctrl.github.io/nursery-management-system-dari-alhanonah-system/

Features:
- Beautiful, responsive UI
- Real-time metrics cards
- Detailed monitoring information
- Arabic RTL support
- Auto-refresh indicator

## 🔄 Update Schedule

**Frequency**: Every 12 hours  
**Times**: 00:00 UTC and 12:00 UTC daily  
**Automation**: GitHub Actions workflow

### Manual Trigger

You can manually trigger an update:

1. Go to repository → Actions
2. Select "🌐 Monitoring Dashboard (README + Pages)"
3. Click "Run workflow"
4. Select branch and run

## 🛠️ Workflow Configuration

### Workflow File
`.github/workflows/monitoring-dashboard.yml`

### What It Does

1. **Check Uptime** - Tests deployment accessibility
2. **Measure Performance** - Calculates response time
3. **Run Performance Audit** - Scores system performance
4. **Test Endpoints** - Validates critical paths
5. **Update README** - Modifies monitoring table
6. **Generate Dashboard** - Creates HTML dashboard
7. **Deploy to Pages** - Publishes to GitHub Pages

### Environment Variables

```bash
DEPLOY_URL=https://dari-system.netlify.app
LOCAL_URL=http://localhost:3000
```

## 📊 Metrics Explained

### Uptime Status
- **✅ UP** - Deployment responding with HTTP 200
- **❌ DOWN** - Deployment unreachable or error status
- **Threshold**: Must return 200 OK

### Response Time
- Measured in milliseconds (ms)
- Full HTTP request roundtrip time
- **Excellent**: < 200ms
- **Good**: 200-500ms
- **Fair**: 500ms-1s
- **Slow**: 1s-2s
- **Poor**: > 2s

### Performance Score
Calculated based on:
- Response time
- HTTP status code
- Endpoint availability

**Scoring**:
- **95-100**: Response < 500ms
- **90-94**: Response 500ms-1s
- **80-89**: Response 1s-2s
- **70-79**: Response 2s+
- **< 70**: Performance issues detected

### Endpoint Health
Tests critical endpoints:
- `/` - Home page
- `/health` - Health check API

**Format**: `X/Y` (X passed out of Y tested)

### Overall Status
- **PASS ✅** - All metrics healthy
- **CHECK REQUIRED ⚠️** - Issues detected

## 🎨 Dashboard Customization

### Modify Checked Endpoints

Edit `.github/workflows/monitoring-dashboard.yml`:

```yaml
- name: 🧪 Test Critical Endpoints
  run: |
    for endpoint in "/" "/health" "/api" "/reports"; do
      # Test endpoint
    done
```

### Change Update Frequency

Edit the cron schedule:

```yaml
on:
  schedule:
    - cron: "0 */6 * * *"   # Every 6 hours
    # or
    - cron: "0 0 * * *"     # Daily at midnight
```

### Update Dashboard Design

Edit the HTML template in workflow step "🌍 Generate GitHub Pages Dashboard":

```yaml
- name: 🌍 Generate GitHub Pages Dashboard
  run: |
    cat > public/index.html << 'EOF'
    <!-- Your custom HTML here -->
    EOF
```

## 🔧 Troubleshooting

### Dashboard Not Updating

**Issue**: Dashboard shows old data

**Solutions**:
1. Check GitHub Actions workflow status
2. Verify workflow has write permissions
3. Check if GitHub Pages is enabled
4. Manual trigger workflow to force update

### README Not Updating

**Issue**: README table shows wrong values

**Solutions**:
1. Ensure monitoring section exists in README.md
2. Check sed commands in workflow
3. Verify git push succeeded
4. Check for merge conflicts

### GitHub Pages Not Publishing

**Issue**: Dashboard URL returns 404

**Solutions**:
1. Enable GitHub Pages in repository settings
2. Set source to "gh-pages" branch
3. Wait 5-10 minutes for first deployment
4. Check workflow logs for errors

### Performance Score Incorrect

**Issue**: Score doesn't match expectations

**Solutions**:
1. Check response time measurements
2. Verify calculation logic in workflow
3. Consider network latency from GitHub Actions
4. Compare with local measurements

## 📈 Monitoring Best Practices

### 1. Regular Review
- Check dashboard weekly
- Monitor trends over time
- Investigate anomalies promptly

### 2. Alert Configuration
- Set up notifications for critical issues
- Configure Slack/email alerts
- Define escalation procedures

### 3. Performance Baselines
- Document normal performance ranges
- Track degradation patterns
- Plan capacity upgrades proactively

### 4. Incident Response
- Document when issues occur
- Root cause analysis
- Prevention measures

## 🔐 Security Considerations

### Permissions Required
- **contents: write** - To update README
- **pages: write** - To deploy to GitHub Pages
- **id-token: write** - For authentication

### Secrets Used
- `GITHUB_TOKEN` - Automatically provided by GitHub

### Data Privacy
- All metrics are public (GitHub Pages)
- No sensitive data in monitoring output
- Performance data only

## 📊 Metrics History

To track historical data:

1. **Enable Artifact Storage**
   - Workflow saves reports as artifacts
   - 90-day retention by default

2. **Export Metrics**
   ```bash
   # View historical data
   git log --grep="auto-update monitoring"
   ```

3. **Advanced Analytics**
   - Integrate with Grafana
   - Use Prometheus for metrics
   - Set up custom dashboards

## 🚀 Advanced Features

### Multi-Region Monitoring

Add geographic monitoring:

```yaml
- name: Check from Multiple Regions
  run: |
    # Use external monitoring services
    # Or deploy to different regions
```

### Custom Metrics

Add application-specific metrics:

```yaml
- name: Check Database
  run: |
    # Query database health
    # Test connection pool
```

### Integration Testing

Add functional tests:

```yaml
- name: Run Integration Tests
  run: |
    # Test user flows
    # Validate API responses
```

## 📝 FAQ

**Q: How often does the dashboard update?**  
A: Every 12 hours automatically, or on-demand via manual trigger.

**Q: Can I change the update frequency?**  
A: Yes, modify the cron schedule in the workflow file.

**Q: What if my deployment URL changes?**  
A: Update `DEPLOY_URL` in the workflow file.

**Q: Can I add more metrics?**  
A: Yes, extend the workflow with additional checks.

**Q: Is the dashboard mobile-friendly?**  
A: Yes, it's fully responsive and works on all devices.

**Q: Can I customize the dashboard colors?**  
A: Yes, edit the CSS in the HTML template.

## 📞 Support

**Repository**: [alzaem2002-ctrl/nursery-management-system-dari-alhanonah-system](https://github.com/alzaem2002-ctrl/nursery-management-system-dari-alhanonah-system)

**Issues**: Report problems via GitHub Issues  
**Documentation**: See `.monitor/` directory  
**Workflow**: `.github/workflows/monitoring-dashboard.yml`

## 🔗 Related Documentation

- [Monitoring Setup](.monitor/README.md)
- [Production Monitoring](.github/workflows/production-monitoring.yml)
- [QA Reports](.qa/)
- [Deployment Guide](../README.md)

---

**Last Updated**: 2025-10-08  
**Version**: 1.0  
**Maintainer**: Senior Site Reliability Engineer
