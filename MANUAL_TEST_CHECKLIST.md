# Manual Test Checklist - FoodLang AI

## Pre-Testing Setup

- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible  
- [ ] Environment variables configured
- [ ] CORS settings updated with frontend domain
- [ ] Glossary uploaded via admin panel
- [ ] Test devices/browsers available

## 1. Text Translation Functionality ✅

### Basic Translation Tests
- [ ] **Arabic to English**: Enter "صدر دجاج مشوي" → Should translate to "grilled chicken breast"
- [ ] **English to Arabic**: Enter "grilled chicken breast" → Should translate to Arabic
- [ ] **Mixed Text**: Enter text with both languages → Should handle appropriately
- [ ] **Empty Input**: Submit empty text → Should show validation error
- [ ] **Very Long Text**: Enter 1000+ characters → Should handle or show limit error

### UI/UX Tests
- [ ] **Loading State**: Translation shows spinner/loading indicator
- [ ] **Language Badge**: Correctly shows detected language (Arabic/English)
- [ ] **Copy Button**: Copy translated text to clipboard works
- [ ] **Error Handling**: Network errors show user-friendly messages
- [ ] **Input Validation**: Prevents submission of invalid input

### Cost Tracking Tests
- [ ] **Cost Display**: Header shows session cost after translation
- [ ] **Cost Accumulation**: Multiple translations increase total cost
- [ ] **Cost Breakdown**: Click cost badge shows detailed breakdown
- [ ] **Token Counting**: Token usage appears reasonable for input length

## 2. Image Upload and OCR ✅

### File Upload Tests
- [ ] **Valid Image Upload**: JPG/PNG files upload successfully
- [ ] **Image Preview**: Uploaded image displays correctly
- [ ] **File Size Validation**: Files >10MB rejected with error message
- [ ] **File Type Validation**: Non-image files rejected
- [ ] **Drag and Drop**: Drag/drop functionality works

### GPT-4 Vision OCR Tests
- [ ] **Text Extraction**: Extracts text from food packaging images
- [ ] **Arabic Text**: Correctly extracts Arabic text
- [ ] **English Text**: Correctly extracts English text
- [ ] **Mixed Languages**: Handles images with both languages
- [ ] **Poor Quality Images**: Handles blurry/low-quality images gracefully

### Tesseract OCR Tests
- [ ] **Alternative Method**: Tesseract option available and functional
- [ ] **Text Extraction**: Extracts text (may be less accurate than GPT-4)
- [ ] **Performance**: Faster processing than GPT-4 Vision
- [ ] **Fallback**: Works when GPT-4 Vision unavailable

### OCR Results Display
- [ ] **Dual Cards**: Shows extracted text and translation separately
- [ ] **Language Detection**: Correctly identifies source language
- [ ] **Copy Functionality**: Can copy both extracted and translated text
- [ ] **Error Handling**: Shows appropriate errors for failed OCR

## 3. Camera Capture (Mobile) ✅

### Camera Access Tests
- [ ] **Permission Request**: Prompts for camera permission appropriately
- [ ] **Camera Preview**: Shows live camera feed at 640x480
- [ ] **Back Camera**: Uses rear camera by default on mobile
- [ ] **Permission Denied**: Handles denied permissions gracefully

### Capture Functionality Tests
- [ ] **Image Capture**: Successfully captures images
- [ ] **Image Quality**: Captured images are clear enough for OCR
- [ ] **Retake Option**: Can retake photos before processing
- [ ] **Process Button**: Initiates OCR on captured image

### Mobile Responsiveness Tests
- [ ] **Portrait Mode**: Camera works in portrait orientation
- [ ] **Landscape Mode**: Camera adapts to landscape orientation
- [ ] **Touch Controls**: All buttons are touch-friendly (44px+)
- [ ] **Viewport Scaling**: Camera preview scales appropriately

## 4. Admin Panel and Authentication ✅

### Login Tests
- [ ] **Valid Credentials**: Login with admin/admin123 succeeds
- [ ] **Invalid Username**: Wrong username shows error
- [ ] **Invalid Password**: Wrong password shows error
- [ ] **Empty Fields**: Empty username/password shows validation
- [ ] **JWT Token**: Successful login stores JWT token

### Admin Panel Access Tests
- [ ] **Panel Visibility**: Admin panel appears after login
- [ ] **Token Validation**: Panel requires valid JWT token
- [ ] **Token Expiration**: Auto-logout after 30 minutes
- [ ] **Unauthorized Access**: Direct URL access blocked without token

### Glossary Management Tests
- [ ] **Current Stats**: Shows current glossary statistics
- [ ] **File Upload**: Can upload new Excel files
- [ ] **File Validation**: Rejects non-Excel files
- [ ] **Processing**: Shows progress during glossary processing
- [ ] **Success Feedback**: Confirms successful upload and processing

### Usage Statistics Tests
- [ ] **Cost Breakdown**: Shows detailed cost analysis
- [ ] **Usage History**: Displays recent API usage
- [ ] **Endpoint Stats**: Breaks down usage by endpoint
- [ ] **Real-time Updates**: Statistics update with new usage

## 5. Cross-Browser Compatibility ✅

### Desktop Browsers
- [ ] **Chrome**: All features work in latest Chrome
- [ ] **Firefox**: All features work in latest Firefox  
- [ ] **Safari**: All features work in Safari (macOS)
- [ ] **Edge**: All features work in latest Edge

### Mobile Browsers
- [ ] **iOS Safari**: iPhone/iPad compatibility
- [ ] **Android Chrome**: Android device compatibility
- [ ] **Samsung Internet**: Samsung device compatibility

### Feature Compatibility Matrix
| Feature | Chrome | Firefox | Safari | Edge | iOS Safari | Android Chrome |
|---------|--------|---------|--------|------|------------|----------------|
| Text Translation | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Image Upload | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Camera Capture | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Admin Panel | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Cost Tracking | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |

## 6. Responsive Design ✅

### Mobile (320px - 768px)
- [ ] **Layout**: Single column layout
- [ ] **Navigation**: Tab navigation works on mobile
- [ ] **Buttons**: All buttons are touch-friendly
- [ ] **Text**: All text remains readable
- [ ] **Images**: Images scale appropriately
- [ ] **Forms**: Form inputs are appropriately sized

### Tablet (768px - 1024px)
- [ ] **Layout**: Adapts to tablet screen size
- [ ] **Camera**: Camera functionality works on tablets
- [ ] **Touch**: Touch interactions work properly
- [ ] **Orientation**: Works in both portrait and landscape

### Desktop (1024px+)
- [ ] **Layout**: Full desktop layout
- [ ] **Hover States**: Hover effects work properly
- [ ] **Keyboard Navigation**: Tab navigation works
- [ ] **Large Screens**: Scales well on large monitors

## 7. Performance Testing ✅

### Load Times
- [ ] **Initial Load**: Homepage loads within 3 seconds
- [ ] **Translation Speed**: Translations complete within 5 seconds
- [ ] **OCR Speed**: Image processing completes within 15 seconds
- [ ] **Admin Panel**: Admin features load quickly

### Resource Usage
- [ ] **Memory**: No memory leaks during extended use
- [ ] **CPU**: Reasonable CPU usage during processing
- [ ] **Network**: Efficient API calls, no unnecessary requests
- [ ] **Storage**: Appropriate use of local storage

### Stress Testing
- [ ] **Multiple Translations**: Handle 10+ consecutive translations
- [ ] **Large Images**: Process large (but valid) image files
- [ ] **Concurrent Users**: Multiple users can use simultaneously
- [ ] **Extended Sessions**: Works properly during long sessions

## 8. Security Testing ✅

### Input Validation
- [ ] **XSS Prevention**: HTML/script injection blocked
- [ ] **SQL Injection**: Database injection attempts blocked
- [ ] **File Upload Security**: Malicious files rejected
- [ ] **Input Sanitization**: User input properly sanitized

### Authentication Security
- [ ] **JWT Security**: Tokens properly signed and validated
- [ ] **Token Expiration**: Tokens expire after 30 minutes
- [ ] **Unauthorized Access**: Protected endpoints require authentication
- [ ] **Brute Force Protection**: Login attempts rate limited

### Network Security
- [ ] **HTTPS**: All communications use HTTPS
- [ ] **CORS**: CORS properly configured
- [ ] **Headers**: Security headers present
- [ ] **API Keys**: API keys not exposed in client

## 9. Accessibility Testing ✅

### Screen Reader Compatibility
- [ ] **NVDA**: Works with NVDA screen reader
- [ ] **JAWS**: Works with JAWS screen reader
- [ ] **VoiceOver**: Works with VoiceOver (iOS/macOS)
- [ ] **Content Reading**: All content readable by screen readers

### Keyboard Navigation
- [ ] **Tab Order**: Logical tab order through interface
- [ ] **Focus Indicators**: Visible focus indicators
- [ ] **Keyboard Shortcuts**: All functions accessible via keyboard
- [ ] **Skip Links**: Skip navigation links present

### Visual Accessibility
- [ ] **Color Contrast**: WCAG AA contrast compliance
- [ ] **Text Scaling**: Text scales to 200% without issues
- [ ] **Color Independence**: Information not conveyed by color alone
- [ ] **High Contrast**: Works with high contrast mode

## 10. Error Handling ✅

### Network Errors
- [ ] **Offline**: Graceful handling when offline
- [ ] **Timeout**: Appropriate timeout handling
- [ ] **Server Errors**: 500 errors show user-friendly messages
- [ ] **Rate Limiting**: 429 errors handled appropriately

### User Errors
- [ ] **Invalid Input**: Clear validation messages
- [ ] **File Errors**: Helpful file upload error messages
- [ ] **Authentication Errors**: Clear login error messages
- [ ] **Permission Errors**: Camera permission errors handled

### Recovery
- [ ] **Retry Mechanisms**: Users can retry failed operations
- [ ] **State Preservation**: Form data preserved during errors
- [ ] **Error Reporting**: Errors logged for debugging
- [ ] **Graceful Degradation**: Core features work even with errors

## Test Results Summary

### Overall Results
- **Total Test Categories**: 10
- **Completed Categories**: ___/10
- **Critical Issues Found**: ___
- **Minor Issues Found**: ___
- **Overall Status**: ✅ PASS / ❌ FAIL

### Critical Issues
1. ________________________________
2. ________________________________
3. ________________________________

### Minor Issues
1. ________________________________
2. ________________________________
3. ________________________________

### Recommendations
1. ________________________________
2. ________________________________
3. ________________________________

### Sign-off
- **Tester**: ________________________
- **Date**: __________________________
- **Environment**: Production / Staging
- **Frontend URL**: ___________________
- **Backend URL**: ____________________

---

## Quick Test Commands

### Backend API Test
```bash
# Health check
curl https://your-backend.railway.app/api/health

# Translation test
curl -X POST https://your-backend.railway.app/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "chicken"}'

# Admin login test
curl -X POST https://your-backend.railway.app/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

### Frontend Test
```bash
# Accessibility test
curl -s https://your-frontend.vercel.app | grep -i "lang\|viewport\|title"

# Performance test
curl -w "@curl-format.txt" -o /dev/null -s https://your-frontend.vercel.app
```

This checklist ensures comprehensive testing of all FoodLang AI features across different devices, browsers, and scenarios.