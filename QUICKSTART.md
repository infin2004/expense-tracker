# Quick Start - Firebase Setup

## Your Current Situation

✅ Project files are ready
❌ Firebase CLI is not installed yet

## Step 1: Install Firebase CLI

Run this command in your terminal (I'll do it for you):

```bash
npm install -g firebase-tools
```

This will take 1-2 minutes to install.

## Step 2: Login to Firebase

After installation completes, run:

```bash
firebase login
```

This will open your browser to authenticate.

## Step 3: Initialize Project

```bash
firebase init
```

Select:
- ☑ Firestore
- ☑ Hosting

Follow the prompts (use existing values).

## Step 4: Get Firebase Config

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Project Settings → Web App
3. Copy the config
4. Update in `public/index.html` (lines 165-172)

## Step 5: Deploy

```bash
firebase deploy
```

---

**I'll install Firebase CLI for you now...**
