# 🔧 Environment Setup Guide

## Step 1: Create `.env.local` File

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

## Step 2: Fill in Firebase Configuration

Update `.env.local` with your Firebase config:

```env
VITE_FIREBASE_API_KEY=YOUR_API_KEY_HERE
VITE_FIREBASE_AUTH_DOMAIN=smart-farm-c69be.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=smart-farm-c69be
VITE_FIREBASE_STORAGE_BUCKET=smart-farm-c69be.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=139389413918
VITE_FIREBASE_APP_ID=1:139389413918:web:46fd439d179bebd051dc0f
VITE_FIREBASE_MEASUREMENT_ID=G-80E67N6X08
VITE_FIREBASE_DATABASE_URL=https://smart-farm-c69be-default-rtdb.asia-southeast1.firebasedatabase.app
```

### 📍 Where to Find Firebase Config:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project "smart-farm-c69be"
3. Click ⚙️ **Project Settings**
4. Scroll down to "Your apps" section
5. Copy the config object

## Step 3: Add PromptPay Configuration

```env
VITE_PROMPTPAY_MOBILE=YOUR_PROMPTPAY_MOBILE_NUMBER
```

**Example:** `VITE_PROMPTPAY_MOBILE=0822024218`

## Step 4: Setup Firebase Cloud Functions Credentials

For Firebase Functions (`functions/index.js`), set PromptPay mobile number:

```bash
cd functions/
firebase functions:config:set promptpay.mobile="YOUR_PROMPTPAY_MOBILE"
firebase deploy --only functions
```

Or manually in `functions/.env`:

```env
PROMPTPAY_MOBILE=YOUR_PROMPTPAY_MOBILE
```

**Example:** `PROMPTPAY_MOBILE=0822024218`

## Step 5: Verify Setup

### 1. Check Frontend Environment Variables

In your browser console, verify Firebase is loading:

```javascript
// In browser console:
console.log(import.meta.env.VITE_FIREBASE_PROJECT_ID)
// Should output: "smart-farm-c69be"
```

### 2. Test Firebase Connection

```bash
npm run dev
# Then try logging in or viewing products
```

### 3. Test Cloud Functions

```bash
# Emulate Firebase Functions locally
firebase emulators:start
```

## Step 6: Security Checklist

- ✅ `.env.local` is in `.gitignore` (never commit)
- ✅ `.env.local.example` has placeholder values
- ✅ Never log sensitive data to console in production
- ✅ Use environment variables for all credentials
- ✅ Set Firestore Security Rules properly
- ✅ Enable CORS only for your domain

## Firestore Security Rules

Update `firestore.rules` to restrict database access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // 🔓 Public: Anyone can read active products
    match /products/{product} {
      allow read: if resource.data.status == 'active';
      allow create, update, delete: if request.auth.uid != null && isAdmin();
    }
    
    // 🔒 Private: Users can only read their own orders
    match /orders/{order} {
      allow read: if request.auth.uid == resource.data.userId;
      allow write: if false; // Admin only via Cloud Functions
    }
    
    // 🔒 Private: Users can read their own profile
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}

function isAdmin() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

## Troubleshooting

### ❌ Error: "Firebase API Key not found"
- Check `.env.local` exists in root directory
- Restart dev server after creating `.env.local`
- Verify `VITE_FIREBASE_API_KEY` is set

### ❌ Error: "PromptPay mobile number not found" in functions
- Update Firebase functions config: `firebase functions:config:set promptpay.mobile="YOUR_MOBILE"`
- Deploy functions: `firebase deploy --only functions`
- Check function logs: `firebase functions:log`

### ❌ Error: "onCall is not defined" in functions
- Update `functions/index.js` to use `onCall` from `firebase-functions/v2/https`
- Run `npm install` in `functions/` directory

---

**Last Updated:** 2026-05-08  
**Created By:** Smart Farm Team
