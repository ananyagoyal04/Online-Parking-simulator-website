/**
 * ParkWise Enterprise API Automated Verification & Test Suite
 */

const http = require("http");

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: "localhost",
        port: 5000,
        path,
        method,
        headers: {
          "Content-Type": "application/json",
          ...(payload && { "Content-Length": Buffer.byteLength(payload) }),
          ...headers
        }
      },
      res => {
        let data = "";
        res.on("data", chunk => (data += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log("🧪 Starting ParkWise End-to-End API Test Suite...\n");

  let testsPassed = 0;
  let testsFailed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`  ✅ [PASS] ${name}`);
      testsPassed++;
    } else {
      console.error(`  ❌ [FAIL] ${name}`);
      testsFailed++;
    }
  }

  try {
    // 1. Root & Health
    const health = await request("GET", "/");
    assert(health.status === 200 && health.data.status === "online", "GET / - Health Check & System Status");

    // 2. Auth - Register
    const testUser = `tester_${Date.now()}`;
    const reg = await request("POST", "/api/register", {
      username: testUser,
      password: "password123",
      email: `${testUser}@example.com`,
      vehicleNumber: "KA-05-AB-1234",
      vehicleType: "sedan"
    });
    assert(reg.status === 201 && reg.data.token, "POST /api/register - Driver Registration & JWT Issuance");

    // 3. Auth - Login
    const login = await request("POST", "/api/login", {
      username: testUser,
      password: "password123"
    });
    assert(login.status === 200 && login.data.token, "POST /api/login - Driver Authentication");

    // 4. Parking - Search Areas
    const search = await request("GET", "/api/search?q=koramangala");
    assert(search.status === 200 && Array.isArray(search.data) && search.data.length > 0, "GET /api/search - Bangalore Area Query");

    // 5. Parking - Load Spots
    const spots = await request("GET", "/api/parking?lat=12.9279&lng=77.6271&area=Koramangala");
    assert(spots.status === 200 && Array.isArray(spots.data) && spots.data.length >= 10, "GET /api/parking - Coordinate Geocoding & Realistic Spots");

    // 6. Pricing - Estimate
    const estimate = await request("POST", "/api/pricing/estimate", {
      baseRate: 40,
      durationHours: 2,
      vehicleType: "suv",
      spotType: "standard"
    });
    assert(estimate.status === 200 && estimate.data.pricing.totalAmount > 0, "POST /api/pricing/estimate - Dynamic Multi-Factor Price Calculation");

    // 7. Booking - Reserve Spot & Generate Gate Pass
    const emptySpot = spots.data.find(s => s.status === "empty") || spots.data[0];
    const booking = await request("POST", "/api/book", {
      lat: 12.9279,
      lng: 77.6271,
      spotId: emptySpot.id,
      username: testUser,
      area: "Koramangala",
      durationHours: 2,
      vehicleType: "sedan"
    });
    assert(booking.status === 201 && booking.data.gatePin && booking.data.bookingId, "POST /api/book - Spot Reservation, Dynamic Price & Gate PIN Issuance");

    const createdBookingId = booking.data.bookingId;
    const createdGatePin = booking.data.gatePin;

    // 8. Booking - My Active Booking Pass
    const myBooking = await request("GET", `/api/mybooking/${testUser}`);
    assert(myBooking.status === 200 && myBooking.data.booking && myBooking.data.booking.bookingId === createdBookingId, "GET /api/mybooking/:user - Active Pass & Verification Code Retrieval");

    // 9. Gate Verification - Verify 6-digit PIN at Spot Barrier
    const gateVerify = await request("POST", "/api/gate/verify-pass", {
      code: createdGatePin
    });
    assert(gateVerify.status === 200 && gateVerify.data.accessGranted === true, "POST /api/gate/verify-pass - IoT Spot Terminal PIN Verification");

    // 10. Gate - Vehicle Check-In
    const checkIn = await request("POST", "/api/gate/check-in", {
      gatePin: createdGatePin
    });
    assert(checkIn.status === 200 && checkIn.data.barrierOpened === true, "POST /api/gate/check-in - Spot Barrier Raise & Entry Validation");

    // 11. Gate - Vehicle Check-Out & Settlement
    const checkOut = await request("POST", "/api/gate/check-out", {
      gatePin: createdGatePin
    });
    assert(checkOut.status === 200 && checkOut.data.invoice && checkOut.data.invoice.totalSettlement > 0, "POST /api/gate/check-out - Exit Duration Calculation & Spot Clearance");

    // 12. Stats - System Analytics
    const stats = await request("GET", "/api/stats");
    assert(stats.status === 200 && stats.data.totalSpots > 0, "GET /api/stats - Platform Metrics & Resilient Database Status");

    console.log(`\n========================================`);
    console.log(`📊 Test Results: ${testsPassed} Passed, ${testsFailed} Failed`);
    console.log(`========================================\n`);

    if (testsFailed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error("❌ Test runner exception:", err);
    process.exit(1);
  }
}

runTests();
