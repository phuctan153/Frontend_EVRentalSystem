# API Analysis Report - Hardcoded URLs Analysis

**Date:** May 23, 2026  
**Project:** SWP391 Frontend (EV Rental System)

---

## 📋 Executive Summary

**Total Hardcoded API Calls Found:** 20+ instances of `http://localhost:8080`

**Current .env Configuration:**
```
REACT_APP_BACKEND_URL=https://ev-rental-backend.onrender.com
REACT_APP_API_URL=https://ev-rental-backend.onrender.com
```

**Recommendation:** ✅ **YES, just changing .env is NOT enough!** You need to refactor all hardcoded URLs to use environment variables.

---

## 🔴 Detailed Hardcoded API Locations

### 1. **src/components/StaffInterface/services/authServices.ts** (CRITICAL - 30+ calls)
- **Line 3:** `const baseURL = 'http://localhost:8080';` ⚠️
- **Line 8, 21, 40, 55, 70, 81, 96, 111, 126, 140, 158, 175, 190, 212, 233, 252, 267, 282, 302, 330, 352, 368, 384, 404, 425, 445, 464, 484, 505, 524, 545, 586**
- Multiple staff interface API calls using hardcoded baseURL

**Impact:** Staff interface won't work with production backend unless URL is manually changed in this file.

---

### 2. **src/components/XacNhanTraXe/components/DepositPage.tsx** (CRITICAL - 7 calls)
- **Line 83:** `http://localhost:8080/api/bookings/${bookingId}`
- **Line 107:** `http://localhost:8080/api/vehicle/detail/${vehicleId}`
- **Line 124:** `http://localhost:8080/api/invoices/bookings/${bookingId}/invoices`
- **Line 204:** `http://localhost:8080/api/invoices/bookings/${bookingId}/invoices/deposit`
- **Line 215:** `http://localhost:8080/api/invoices/bookings/${bookingId}/invoices`
- **Line 264:** `http://localhost:8080/api/payments/invoice/${invoiceId}/momo`
- **Line 323:** `http://localhost:8080/api/payments/invoice/${invoiceId}/payos`

**Impact:** Deposit payment page won't work with production backend.

---

### 3. **src/components/UserProfile/UserProfile.tsx** (HIGH - 2 calls)
- **Line 31:** `http://localhost:8080/api/renter/profile`
- **Line 45:** `http://localhost:8080/api/wallet/${renterData.walletId}`

**Impact:** User profile won't load on production.

---

### 4. **src/components/layouts/Navbar.tsx** (HIGH - 1 call)
- **Line 54:** `http://localhost:8080/api/notifications/my`

**Impact:** Notifications won't load on production.

---

### 5. **src/components/HistoryPage/RentalHistoryPage.tsx** (HIGH - 4 calls)
- **Line 63:** `http://localhost:8080/api/renter/profile`
- **Line 90:** `http://localhost:8080/api/renter/bookings`
- **Line 100:** `http://localhost:8080/api/contracts/${bk.bookingId}`
- **Line 115:** `http://localhost:8080/api/bookings/${bk.bookingId}/rating` (inside map loop)

**Impact:** Rental history page won't work on production.

---

### 6. **src/pages/PaymentResultPage.tsx** (HIGH - 1 call)
- **Line 36:** `http://localhost:8080/api/payments/momo/ipn`

**Impact:** MoMo payment callback won't work on production.

---

### 7. **src/pages/VehicleDetailPage.tsx** (COMMENTED - 1 call)
- **Line 114:** `// const res2 = await axios.put('http://localhost:8080/api/bookings/${res.bookingId}/status/reserved')`

**Impact:** Currently commented but still a risk if uncommented.

---

### ✅ Files Using Environment Variables (CORRECT PATTERN)

#### **src/services/apiClient.ts** (BEST PRACTICE)
```typescript
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,  ✅ Using .env
});
```

#### **src/services/authService.ts** (MIXED - Has fallback)
```typescript
const baseURL = process.env.REACT_APP_API_URL || "http://localhost:8080";  ⚠️ Has hardcoded fallback
```

#### **src/services/kycService.ts** (MIXED - Has fallback)
```typescript
const baseURL = process.env.REACT_APP_API_URL || "http://localhost:8080";  ⚠️ Has hardcoded fallback
```

---

## 📊 Statistics

| Category | Count |
|----------|-------|
| Directly Hardcoded URLs | 20+ |
| Files with Hardcoded URLs | 7 |
| Files Using .env Correctly | 1 (apiClient.ts) |
| Files with Fallback to Hardcode | 2 (authService, kycService) |
| Critical Components Affected | 5 |
| **Total Risk Level** | **🔴 HIGH** |

---

## 🎯 Recommended Solution

### **Option 1: Quick Fix (Recommended for immediate deployment)**
1. Replace all `http://localhost:8080` with environment variables
2. Update `.env` file with correct backend URL
3. All components will automatically use the new URL

### **Option 2: Clean Refactoring (Recommended for long-term)**
1. Create a centralized API config file
2. Export a function that builds API URLs with environment variables
3. Use this function everywhere instead of hardcoding
4. Remove all hardcoded URLs permanently

---

## 🔧 Quick Migration Steps

### Step 1: Create a Config File
Create `src/config/apiConfig.ts`:
```typescript
export const API_BASE_URL = process.env.REACT_APP_API_URL || process.env.REACT_APP_BACKEND_URL;

export const buildApiUrl = (endpoint: string) => {
  return `${API_BASE_URL}${endpoint}`;
};
```

### Step 2: Update Services
Instead of:
```typescript
`http://localhost:8080/api/bookings/${bookingId}`
```

Use:
```typescript
buildApiUrl(`/api/bookings/${bookingId}`)
```

### Step 3: Files to Update
- [ ] src/components/StaffInterface/services/authServices.ts
- [ ] src/components/XacNhanTraXe/components/DepositPage.tsx
- [ ] src/components/UserProfile/UserProfile.tsx
- [ ] src/components/layouts/Navbar.tsx
- [ ] src/components/HistoryPage/RentalHistoryPage.tsx
- [ ] src/pages/PaymentResultPage.tsx
- [ ] src/pages/VehicleDetailPage.tsx

---

## ⚠️ Important Notes

1. **Changing .env alone is NOT sufficient** - The hardcoded URLs will still use `http://localhost:8080` regardless of the .env values.

2. **Environment variables are NOT automatically picked up** - You must reference them in your code using `process.env.REACT_APP_*`

3. **Fallback values can cause confusion** - Always use environment variables without hardcoded fallbacks to make deployment issues obvious during testing.

4. **Production URLs** - Ensure `.env` has the correct production URL before building:
   ```
   REACT_APP_BACKEND_URL=https://ev-rental-backend.onrender.com
   REACT_APP_API_URL=https://ev-rental-backend.onrender.com
   ```

---

## ✅ Verification Checklist

After refactoring:
- [ ] All `http://localhost:8080` replaced with environment variables
- [ ] No hardcoded URLs in component files
- [ ] All API calls use centralized config
- [ ] Tested with different `.env` configurations
- [ ] Production `.env` file verified
- [ ] Build process tested for environment variable substitution
- [ ] Network requests verified in browser DevTools to use correct URLs

---

**Status:** 🔴 **ACTION REQUIRED - HIGH PRIORITY**

**Next Steps:**
1. Refactor all hardcoded URLs to use environment variables
2. Create centralized API configuration
3. Test with production backend URL before deployment

