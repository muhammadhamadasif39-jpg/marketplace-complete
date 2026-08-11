# Marketplace — Phase 1 (Foundation)

Yeh Phase 1 hai: **Database + Authentication + Product APIs + Seller Registration**.
Yeh real, runnable backend hai — koi fake/demo code nahi.

## Kya ban chuka hai is phase mein

- ✅ MongoDB database connection
- ✅ User model (buyer/seller/admin roles)
- ✅ Seller model (store profile)
- ✅ Product model (variants, images, reviews ready)
- ✅ Order model (schema ready — checkout logic Phase 2 mein)
- ✅ JWT authentication (register/login/protected routes)
- ✅ Product APIs (create, read, update, delete, search, filter, pagination)
- ✅ Seller store registration
- ✅ Security: password hashing, rate limiting, role-based access control

## Setup Instructions

### 1. MongoDB Atlas account banayein (free)

1. https://www.mongodb.com/cloud/atlas pe jaayein
2. Free account banayein, free cluster (M0) create karein
3. "Connect" > "Drivers" se connection string copy karein
4. Database user banayein (username/password)

### 2. Backend setup

```bash
cd server
npm install
cp .env.example .env
```

`.env` file open karein aur fill karein:
- `MONGO_URI` — apna MongoDB Atlas connection string paste karein
- `JWT_SECRET` — koi bhi lamba random string (ya yeh command chalayein: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)

Phir server chalayein:

```bash
npm run dev
```

Agar sab theek hai to terminal mein yeh dikhega:
```
✅ MongoDB Connected: cluster0.xxxxx.mongodb.net
✅ Server running on http://localhost:5000
```

### 3. API test karein (Postman ya curl se)

**Register a new user:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ahmad","email":"ahmad@example.com","password":"123456","role":"seller"}'
```

Response mein aap ko ek `token` milega — usay copy kar lein.

**Register a store (use the token from above):**
```bash
curl -X POST http://localhost:5000/api/sellers/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"storeName":"Hamad Fashion Store","description":"Premium clothing"}'
```

**Create a product** (aap ko pehle ek Category bhi database mein manually add karni hogi — MongoDB Atlas ke "Browse Collections" se, ya Phase 3 mein category API banega):
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"title":"Blue Kurta","description":"Cotton kurta","category":"CATEGORY_ID_HERE","price":2500,"stock":10}'
```

**Get all products (public, no token needed):**
```bash
curl http://localhost:5000/api/products
```

## Phase 2A — Ab Ban Chuka Hai ✅

- ✅ Category management API (create/read/update/delete)
- ✅ Shopping Cart (add/update/remove/clear items)
- ✅ Wishlist (add/remove products)
- ✅ Checkout system — cart ko order mein convert karta hai:
  - Server-side stock check (kabhi client ko trust nahi karta)
  - Server-side price lock (current DB price use hota hai, client-sent price nahi)
  - Automatic stock deduction
  - Cash on Delivery (COD) turant kaam karta hai — koi external account nahi chahiye
  - Stripe/JazzCash/Easypaisa ke liye fields ready hain, actual payment gateway integration Phase 2B mein
- ✅ Order tracking status (placed → processing → shipped → delivered)
- ✅ Seller order management (apne orders dekhna, status update karna)

### Naye API Endpoints

```
Categories:
GET    /api/categories
POST   /api/categories          (admin only)

Cart:
GET    /api/cart                (login required)
POST   /api/cart                { productId, quantity, variant }
PUT    /api/cart/:productId     { quantity }
DELETE /api/cart/:productId
DELETE /api/cart                (clear all)

Wishlist:
GET    /api/wishlist
POST   /api/wishlist/:productId
DELETE /api/wishlist/:productId

Orders:
POST   /api/orders              { shippingAddress, paymentMethod }  ← checkout
GET    /api/orders/my           (buyer's own orders)
GET    /api/orders/:id
GET    /api/orders/seller/mine  (seller only)
PUT    /api/orders/:id/status   { orderStatus, trackingNumber }  (seller/admin)
```

### Checkout Test Karne Ka Tareeqa

1. Pehle ek category banayein (admin token se) ya MongoDB Atlas se manually add karein
2. Product create karein (seller token se — Phase 1 README dekhein)
3. Cart mein add karein: `POST /api/cart` with `{"productId": "...", "quantity": 2}`
4. Checkout karein:

```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"shippingAddress":{"fullName":"Ahmad","street":"House 123","city":"Islamabad","country":"Pakistan","phone":"03001234567"},"paymentMethod":"cod"}'
```

## Phase 3 — Auth Security (Ab Ban Chuka Hai) ✅

- ✅ **Email Verification** — registration pe verification email jata hai (link 24h valid)
- ✅ **Forgot Password / Reset Password** — secure token-based flow, 1 hour expiry
- ✅ **Refresh Tokens** — access token sirf 15 min chalta hai, refresh token 7 din — session automatically renew hota hai bina user ko baar baar login karne ke
- ✅ **Security hardening**:
  - Reset/verification tokens database mein hash ho kar store hote hain (raw token kabhi save nahi hota)
  - Login/forgot-password pe strict rate limiting (15 min mein sirf 10 attempts)
  - Login error message same hai chahe email exist kare ya na kare (email enumeration se bachne ke liye)
  - Password change hone pe purane sessions automatically logout ho jate hain
  - Access aur refresh tokens alag secrets se sign hote hain

### Email Setup (Zaroori Nahi, Optional)

Agar aap `.env` mein `SMTP_HOST` waghera nahi bharte, to emails **console mein print** ho jayenge (dev mode) — testing ke liye site chalti rahegi. Jab real emails bhejne hon:

- **Gmail**: `smtp.gmail.com`, port 587, aur ek [Gmail App Password](https://myaccount.google.com/apppasswords) banayein
- **Testing ke liye**: [Mailtrap.io](https://mailtrap.io) free sandbox deta hai

### Naye API Endpoints

```
POST /api/auth/refresh              { refreshToken }
GET  /api/auth/verify-email?token=...
POST /api/auth/resend-verification  (login required)
POST /api/auth/logout               (login required)
POST /api/auth/forgot-password      { email }
POST /api/auth/reset-password       { token, password }
```

**Note:** `login` aur `register` ab `token` ki jagah `accessToken` aur `refreshToken` dono return karte hain. Frontend automatically handle karta hai — har 10 minute mein silently naya access token le leta hai, user ko pata bhi nahi chalta.

### Automated Auth Tests (No Database Needed)

`server/test-auth-logic.js` real controller logic ko test karta hai (database ke bina, mocked). Chalane ke liye:

```bash
cd server
node test-auth-logic.js
```

Yeh register, login, refresh token rotation, forgot/reset password, verify email, aur logout — sab test karta hai (24 checks) plus role-based authorization (5 checks). Jab bhi auth code mein koi change karein, yeh dobara chalayein.

## "Buy Now" + Multi-Seller Marketplace

Do zaroori clarifications:

**1. Multi-seller already kaam karta hai** — koi bhi user "seller" role se register kar sakta hai, apna store bana sakta hai (`/seller/store`), apne products list kar sakta hai. Har buyer sab sellers ke products ek hi jagah (`/products`) dekh sakta hai — bilkul Shopify/Daraz jaisa marketplace model.

**2. "Buy Now" button** — product page pe ab do buttons hain:
- **Add to Cart** — purana flow, multiple items jama karke ek saath checkout
- **Buy Now** — cart ko poori tarah bypass karta hai, seedha checkout pe le jata hai sirf usi ek product ke liye. **WhatsApp involved nahi hai** — order seedha database mein save hota hai, seller ke dashboard mein turant dikhta hai.

Security note: Buy Now bhi cart checkout jaisa hi secure hai — stock aur price hamesha **server pe dobara verify** hote hain, client jo bheje us pe trust nahi hota. Maine yeh mocked tests se verify kiya (insufficient stock aur non-existent product dono reject hote hain).

## Payment Gateways (JazzCash, Easypaisa, Stripe)

**Kya bana hai:**
- COD, JazzCash, Easypaisa, aur Stripe (cards) — sab checkout page pe select ho sakte hain
- JazzCash/Easypaisa: order database mein pehle "pending" status se banta hai, phir customer ko gateway ki hosted page pe redirect kiya jata hai. Payment confirm hone ke baad gateway hamare server ko seedha (server-to-server) call karta hai — **yeh confirmation hi trust hoti hai**, browser redirect ko kabhi trust nahi kiya (jaali requests se bachao)
- Har response ka **secure hash verify** hota hai — agar koi values tamper kare (jaise amount badal de), request reject ho jati hai. Maine yeh dono cases test kiye hain (genuine signed response accept, tampered reject)

**Aap ko yeh karna hoga (`server/.env` mein):**
```
JAZZCASH_MERCHANT_ID=<apna merchant ID>
JAZZCASH_PASSWORD=<apna password>
JAZZCASH_INTEGRITY_SALT=<apna integrity salt>

EASYPAISA_STORE_ID=<apna store ID>
EASYPAISA_HASH_KEY=<apna hash key>

SERVER_URL=<aap ka backend jab live ho, uska public URL>
```

**⚠️ Zaroori warning:** Maine yeh dono integrations JazzCash/Easypaisa ki **standard/common** field-naming ke mutabiq likhi hain — lekin dono gateways ke multiple account types hote hain (Instant Pay vs Open API vs HCP) jinke field names thode different ho sakte hain. **Pehli baar test karne se pehle apne merchant dashboard ki integration guide (PDF) se field names cross-check zaroor karein.** Agar koi field match na ho, mujhe error message bhej dein — turant fix kar dunga.

**Stripe** abhi optional hai (aap ke paas account nahi hai) — jab banayenge, bas `STRIPE_SECRET_KEY` aur `STRIPE_WEBHOOK_SECRET` `.env` mein daal dein, sab kuch already wired hai.

## Admin Panel

**Kya bana hai:**
- **Dashboard** — total buyers, sellers, pending approvals, products, orders, revenue
- **User Management** — activate/deactivate accounts (khud ko deactivate nahi kar sakte — safety check)
- **Seller Approval** — pending/approved/rejected, aur commission rate (%) set karna
- **Product Approval** — naya product by-default "pending" hota hai, admin approve kare tabhi public listing mein dikhta hai
- **Category Management** — add karna (edit/delete backend mein hai, UI simple rakha)
- **Coupon Management** — code, percentage/fixed discount, min order amount, max uses, expiry
- **Banner Management** — homepage banners, active/inactive toggle

**Security jo maine test kiya (mocked, 7 checks):**
- Admin khud ko deactivate nahi kar sakta
- Commission rate 100% se zyada reject hota hai
- Coupon 100% se zyada discount reject hota hai
- Expired coupon use nahi ho sakta
- Discount calculation sahi hai (10% off Rs.2000 = Rs.200 verified)

**Pehli baar admin banane ka tareeqa:** Abhi koi UI nahi hai admin banane ka (security reason — warna koi bhi khud ko admin bana leta). MongoDB Atlas mein seedha jaa kar apne user document mein `role: "admin"` set kar dein ek baar, uske baad admin dashboard access ho jayega.

## OTP Verification (Phone Number)

- 6-digit SMS OTP, `/verify-phone` page pe send/verify hota hai
- Twilio use karta hai — agar `.env` mein configure na ho to OTP **console mein print** hota hai (dev mode, jaisa email verification), testing chal sakti hai
- Security: OTP database mein **hashed** store hota hai (raw nahi), 10 minute mein expire hota hai, aur **5 galat attempts ke baad lock** ho jata hai (brute-force se bachao)
- Maine 7 automated tests chalaye: sahi OTP accept, ghalat reject + attempt counter badhna, expired reject, 5 attempts ke baad lock (chahe sahi OTP ho tab bhi)

**🐛 Bug mila aur fix kiya:** `verify-phone` page mein `router.push()` **render ke andar** seedha call ho raha tha (galat React/Next.js pattern) — jab maine `npm run build` chalaya to yeh crash kar raha tha (`ReferenceError: location is not defined`) server-side rendering ke waqt. Maine ise `useEffect` ke andar move kiya (jaisa baaki saari guard-pages mein pehle se tha) — dobara build karke confirm kiya, ab clean pass hota hai. Maine poore codebase mein bhi scan kiya ke yeh pattern kahin aur to nahi — sirf yahi ek jagah tha.

## Design Re-skin (Bazario style)

Ab poora Next.js frontend Bazario HTML demo ka visual design use karta hai:
- **Colors**: deep indigo (`#181A2A`) + saffron-orange (`#FF6A39`) — pehle generic black/gold tha
- **Fonts**: Baloo 2 (headings) + Inter (body) — Google Fonts se `<link>` tag ke zariye load hote hain (build-time fetch nahi, isliye kisi bhi environment mein reliably chalega)
- **Home page**: Bazario jaisa flash-sale banner (working countdown timer), dynamic category chips (database se aate hain)
- **Product cards**: rounded corners, discount badge, hover-lift animation
- **Navbar**: utility bar, rounded search box, sticky header

Yeh sab **automatically poore app mein propagate** ho gaya kyunke maine wahi `brand`/`brand-accent` color names rakhe jo pehle se har page mein use ho rahe the — sirf Tailwind config mein color values badlein.

**Baaqi naya kaam** (agli baari): Reviews & Ratings, Cloudinary Image Upload, User Profile page, Notifications/Toasts, Brand filter + live search debounce.

## Agla Phase (2B, 2C...)

- **2B**: Stripe, JazzCash, Easypaisa live payment integration (aap ke apne merchant accounts chahiye honge)
- **2C**: Next.js frontend pages (buyer-facing UI)
- **2D**: Seller Dashboard (frontend)
- **2E**: Admin Panel (frontend)
- **2F**: Notifications, reviews UI, order tracking UI

Jab yeh Phase 2A test kar lein, batayein — agla sub-phase shuru karte hain.

## Important Security Note

`.env` file kabhi bhi GitHub pe commit na karein. Agar Git use kar rahe hain to `.gitignore` mein `.env` zaroor add karein.
