# End-to-End Integration Testing Guide

## Overview

This guide covers comprehensive testing of the FoodLang AI application after deployment, ensuring all components work together seamlessly.

## Prerequisites

- ✅ Backend deployed to Railway/Render
- ✅ Frontend deployed to Vercel
- ✅ Environment variables configured
- ✅ CORS settings updated
- ✅ Glossary uploaded via admin panel

## Test Environment Setup

### URLs to Test
- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-backend.railway.app`
- **Health Check**: `https://your-backend.railway.app/api/health`

### Test Data Required
- Sample Arabic text: "صدر دجاج مشوي"
- Sample English text: "grilled chicken breast"
- Test image with Arabic/English food packaging text
- Admin credentials: username/password

## Test Scenarios

### 1. Text Translation Functionality with Cost Tracking

#### Test Case 1.1: Arabic to English Translation
**Objective**: Verify Arabic text translation and cost tracking

**Steps**:
1. Navigate to frontend homepage
2. Select "Text Translation" tab
3. Enter Arabic text: "صدر دجاج مشوي"
4. Click "Translate" button
5. Observe loading state
6. Check translation result
7. Verify cost tracker updates in header

**Expected Results**:
- ✅ Translation appears: "grilled chicken breast" (or similar)
- ✅ Language badge shows "Arabic → English"
- ✅ Cost tracker in header updates with session cost
- ✅ Copy button works for translated text
- ✅ Loading spinner shows during processing

#### Test Case 1.2: English to Arabic Translation
**Objective**: Verify English text translation

**Steps**:
1. Clear previous input
2. Enter English text: "grilled chicken breast"
3. Click "Translate" button
4. Check translation result

**Expected Results**:
- ✅ Translation appears in Arabic
- ✅ Language badge shows "English → Arabic"
- ✅ Cost accumulates in header tracker
- ✅ Translation uses glossary context for accuracy

#### Test Case 1.3: Cost Tracking Verification
**Objective**: Verify cost calculation accuracy

**Steps**:
1. Click on cost tracker badge in header
2. Review detailed cost breakdown
3. Perform multiple translations
4. Verify cost accumulation

**Expected Results**:
- ✅ Detailed breakdown shows embedding/completion costs
- ✅ Token usage displayed accurately
- ✅ Costs accumulate across multiple requests
- ✅ Pricing matches OpenAI rates ($0.150/1M tokens)

### 2. Image Upload and OCR with Both Methods

#### Test Case 2.1: GPT-4 Vision OCR
**Objective**: Test image text extraction using GPT-4 Vision

**Steps**:
1. Navigate to "Image Upload" tab
2. Select "GPT-4 Vision" OCR method
3. Upload test image with Arabic/English food packaging text
4. Wait for processing
5. Review extracted text and translation

**Expected Results**:
- ✅ Image uploads successfully with preview
- ✅ Text extraction completes within 30 seconds
- ✅ Extracted text appears in first result card
- ✅ Translation appears in second result card
- ✅ Cost tracker updates with OCR costs
- ✅ Language detection works correctly

#### Test Case 2.2: Tesseract OCR
**Objective**: Test alternative OCR method

**Steps**:
1. Select "Tesseract" OCR method
2. Upload same test image
3. Compare results with GPT-4 Vision
4. Check processing time and accuracy

**Expected Results**:
- ✅ Tesseract processes image successfully
- ✅ Text extraction quality acceptable
- ✅ Translation accuracy maintained
- ✅ Lower cost compared to GPT-4 Vision
- ✅ Fallback works if Tesseract unavailable

#### Test Case 2.3: File Validation
**Objective**: Test file upload validation

**Steps**:
1. Try uploading non-image file (PDF, TXT)
2. Try uploading oversized image (>10MB)
3. Try uploading unsupported format

**Expected Results**:
- ✅ Invalid file types rejected with clear error
- ✅ Oversized files rejected with size limit message
- ✅ Only JPG, PNG, WEBP formats accepted
- ✅ Error messages are user-friendly

### 3. Camera Capture on Mobile Devices

#### Test Case 3.1: Camera Permissions
**Objective**: Test camera access on mobile

**Steps**:
1. Open app on mobile device
2. Navigate to "Camera" tab
3. Grant camera permissions when prompted
4. Verify camera preview appears

**Expected Results**:
- ✅ Permission prompt appears appropriately
- ✅ Camera preview shows at 640x480 resolution
- ✅ Back camera selected by default
- ✅ Preview responsive to device orientation

#### Test Case 3.2: Image Capture and Processing
**Objective**: Test full camera workflow

**Steps**:
1. Point camera at food packaging with text
2. Click "Capture" button
3. Review captured image
4. Click "Process" or "Retake" as needed
5. Wait for OCR and translation

**Expected Results**:
- ✅ Image captures clearly
- ✅ Retake option works correctly
- ✅ Processing completes successfully
- ✅ Results display in mobile-friendly format
- ✅ Cost tracking works on mobile

#### Test Case 3.3: Mobile Responsive Design
**Objective**: Verify mobile user experience

**Steps**:
1. Test on various mobile screen sizes
2. Check portrait/landscape orientations
3. Verify touch interactions work
4. Test scrolling and navigation

**Expected Results**:
- ✅ Layout adapts to screen size
- ✅ Buttons are touch-friendly (44px minimum)
- ✅ Text remains readable
- ✅ Camera controls accessible
- ✅ Results cards stack vertically

### 4. Admin Panel Login and Glossary Management

#### Test Case 4.1: Admin Authentication
**Objective**: Test JWT authentication system

**Steps**:
1. Navigate to "Admin" tab
2. Enter admin credentials
3. Click "Login" button
4. Verify admin panel access
5. Test token expiration (wait 30 minutes)

**Expected Results**:
- ✅ Login succeeds with valid credentials
- ✅ Login fails with invalid credentials
- ✅ JWT token stored securely
- ✅ Admin panel becomes accessible
- ✅ Token expires after 30 minutes
- ✅ Automatic logout on expiration

#### Test Case 4.2: Glossary File Upload
**Objective**: Test glossary management functionality

**Steps**:
1. Login as admin
2. Navigate to glossary management
3. Upload new Excel file (ProductList.xlsx)
4. Wait for processing
5. Verify glossary statistics update

**Expected Results**:
- ✅ Excel file uploads successfully
- ✅ File validation works (format, size)
- ✅ Processing completes within 2 minutes
- ✅ Glossary statistics update
- ✅ FAISS index rebuilds successfully
- ✅ New translations use updated glossary

#### Test Case 4.3: Usage Statistics and Cost Breakdown
**Objective**: Test admin monitoring features

**Steps**:
1. Access admin usage statistics
2. Review cost breakdown
3. Check recent API logs
4. Verify endpoint usage data

**Expected Results**:
- ✅ Total cost and usage displayed
- ✅ Breakdown by endpoint available
- ✅ Recent logs show detailed information
- ✅ Current session costs accurate
- ✅ Historical data preserved

## Cross-Browser Testing

### Desktop Browsers
- **Chrome**: Latest version
- **Firefox**: Latest version
- **Safari**: Latest version (macOS)
- **Edge**: Latest version

### Mobile Browsers
- **iOS Safari**: iPhone/iPad
- **Android Chrome**: Various Android devices
- **Samsung Internet**: Samsung devices

### Test Matrix

| Feature | Chrome | Firefox | Safari | Edge | iOS Safari | Android Chrome |
|---------|--------|---------|--------|------|------------|----------------|
| Text Translation | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Image Upload | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Camera Capture | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Admin Panel | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Cost Tracking | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## Performance Testing

### Load Testing Scenarios

#### Test Case P1: Translation Performance
**Objective**: Measure translation response times

**Steps**:
1. Send 10 concurrent translation requests
2. Measure response times
3. Check for rate limiting
4. Verify system stability

**Expected Results**:
- ✅ Average response time < 3 seconds
- ✅ Rate limiting works (100 requests/hour)
- ✅ No system crashes under load
- ✅ Error handling graceful

#### Test Case P2: OCR Performance
**Objective**: Test image processing performance

**Steps**:
1. Upload multiple images simultaneously
2. Measure processing times
3. Check memory usage
4. Verify queue handling

**Expected Results**:
- ✅ GPT-4 Vision: < 10 seconds per image
- ✅ Tesseract: < 5 seconds per image
- ✅ No memory leaks
- ✅ Concurrent requests handled properly

## Security Testing

### Test Case S1: Input Validation
**Objective**: Test security measures

**Steps**:
1. Try SQL injection in text inputs
2. Upload malicious files
3. Test XSS attempts
4. Check CORS policies

**Expected Results**:
- ✅ SQL injection blocked
- ✅ Malicious files rejected
- ✅ XSS attempts sanitized
- ✅ CORS properly configured

### Test Case S2: Authentication Security
**Objective**: Test JWT security

**Steps**:
1. Try accessing admin endpoints without token
2. Use expired tokens
3. Attempt token manipulation
4. Test brute force protection

**Expected Results**:
- ✅ Unauthorized access blocked
- ✅ Expired tokens rejected
- ✅ Token tampering detected
- ✅ Rate limiting on login attempts

## Accessibility Testing

### Test Case A1: Screen Reader Compatibility
**Objective**: Test accessibility features

**Steps**:
1. Use screen reader (NVDA, JAWS, VoiceOver)
2. Navigate through all features
3. Test keyboard navigation
4. Check ARIA labels

**Expected Results**:
- ✅ All content readable by screen readers
- ✅ Keyboard navigation works
- ✅ ARIA labels present and accurate
- ✅ Focus indicators visible

### Test Case A2: Color Contrast and Visual
**Objective**: Test visual accessibility

**Steps**:
1. Check color contrast ratios
2. Test with high contrast mode
3. Verify text scaling
4. Check color-blind accessibility

**Expected Results**:
- ✅ WCAG AA contrast compliance
- ✅ High contrast mode supported
- ✅ Text scales to 200% without issues
- ✅ Information not conveyed by color alone

## Test Automation Scripts

### Backend API Testing Script
```bash
#!/bin/bash
# Test all backend endpoints

BACKEND_URL="https://your-backend.railway.app"

# Health check
curl -f "$BACKEND_URL/api/health" || exit 1

# Translation test
curl -X POST "$BACKEND_URL/api/translate" \
  -H "Content-Type: application/json" \
  -d '{"text": "chicken"}' || exit 1

# Admin login test
TOKEN=$(curl -X POST "$BACKEND_URL/api/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' \
  | jq -r '.token')

# Admin endpoints test
curl -H "Authorization: Bearer $TOKEN" \
  "$BACKEND_URL/api/admin/glossary" || exit 1

echo "All backend tests passed!"
```

### Frontend Testing Script
```javascript
// Playwright E2E test
const { test, expect } = require('@playwright/test');

test('FoodLang AI E2E Test', async ({ page }) => {
  // Navigate to app
  await page.goto('https://your-app.vercel.app');
  
  // Test text translation
  await page.click('[data-testid="text-tab"]');
  await page.fill('[data-testid="text-input"]', 'chicken');
  await page.click('[data-testid="translate-button"]');
  
  // Wait for result
  await expect(page.locator('[data-testid="translation-result"]')).toBeVisible();
  
  // Test cost tracker
  await expect(page.locator('[data-testid="cost-tracker"]')).toContainText('$');
  
  // Test admin login
  await page.click('[data-testid="admin-tab"]');
  await page.fill('[data-testid="username"]', 'admin');
  await page.fill('[data-testid="password"]', 'admin123');
  await page.click('[data-testid="login-button"]');
  
  await expect(page.locator('[data-testid="admin-panel"]')).toBeVisible();
});
```

## Test Reporting

### Test Results Template
```markdown
# FoodLang AI E2E Test Results

## Test Summary
- **Date**: [Date]
- **Environment**: Production
- **Frontend URL**: [URL]
- **Backend URL**: [URL]
- **Tester**: [Name]

## Test Results
- **Total Tests**: 25
- **Passed**: 24
- **Failed**: 1
- **Skipped**: 0

## Failed Tests
1. **Test Case 2.2**: Tesseract OCR - Service unavailable

## Performance Metrics
- **Average Translation Time**: 2.3 seconds
- **Average OCR Time**: 8.7 seconds
- **Page Load Time**: 1.2 seconds
- **Mobile Performance Score**: 95/100

## Issues Found
1. Tesseract OCR not available on production server
2. Minor UI alignment issue on iPad landscape

## Recommendations
1. Install Tesseract on production server
2. Fix iPad landscape CSS
3. Add more comprehensive error handling
```

## Continuous Testing

### Automated Testing Schedule
- **Smoke Tests**: After each deployment
- **Full E2E Tests**: Daily
- **Performance Tests**: Weekly
- **Security Tests**: Monthly

### Monitoring and Alerts
- **Uptime Monitoring**: 99.9% target
- **Response Time Alerts**: > 5 seconds
- **Error Rate Alerts**: > 1%
- **Cost Alerts**: > $10/day

## Status: ✅ TESTING FRAMEWORK READY

All test scenarios, scripts, and documentation are prepared for comprehensive end-to-end testing of the deployed FoodLang AI application.