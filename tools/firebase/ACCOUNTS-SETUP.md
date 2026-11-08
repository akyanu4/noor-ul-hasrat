# Turning on accounts (sign-in by email link)

Everything here is free. Do the steps in order; none of the keys go into the code or chat.

## 1. A Gmail account for the app
1. Use or create a Gmail address for the app (for example noorulhasrat.app@gmail.com).
2. In that Google account turn on **2-Step Verification** (myaccount.google.com → Security).
3. Make an **App password**: myaccount.google.com/apppasswords → name it "Noor" → copy the 16 letters.

## 2. Firebase service account
Firebase console → project **siddiqgulshan-25903** → ⚙ Project settings → **Service accounts** →
**Generate new private key**. A .json file downloads. Keep it private; it is the master key to the database.

## 3. Vercel environment variables
Vercel → project noor-ul-hasrat → Settings → Environment Variables (Production), add:
- `FIREBASE_SERVICE_ACCOUNT` = the whole contents of the .json file
- `GMAIL_USER` = the Gmail address from step 1
- `GMAIL_APP_PASSWORD` = the 16-letter app password
Then Deployments → ⋯ → **Redeploy** the latest deployment.

## 4. Database rules
Firebase console → Realtime Database → **Rules**. Inside `"rules": { ... }`, keep what is there and add a comma
after the last entry, then paste this, then **Publish**:

```
  "admins": {
    "$uid": {
      ".read": "auth != null && auth.uid === $uid"
    }
  },
  "profiles": {
    ".read": "auth != null && root.child('admins').child(auth.uid).val() === true",
    "$uid": {
      ".read": "auth != null && auth.uid === $uid",
      ".write": "auth != null && auth.uid === $uid && auth.token.em != null",
      ".validate": "newData.child('email').val() === auth.token.em && newData.child('name').isString() && newData.child('name').val().length <= 60",
      "phone": {
        ".validate": "newData.isString() && newData.val().length <= 20"
      },
      "city": {
        ".validate": "newData.isString() && newData.val().length <= 40"
      }
    }
  },
  "summaries": {
    ".read": "auth != null && root.child('admins').child(auth.uid).val() === true",
    "$uid": {
      ".read": "auth != null && auth.uid === $uid",
      ".write": "auth != null && auth.uid === $uid && auth.token.em != null",
      ".validate": "newData.child('score').isNumber()"
    }
  },
  "iman": {
    ".read": "auth != null && root.child('admins').child(auth.uid).val() === true",
    "$uid": {
      ".read": "auth != null && auth.uid === $uid",
      ".write": "auth != null && auth.uid === $uid && auth.token.em != null",
      "days": {
        "$day": {
          ".validate": "$day.matches(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/)"
        }
      }
    }
  },
  "authlinks": {
    ".read": false,
    ".write": false
  }
```

## 5. Make yourself the admin
1. On your phone open https://noor-ul-hasrat.vercel.app/?accounts=1 → create your account → open the email link.
2. Open https://noor-ul-hasrat.vercel.app/admin.html → it shows your account id → **Copy id**.
3. Firebase console → Realtime Database → **Data** → `+` on the top row → key `admins` → inside it,
   key = your id, value = `true` (boolean). Reload admin.html: you see the members list.

## 6. Switch it on for everyone
Set `accountsOn: true` in js/config.js and deploy.
