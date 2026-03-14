# Deploy Shop Manager (Run on Phone Without PC)

To use the app on your phone anywhere (no PC needed), deploy to the cloud. Free tiers are available.

## Overview

| Part      | Service     | Free? |
|-----------|-------------|-------|
| Database  | MongoDB Atlas | ✅ Yes |
| Backend   | Render      | ✅ Yes |
| Frontend  | Vercel      | ✅ Yes |

---

## Step 1: MongoDB Atlas (Cloud Database)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a free account.
2. Create a **free cluster** (M0).
3. Click **Connect** → **Drivers** → copy the connection string.
4. Replace `<password>` with your database user password.
5. Add your IP to the network access list, or use `0.0.0.0/0` for "Allow from anywhere" (fine for learning).
6. Save the URI, e.g. `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/shop_manager`

---

## Step 2: Deploy Backend to Render

1. Push your code to **GitHub** (if not already).
2. Go to [render.com](https://render.com) and sign up.
3. **New** → **Web Service**.
4. Connect your GitHub repo and select the `shop bag` (or your project) folder.
5. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free

6. **Environment Variables** (Add):
   - `MONGODB_URI` = your Atlas connection string
   - `JWT_SECRET` = any long random string (e.g. `mySecretKey123!@#`)

7. Click **Create Web Service**. Wait for deploy.
8. Copy your backend URL, e.g. `https://shop-manager-api.onrender.com`

9. **Seed the database** (create admin user):
   - On your PC, open a terminal in the project folder.
   - Run: `cd backend && MONGODB_URI="your-atlas-uri" node database/seed.js`
   - Replace `your-atlas-uri` with the same connection string from step 1.

---

## Step 3: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up.
2. **Add New** → **Project** → Import your GitHub repo.
3. Settings:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite

4. **Environment Variables** (Add):
   - `VITE_API_URL` = `https://YOUR-RENDER-URL.onrender.com/api`
   - (Use the exact backend URL from Step 2 + `/api`)

5. Click **Deploy**.

6. After deploy, you get a URL like `https://shop-manager-xxx.vercel.app`

---

## Step 4: Use on Your Phone

1. Open the Vercel URL on your phone’s browser.
2. Log in: **admin@shop.com** / **admin123**
3. Add to home screen for an app-like experience.

The app will work anywhere, as long as you have internet, without your PC.

---

## Troubleshooting

- **Backend sleep:** Free Render services sleep after ~15 minutes of no use. The first request may take 30–60 seconds to wake up.
- **CORS errors:** The backend allows all origins. If you see CORS issues, ensure `VITE_API_URL` points to your backend URL and that the backend is running.
- **MongoDB connection:** Check that your Atlas IP allowlist includes `0.0.0.0/0` or your Render IPs.
