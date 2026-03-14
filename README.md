# Shop Manager App

A full-stack shop management web application with inventory, sales, and contacts management.

**Want to run on your phone without a PC?** → See [DEPLOYMENT.md](./DEPLOYMENT.md) for cloud deployment (free tier).

## Tech Stack

- **Backend:** Node.js, Express
- **Database:** MongoDB (Mongoose)
- **Frontend:** React, Vite, TailwindCSS
- **Auth:** JWT

## Folder Structure

```
shop-manager-app/
├── backend/
│   ├── config/          # Database & env config
│   ├── controllers/     # Request handlers
│   ├── models/          # Mongoose models
│   ├── database/        # Seed script
│   ├── middleware/      # Auth, error handling
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/     # Auth context
│   │   ├── pages/
│   │   ├── services/    # API client
│   │   └── App.jsx
│   └── index.html
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login (returns JWT) |
| GET | /api/dashboard | Dashboard stats |
| GET | /api/products | List products |
| POST | /api/products | Create product |
| GET | /api/products/:id | Get product |
| PUT | /api/products/:id | Update product |
| DELETE | /api/products/:id | Delete product |
| GET | /api/categories | List categories |
| POST | /api/categories | Create category |
| GET | /api/customers | List customers |
| POST | /api/customers | Create customer |
| PUT | /api/customers/:id | Update customer |
| DELETE | /api/customers/:id | Delete customer |
| GET | /api/suppliers | List suppliers |
| POST | /api/suppliers | Create supplier |
| GET | /api/sales | List sales |
| POST | /api/sales | Create sale |
| GET | /api/sales/:id | Get sale (invoice) |

All except `/api/auth/login` require: `Authorization: Bearer <token>`

## Sample API Requests

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@shop.com","password":"admin123"}'
```

### Create Product (with token)
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name":"Widget","sku":"WID-001","price":9.99,"stock_quantity":100,"category_id":"MONGODB_CATEGORY_ID"}'
```
Note: Use a valid MongoDB ObjectId for `category_id`, or omit it.

### Create Sale
```bash
curl -X POST http://localhost:5000/api/sales \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"items":[{"product_id":"MONGODB_PRODUCT_ID","quantity":2,"unit_price":9.99,"subtotal":19.98}],"total_amount":19.98}'
```
Note: Use valid MongoDB ObjectIds for `product_id`.

## Setup & Run

### 1. Database

Make sure MongoDB is running locally. Then seed the default admin and categories:

```bash
cd backend
npm install
node database/seed.js
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env if needed (default: mongodb://localhost:27017/shop_manager)

npm run dev
```

Backend runs on http://localhost:5000

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:3000 (proxies /api to backend)

### 4. Login

- **Email:** admin@shop.com  
- **Password:** admin123

### 5. Install on Phone (PWA)

The app is a **Progressive Web App (PWA)** and can be installed on your phone:

1. **Deploy** the app (e.g. Vercel, Netlify) or use your computer’s local IP so your phone can reach it (see below).
2. **Open** the app in your phone’s browser (Chrome on Android, Safari on iPhone).
3. **Android (Chrome):** Tap the menu (⋮) → “Add to Home screen” or “Install app”.
4. **iPhone (Safari):** Tap the Share button → “Add to Home Screen”.

**Testing on your network:** Run the backend and frontend, then on your phone open `http://YOUR_COMPUTER_IP:3000` (use the same Wi‑Fi). For production, deploy with HTTPS.  

## Features

- ✅ Admin login/logout with JWT
- ✅ Role-based access (admin/manager/staff)
- ✅ Inventory: add, edit, delete products
- ✅ Categories, low stock alerts
- ✅ Sales: create orders, auto stock update
- ✅ Sales history & invoice view
- ✅ Customers & suppliers management
- ✅ Dashboard with stats, recent transactions, low stock alerts

## Database (MongoDB)

Collections and main fields:

- **users** – email, password_hash, name, role
- **categories** – name, description
- **products** – name, sku, category (ref), price, stock_quantity, low_stock_threshold
- **customers** – name, phone, email, address
- **suppliers** – name, phone, email, address
- **sales** – sale_number, customer (ref), total_amount, status, items[]
