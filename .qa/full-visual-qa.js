const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const RESULTS_DIR = path.join(__dirname, 'visual-test-results');
const SCREENSHOTS_DIR = path.join(RESULTS_DIR, 'screenshots');
const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}`;

const ENDPOINTS_TO_TEST = [
    { path: '/', name: 'homepage', type: 'html' },
    { path: '/health', name: 'health-check', type: 'json' },
    { path: '/api', name: 'api-docs', type: 'json' },
    { path: '/reports', name: 'reports', type: 'json' },
    { path: '/manifest.json', name: 'manifest', type: 'json' },
    { path: '/favicon.svg', name: 'favicon-svg', type: 'image' },
    { path: '/icons/icon-192x192.svg', name: 'icon-192', type: 'image' }
];

const testResults = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    totalTests: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
    details: []
};

function createDirectories() {
    if (!fs.existsSync(RESULTS_DIR)) {
        fs.mkdirSync(RESULTS_DIR, { recursive: true });
    }
    if (!fs.existsSync(SCREENSHOTS_DIR)) {
        fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    }
}

async function captureScreenshot(page, name) {
    const screenshotPath = path.join(SCREENSHOTS_DIR, `${name}.png`);
    await page.screenshot({ 
        path: screenshotPath,
        fullPage: true 
    });
    return screenshotPath;
}

async function testEndpoint(browser, endpoint) {
    const page = await browser.newPage();
    const test = {
        endpoint: endpoint.path,
        name: endpoint.name,
        type: endpoint.type,
        status: 'pending',
        issues: [],
        metrics: {}
    };

    try {
        const startTime = Date.now();
        
        const response = await page.goto(`${BASE_URL}${endpoint.path}`, {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        const loadTime = Date.now() - startTime;
        test.metrics.loadTime = `${loadTime}ms`;
        test.metrics.statusCode = response.status();

        if (response.status() !== 200) {
            test.issues.push(`HTTP ${response.status()} - Expected 200`);
            test.status = 'failed';
            testResults.failed++;
        } else {
            test.status = 'passed';
            testResults.passed++;
        }

        if (endpoint.type === 'html') {
            const screenshot = await captureScreenshot(page, endpoint.name);
            test.screenshot = screenshot;

            const title = await page.title();
            test.metrics.pageTitle = title;

            const consoleErrors = [];
            page.on('console', msg => {
                if (msg.type() === 'error') {
                    consoleErrors.push(msg.text());
                }
            });

            const hasH1 = await page.$('h1');
            if (!hasH1) {
                test.issues.push('No <h1> tag found');
                test.status = 'warning';
                testResults.warnings++;
            }

            const links = await page.$$('a[href]');
            test.metrics.totalLinks = links.length;

            const images = await page.$$('img');
            test.metrics.totalImages = images.length;

            if (loadTime > 3000) {
                test.issues.push(`Slow load time: ${loadTime}ms (> 3s)`);
                if (test.status === 'passed') {
                    test.status = 'warning';
                    testResults.warnings++;
                    testResults.passed--;
                }
            }
        }

        if (endpoint.type === 'json') {
            const content = await page.content();
            const bodyText = await page.evaluate(() => document.body.textContent);
            
            try {
                const json = JSON.parse(bodyText);
                test.metrics.jsonValid = true;
                test.metrics.jsonKeys = Object.keys(json).length;
                test.jsonPreview = JSON.stringify(json, null, 2).substring(0, 200) + '...';
            } catch (e) {
                test.issues.push('Invalid JSON response');
                test.status = 'failed';
                if (test.status === 'passed') {
                    testResults.passed--;
                }
                testResults.failed++;
            }
        }

    } catch (error) {
        test.status = 'failed';
        test.issues.push(`Error: ${error.message}`);
        testResults.failed++;
    } finally {
        await page.close();
        testResults.totalTests++;
        testResults.details.push(test);
    }

    return test;
}

async function testSecurity(browser) {
    const page = await browser.newPage();
    const test = {
        endpoint: '/',
        name: 'security-headers',
        type: 'security',
        status: 'pending',
        issues: [],
        headers: {}
    };

    try {
        const response = await page.goto(BASE_URL, {
            waitUntil: 'networkidle0'
        });

        const headers = response.headers();
        
        const securityHeaders = [
            'x-content-type-options',
            'x-frame-options',
            'x-xss-protection',
            'referrer-policy',
            'content-security-policy'
        ];

        securityHeaders.forEach(header => {
            if (headers[header]) {
                test.headers[header] = headers[header];
            } else {
                test.issues.push(`Missing security header: ${header}`);
            }
        });

        if (headers['x-powered-by']) {
            test.issues.push('X-Powered-By header should be removed');
        }

        test.status = test.issues.length === 0 ? 'passed' : 'warning';
        if (test.status === 'passed') {
            testResults.passed++;
        } else {
            testResults.warnings++;
        }

    } catch (error) {
        test.status = 'failed';
        test.issues.push(`Error: ${error.message}`);
        testResults.failed++;
    } finally {
        await page.close();
        testResults.totalTests++;
        testResults.details.push(test);
    }

    return test;
}

async function testAccessibility(browser) {
    const page = await browser.newPage();
    const test = {
        endpoint: '/',
        name: 'accessibility',
        type: 'a11y',
        status: 'pending',
        issues: [],
        metrics: {}
    };

    try {
        await page.goto(BASE_URL, {
            waitUntil: 'networkidle0'
        });

        const a11yChecks = await page.evaluate(() => {
            const results = {
                hasLangAttr: !!document.documentElement.lang,
                hasDoctype: !!document.doctype,
                imagesWithoutAlt: 0,
                linksWithoutText: 0,
                headingStructure: []
            };

            document.querySelectorAll('img').forEach(img => {
                if (!img.alt) results.imagesWithoutAlt++;
            });

            document.querySelectorAll('a').forEach(link => {
                if (!link.textContent.trim() && !link.getAttribute('aria-label')) {
                    results.linksWithoutText++;
                }
            });

            ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(tag => {
                results.headingStructure.push({
                    tag,
                    count: document.querySelectorAll(tag).length
                });
            });

            return results;
        });

        test.metrics = a11yChecks;

        if (!a11yChecks.hasLangAttr) {
            test.issues.push('Missing lang attribute on <html>');
        }

        if (!a11yChecks.hasDoctype) {
            test.issues.push('Missing DOCTYPE declaration');
        }

        if (a11yChecks.imagesWithoutAlt > 0) {
            test.issues.push(`${a11yChecks.imagesWithoutAlt} images without alt text`);
        }

        if (a11yChecks.linksWithoutText > 0) {
            test.issues.push(`${a11yChecks.linksWithoutText} links without text/aria-label`);
        }

        test.status = test.issues.length === 0 ? 'passed' : 'warning';
        if (test.status === 'passed') {
            testResults.passed++;
        } else {
            testResults.warnings++;
        }

    } catch (error) {
        test.status = 'failed';
        test.issues.push(`Error: ${error.message}`);
        testResults.failed++;
    } finally {
        await page.close();
        testResults.totalTests++;
        testResults.details.push(test);
    }

    return test;
}

async function testPerformance(browser) {
    const page = await browser.newPage();
    const test = {
        endpoint: '/',
        name: 'performance',
        type: 'performance',
        status: 'pending',
        issues: [],
        metrics: {}
    };

    try {
        await page.goto(BASE_URL, {
            waitUntil: 'networkidle0'
        });

        const performanceMetrics = await page.evaluate(() => {
            const perfData = window.performance.timing;
            return {
                domContentLoaded: perfData.domContentLoadedEventEnd - perfData.navigationStart,
                pageLoad: perfData.loadEventEnd - perfData.navigationStart,
                domReady: perfData.domComplete - perfData.domLoading,
                responseTime: perfData.responseEnd - perfData.requestStart
            };
        });

        test.metrics = performanceMetrics;

        if (performanceMetrics.pageLoad > 3000) {
            test.issues.push(`Slow page load: ${performanceMetrics.pageLoad}ms`);
        }

        if (performanceMetrics.responseTime > 1000) {
            test.issues.push(`Slow server response: ${performanceMetrics.responseTime}ms`);
        }

        test.status = test.issues.length === 0 ? 'passed' : 'warning';
        if (test.status === 'passed') {
            testResults.passed++;
        } else {
            testResults.warnings++;
        }

    } catch (error) {
        test.status = 'failed';
        test.issues.push(`Error: ${error.message}`);
        testResults.failed++;
    } finally {
        await page.close();
        testResults.totalTests++;
        testResults.details.push(test);
    }

    return test;
}

function generateReport() {
    const reportPath = path.join(RESULTS_DIR, 'visual-qa-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));

    const htmlReport = generateHTMLReport();
    const htmlPath = path.join(RESULTS_DIR, 'visual-qa-report.html');
    fs.writeFileSync(htmlPath, htmlReport);

    console.log('\n📊 Visual QA Report Generated:');
    console.log(`   JSON: ${reportPath}`);
    console.log(`   HTML: ${htmlPath}`);
}

function generateHTMLReport() {
    const passRate = ((testResults.passed / testResults.totalTests) * 100).toFixed(1);
    
    return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visual QA Report - ${new Date(testResults.timestamp).toLocaleString('ar')}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', 'Cairo', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            line-height: 1.6;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 {
            color: #667eea;
            margin-bottom: 10px;
            font-size: 2.5rem;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
        }
        .stat-card h3 {
            font-size: 2rem;
            margin-bottom: 5px;
        }
        .stat-card p {
            opacity: 0.9;
        }
        .test-item {
            background: #f9fafb;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 15px 0;
            border-radius: 8px;
        }
        .test-item.passed { border-left-color: #10b981; }
        .test-item.failed { border-left-color: #ef4444; }
        .test-item.warning { border-left-color: #f59e0b; }
        .status {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 0.85rem;
            font-weight: bold;
        }
        .status.passed { background: #10b981; color: white; }
        .status.failed { background: #ef4444; color: white; }
        .status.warning { background: #f59e0b; color: white; }
        .metrics {
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin-top: 10px;
        }
        .metrics dt {
            font-weight: bold;
            color: #667eea;
            margin-top: 10px;
        }
        .metrics dd {
            margin-right: 20px;
            color: #666;
        }
        .issues {
            background: #fef2f2;
            border-left: 3px solid #ef4444;
            padding: 10px;
            margin-top: 10px;
            border-radius: 4px;
        }
        .issues li {
            color: #991b1b;
            margin-right: 20px;
        }
        .screenshot {
            max-width: 100%;
            border-radius: 8px;
            margin-top: 15px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .timestamp {
            color: #666;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 تقرير الاختبار البصري الشامل</h1>
        <p class="timestamp">📅 ${new Date(testResults.timestamp).toLocaleString('ar')}</p>
        
        <div class="summary">
            <div class="stat-card">
                <h3>${testResults.totalTests}</h3>
                <p>إجمالي الاختبارات</p>
            </div>
            <div class="stat-card">
                <h3>${testResults.passed}</h3>
                <p>نجح ✓</p>
            </div>
            <div class="stat-card">
                <h3>${testResults.failed}</h3>
                <p>فشل ✗</p>
            </div>
            <div class="stat-card">
                <h3>${testResults.warnings}</h3>
                <p>تحذيرات ⚠</p>
            </div>
            <div class="stat-card">
                <h3>${passRate}%</h3>
                <p>معدل النجاح</p>
            </div>
        </div>

        <h2 style="margin-top: 40px; color: #667eea;">📋 تفاصيل الاختبارات</h2>
        
        ${testResults.details.map(test => `
            <div class="test-item ${test.status}">
                <h3>
                    ${test.name} 
                    <span class="status ${test.status}">${test.status.toUpperCase()}</span>
                </h3>
                <p><strong>النقطة:</strong> ${test.endpoint}</p>
                <p><strong>النوع:</strong> ${test.type}</p>
                
                ${Object.keys(test.metrics || {}).length > 0 ? `
                    <div class="metrics">
                        <strong>📊 المقاييس:</strong>
                        <dl>
                            ${Object.entries(test.metrics).map(([key, value]) => `
                                <dt>${key}:</dt>
                                <dd>${typeof value === 'object' ? JSON.stringify(value) : value}</dd>
                            `).join('')}
                        </dl>
                    </div>
                ` : ''}
                
                ${test.issues && test.issues.length > 0 ? `
                    <div class="issues">
                        <strong>⚠️ المشاكل:</strong>
                        <ul>
                            ${test.issues.map(issue => `<li>${issue}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${test.screenshot ? `
                    <img src="../screenshots/${path.basename(test.screenshot)}" class="screenshot" alt="Screenshot of ${test.name}">
                ` : ''}
                
                ${test.jsonPreview ? `
                    <div class="metrics">
                        <strong>📄 JSON Preview:</strong>
                        <pre>${test.jsonPreview}</pre>
                    </div>
                ` : ''}
            </div>
        `).join('')}
    </div>
</body>
</html>
    `;
}

async function runVisualQA() {
    console.log('🚀 بدء اختبار ضمان الجودة البصرية الشامل...');
    console.log(`📍 عنوان الاختبار: ${BASE_URL}\n`);

    createDirectories();

    let browser;
    try {
        browser = await puppeteer.launch({
            executablePath: '/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium',
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });

        console.log('✅ تم تشغيل المتصفح\n');

        console.log('🔍 اختبار نقاط النهاية...');
        for (const endpoint of ENDPOINTS_TO_TEST) {
            console.log(`   Testing ${endpoint.path}...`);
            await testEndpoint(browser, endpoint);
        }

        console.log('\n🔒 اختبار الأمان...');
        await testSecurity(browser);

        console.log('♿ اختبار إمكانية الوصول...');
        await testAccessibility(browser);

        console.log('⚡ اختبار الأداء...');
        await testPerformance(browser);

        await browser.close();

        generateReport();

        console.log('\n' + '='.repeat(60));
        console.log('📊 ملخص النتائج:');
        console.log('='.repeat(60));
        console.log(`   إجمالي الاختبارات: ${testResults.totalTests}`);
        console.log(`   ✅ نجح: ${testResults.passed}`);
        console.log(`   ❌ فشل: ${testResults.failed}`);
        console.log(`   ⚠️  تحذيرات: ${testResults.warnings}`);
        console.log(`   📈 معدل النجاح: ${((testResults.passed / testResults.totalTests) * 100).toFixed(1)}%`);
        console.log('='.repeat(60));

        if (testResults.failed > 0) {
            console.log('\n❌ بعض الاختبارات فشلت. راجع التقرير للتفاصيل.');
            process.exit(1);
        } else if (testResults.warnings > 0) {
            console.log('\n⚠️  اكتملت الاختبارات مع تحذيرات.');
            process.exit(0);
        } else {
            console.log('\n✅ جميع الاختبارات نجحت!');
            process.exit(0);
        }

    } catch (error) {
        console.error('\n❌ خطأ في تنفيذ الاختبارات:', error);
        if (browser) {
            await browser.close();
        }
        process.exit(1);
    }
}

if (require.main === module) {
    runVisualQA();
}

module.exports = { runVisualQA, testResults };
