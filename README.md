# 🅿️ ParkWise — Enterprise Smart Parking Locator & Reservation System

[![Node.js Version](https://img.shields.io/badge/node.js-v18%2B-brightgreen.svg?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/express.js-v4.19-black.svg?style=flat-square&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Ready%20%2B%20InMemory%20Failover-green.svg?style=flat-square&logo=mongodb)](https://mongodb.com/)
[![JWT Auth](https://img.shields.io/badge/Security-JWT%20%2B%20Bcrypt-orange.svg?style=flat-square&logo=jsonwebtokens)](https://jwt.io/)
[![IoT Gate Verification](https://img.shields.io/badge/IoT-Barrier%20Pass%20%26%20PIN%20Scanner-blue.svg?style=flat-square)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)

> A full-stack, enterprise-grade urban mobility solution designed to eliminate cruising traffic, enable real-time spot reservations, provide multi-factor dynamic pricing, and simulate automated IoT gate barrier verification across 30+ major commercial and tech hubs in **Bengaluru, India**.

---

## 📌 Problem Statement & Solution

Urban drivers in metropolitan hubs spend **15–20 minutes on average** searching for vacant parking spaces, generating up to **30% of urban traffic congestion**, increasing carbon emissions, and causing lost economic productivity.

**ParkWise** solves this with an end-to-end digital mobility platform:
1. **Live Spot Discovery:** Visualizes vacant and occupied parking bays on interactive Google Maps with real-time status (Available / Full / Reserved / EV Bay).
2. **Instant Pre-Booking:** Locks parking bays with conflict-free reservation logic and dynamic rate calculation.
3. **Dual Verification Pass:** Generates high-density **Scannable QR Codes** and a **6-Digit Quick Gate Entry PIN** (`e.g. 849-204`) for automated spot barrier terminals.
4. **IoT Gate Barrier Simulator:** Includes an interactive barrier terminal simulator (`/gate`) that verifies passes, validates vehicle registrations, tracks parking duration, and computes checkout settlements.

---

## 🏛️ System Architecture

```
                                  ┌──────────────────────────────────────────────┐
                                  │           Client Layer (Frontend)            │
                                  │  - Driver Web App (dashboard.html)           │
                                  │  - IoT Gate Terminal (gate-simulator.html)   │
                                  └──────────────────────┬───────────────────────┘
                                                         │
                                               HTTPS / REST API
                                                         │
                                  ┌──────────────────────▼───────────────────────┐
                                  │          Express API & Security Gateway      │
                                  │  - Helmet HTTP Security Headers              │
                                  │  - CORS & Rate Limiting                      │
                                  │  - JWT Verification Middleware                │
                                  └──────────────────────┬───────────────────────┘
                                                         │
       ┌──────────────────────┬──────────────────────────┼──────────────────────────┬──────────────────────┐
       │                      │                          │                          │                      │
┌──────▼──────┐       ┌───────▼───────┐          ┌───────▼───────┐          ┌───────▼───────┐      ┌───────▼───────┐
│ Auth Module │       │ Parking Module│          │ Booking Engine│          │ Gate IoT API  │      │ Stats Module  │
│ - Register  │       │ - Geocoding   │          │ - Reservation │          │ - PIN Verify  │      │ - Occupancy % │
│ - Bcrypt    │       │ - Haversine   │          │ - Dynamic Fee │          │ - Check-In    │      │ - Analytics   │
│ - JWT Tokens│       │ - Bangalore DB│          │ - QR Payload  │          │ - Check-Out   │      │ - Health Check│
└──────┬──────┘       └───────┬───────┘          └───────┬───────┘          └───────┬───────┘      └───────┬───────┘
       │                      │                          │                          │                      │
       └──────────────────────┴──────────────────────────┼──────────────────────────┴──────────────────────┘
                                                         │
                                  ┌──────────────────────▼───────────────────────┐
                                  │          Resilient Persistence Layer         │
                                  │  - Primary: MongoDB Connector (Mongoose)     │
                                  │  - Failover: Embedded In-Memory Data Engine  │
                                  │    (Auto-activates if MongoDB is offline)    │
                                  └──────────────────────────────────────────────┘
```

---

## ✨ Key Technical Features

### 1. ⚡ Dynamic Multi-Factor Pricing Engine
ParkWise calculates real-time fees using a tiered pricing algorithm:
- **Vehicle Category Multiplier:**
  - 🛵 Two-Wheeler (Bike/Scooter): `0.5x`
  - 🚗 Hatchback / Compact: `0.85x`
  - 🚘 Sedan / Prime: `1.0x`
  - 🚙 SUV / Luxury: `1.3x`
  - ⚡ EV Dedicated Bay: `1.4x` + flat charging fee
- **Time-of-Day Surge:** Automatically detects peak traffic windows (`08:30–11:30 AM` and `05:00–08:30 PM`) to apply a `1.25x` surge multiplier.
- **GST Tax Breakdown:** Computes statutory 18% GST (CGST 9% + SGST 9%) with itemized receipts.

### 2. 📟 Dual Verification Pass & Barrier Terminal Simulator
- **6-Digit Gate Entry PIN:** Drivers can type their PIN at automated parking barriers or show it to lot attendants.
- **HMAC Signed QR Pass:** Cryptographically signed QR payload resistant to tampering.
- **Live Terminal Simulator (`/gate`):** An interactive UI modeling the hardware barrier arm, traffic lights (Red/Green), vehicle validation, check-in, and check-out with overstay penalty calculations.

### 3. 🛡️ Resilient Zero-Setup Database Engine
- **Primary:** Connects to MongoDB (`mongodb://127.0.0.1:27017/parkwise`).
- **Failover:** If MongoDB is offline, ParkWise automatically initializes an embedded, high-performance in-memory datastore seeded with Bangalore parking locations. The application **never crashes** and runs out-of-the-box on any reviewer's machine.

### 4. 📍 Bangalore Location Geocoding
- 30+ curated tech parks and commercial hubs (Koramangala, Indiranagar 100ft Road, ITPL Whitefield, UB City, MG Road, Manyata Tech Park, Electronic City, etc.) with accurate GPS coordinates.

---

## 📡 REST API Reference

### Authentication Endpoints
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/register` | Register driver account with vehicle metadata | No |
| `POST` | `/api/login` | Authenticate driver & issue JWT token | No |
| `GET` | `/api/me` | Retrieve authenticated user profile | Bearer Token |

### Parking & Locations
| Method | Endpoint | Description | Query Parameters |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/parking` | Load nearby spots with availability status | `lat`, `lng`, `area` |
| `GET` | `/api/search` | Search Bangalore hubs by keyword | `q` (e.g. `whitefield`) |
| `GET` | `/api/areas` | Get all supported Bangalore parking zones | None |
| `GET` | `/api/parking/nearest` | Find closest available empty spot | `lat`, `lng` |

### Booking & Reservation
| Method | Endpoint | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/book` | Reserve slot, calculate dynamic price, issue Pass | `{ lat, lng, spotId, username, area, durationHours, vehicleType }` |
| `POST` | `/api/cancel` | Cancel active booking & free slot | `{ bookingId, username }` |
| `GET` | `/api/mybooking/:user` | Get driver's active booking pass & PIN | Route param `:username` |
| `POST` | `/api/pricing/estimate` | Preview price breakdown before booking | `{ baseRate, durationHours, vehicleType, spotType }` |

### Gate / IoT Terminal Verification
| Method | Endpoint | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/gate/verify-pass` | Validate 6-digit PIN or QR payload at spot barrier | `{ code: "849201" }` or `{ qrPayload }` |
| `POST` | `/api/gate/check-in` | Record vehicle entry & raise barrier | `{ gatePin: "849201" }` |
| `POST` | `/api/gate/check-out` | Record vehicle exit, compute overstay, free slot | `{ gatePin: "849201" }` |
| `GET` | `/api/gate/events` | Retrieve recent gate barrier event logs | None |

### Platform Analytics
| Method | Endpoint | Description | Response Data |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/stats` | System metrics & occupancy percentage | `{ totalUsers, totalBookings, availableSpots, occupancyRatePercent }` |
| `GET` | `/api/admin/bookings` | Complete booking history log | Array of bookings |

---

## 🛠️ Technology Stack

- **Backend:** Node.js, Express.js, JavaScript (ES6+)
- **Security:** JSON Web Tokens (JWT), Bcrypt.js, Helmet, CORS
- **Database:** MongoDB / Mongoose with Resilient In-Memory Datastore Failover
- **Geospatial:** Haversine Great-Circle Distance Algorithm, Google Maps Places API
- **Frontend:** Vanilla HTML5, CSS3 (Luxury Ivory & Forest Design System), JavaScript (ES6)
- **Testing:** Node.js HTTP Automated Integration Suite

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v16.x or higher)
- *Optional:* Local or Cloud MongoDB instance (ParkWise works seamlessly even without MongoDB)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/ananyagoyal04/Online-Parking-simulator-website.git
cd Online-Parking-simulator-website/backend
npm install
```

### 2. Configure Environment Variables (Optional)
Copy the example environment file:
```bash
cp ../.env.example .env
```

### 3. Start the Backend API Server
```bash
npm start
```
The server will start at:
- **API Base:** `http://localhost:5000`
- **Gate Barrier Terminal Simulator:** `http://localhost:5000/gate`
- **Health Check:** `http://localhost:5000/`

### 4. Run Automated Integration Tests
```bash
npm test
```

### 5. Launch the Driver Web Application
Open `frontend/index.html` in any web browser (or serve with VS Code Live Server / Vite).

---

## 📂 Project Directory Structure

```
parking-app/
├── backend/
│   ├── config/
│   │   ├── bangaloreAreas.js      # Curated Bangalore hubs with GPS coordinates
│   │   ├── db.js                  # Resilient DB adapter (MongoDB + In-Memory Failover)
│   │   └── pricingConfig.js       # Dynamic pricing, surge rules & vehicle multipliers
│   ├── controllers/
│   │   ├── authController.js      # User registration & JWT authentication
│   │   ├── bookingController.js   # Slot reservations, pricing & cancellations
│   │   ├── gateController.js      # IoT Gate terminal verification & check-in/out
│   │   ├── parkingController.js   # Spot discovery, search & nearest calculation
│   │   └── statsController.js     # Analytics and platform metrics
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT authentication guard
│   │   └── errorMiddleware.js     # Centralized error handler
│   ├── models/
│   │   ├── Booking.js             # Booking schema with Gate PIN & lifecycle
│   │   ├── Spot.js                # Parking spot schema & statuses
│   │   └── User.js                # User schema with bcrypt password hashing
│   ├── public/
│   │   └── gate-simulator.html    # Interactive IoT Gate Barrier Scanner UI
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── bookingRoutes.js
│   │   ├── gateRoutes.js
│   │   ├── parkingRoutes.js
│   │   └── statsRoutes.js
│   ├── tests/
│   │   └── api.test.js            # Automated test suite (12 test scenarios)
│   ├── utils/
│   │   ├── geo.js                 # Haversine distance calculations
│   │   ├── passGenerator.js       # 6-digit PIN & cryptographic QR builder
│   │   └── pricingEngine.js       # Multi-factor dynamic price computation
│   ├── package.json
│   └── server.js                  # Express application entrypoint
├── frontend/
│   ├── dashboard.html             # Driver booking & real-time map interface
│   ├── index.html                 # Authentication & landing portal
│   ├── map.html                   # Standalone Bangalore map view
│   └── style.css
├── .env.example                   # Environment configuration template
├── .gitignore                     # Git ignore rules (node_modules, logs, etc.)
├── presentation.md                # Project presentation slides
└── README.md                      # Complete system documentation
```

---

## 🔮 Future Roadmap

- [ ] **Hardware IoT Integration:** ESP32 / Arduino ultrasonic distance sensors for physical slot occupancy detection.
- [ ] **FASTag / Automated Toll-Gate Reader:** Automatic deduction of parking charges upon vehicle exit via RFID.
- [ ] **Predictive AI Occupancy:** Machine learning forecasting of bay availability based on historical traffic patterns and weather.
- [ ] **EV Charging Smart Scheduler:** Real-time charging rate control and bay swap notifications.

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
