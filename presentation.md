---
marp: true
theme: default
class: lead
size: 16:9
style: |
  :root {
    --color-background: #f8fbff;
    --color-foreground: #2d3748;
    --color-highlight: #3182ce;
    --font-family: 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  }
  h1, h2, h3, h4, h5, h6 {
    color: #1a365d;
    font-weight: 700;
  }
  h1 {
    font-size: 3rem;
  }
  h2 {
    font-size: 2.2rem;
    border-bottom: 2px solid #ebf8ff;
    padding-bottom: 0.5em;
  }
  ul {
    line-height: 1.8;
  }
  li {
    font-size: 1.3rem;
  }
  strong {
    color: #2b6cb0;
  }
  .tech-box {
    display: inline-block;
    background: #ebf8ff;
    color: #2b6cb0;
    padding: 0.5em 1em;
    border-radius: 8px;
    margin: 0.2em;
    font-weight: 600;
    font-size: 1.1rem;
  }
  .demo-box {
    border: 3px dashed #cbd5e0;
    border-radius: 12px;
    padding: 3rem;
    text-align: center;
    background: #edf2f7;
    margin-top: 2rem;
  }
  .icon-text {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  section {
    background-image: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%);
  }
---

# Smart Parking Locator System
## Based in Bangalore

**Computer Science Engineering Project**

*(A modern solution for urban mobility)*

---

<!-- classes: default -->

## 📍 Introduction

- **Urbanization in Bangalore** has led to exponential growth in the number of vehicles.
- Finding a parking spot in busy areas like *Indiranagar, Koramangala, or MG Road* is increasingly difficult.
- The **Smart Parking Locator System** is a digital solution to help drivers find, reserve, and navigate to available parking spaces.
- It aims to save time, reduce traffic congestion, and lower carbon emissions.

---

## 🚦 Problem Statement

Bangalore faces severe urban mobility challenges:

- **Wasted Time:** Drivers spend an average of 15-20 minutes just searching for parking.
- **Traffic Congestion:** Cruising for parking contributes to 30% of city traffic.
- **Fuel Wastage & Pollution:** Unnecessary driving increases carbon footprint and air pollution.
- **Unorganized Parking:** Leads to illegal parking, blocking roads and pedestrian paths.

---

## 💡 Proposed Solution

A **Smart Parking Locator** application tailored for Bangalore:

- **Real-Time Tracking:** View available parking spots on a live city map.
- **Pre-Booking:** Reserve a spot before arriving at the destination.
- **Seamless Navigation:** Integrated maps guide the driver directly to the parking slot.
- **Digital Payments:** Cashless transactions for parking fees.

---

## 🌟 Features of the System

- **Live Availability Status:** Green (Empty), Red (Occupied), Orange (Reserved), EV Bay.
- **Location-Based Search:** 30+ Bangalore tech parks, commercial complexes & transit hubs.
- **Dynamic Pricing Engine:** Multi-factor calculation (Vehicle category, duration, peak rush hour surge, 18% GST).
- **Dual Verification Pass:** Scannable tamper-evident QR Code + 6-digit Quick Gate Entry PIN.
- **IoT Gate Barrier Simulator:** Automated spot barrier validation, vehicle check-in, and check-out with overstay tracking.
- **User Dashboard & Real-Time Navigation:** Active pass tracking, route navigation, and instant cancellation.

---

## 🛠️ Technologies Used

**Frontend:**
<span class="tech-box">HTML5</span> <span class="tech-box">CSS3 (Design Tokens)</span> <span class="tech-box">JavaScript (ES6+)</span>

**Backend & Security:**
<span class="tech-box">Node.js</span> <span class="tech-box">Express.js</span> <span class="tech-box">JWT Auth</span> <span class="tech-box">Bcrypt</span> <span class="tech-box">Helmet</span>

**Database & Persistence:**
<span class="tech-box">MongoDB</span> <span class="tech-box">Resilient In-Memory Datastore</span>

**APIs & Integrations:**
<span class="tech-box">Google Maps JavaScript & Places API</span> <span class="tech-box">IoT Gate Barrier API</span>

---

## ⚙️ Working Overview

1. **User Registration / Login:** Driver authenticates securely using JWT-backed session credentials.
2. **Search Destination:** Driver enters target location or selects from 30+ curated Bangalore hubs.
3. **View Map & Select Bay:** Interactive Google Maps displays live vacant slots, rates, and distances.
4. **Book with Dynamic Pricing:** System computes tiered price based on vehicle type and peak demand.
5. **Receive Verification Pass:** Driver receives a 6-digit Gate PIN and signed QR Pass.
6. **Spot Entry & Barrier Clearance:** Driver presents PIN/QR at the parking spot terminal (`/gate`); barrier raises.
7. **Exit & Settlement:** System tracks parking duration, computes final settlement, and frees slot.

---

## 💻 Demo / Website Preview

<div class="demo-box">
  <h3 style="color: #4a5568; margin-bottom: 10px;">[ Placeholder for Website Animation / Video ]</h3>
  <p style="color: #718096; font-size: 1.1rem;">Play the recorded demo of the Smart Parking Locator interface here showing the map interaction and booking flow.</p>
</div>

---

## 🚀 Advantages

- **Time-Saving:** Eliminates the stress of manual parking searches.
- **Reduced Traffic:** Less cruising means smoother traffic flow on busy Bangalore roads.
- **Eco-Friendly:** Lower fuel consumption leads to reduced emissions.
- **Revenue Optimization:** Helps parking lot owners maximize occupancy and manage spaces efficiently.

---

## 🔮 Future Scope

- **IoT Integration:** Using ground sensors or cameras to detect car presence automatically.
- **EV Charging:** Adding filters to find spots with Electric Vehicle charging stations.
- **Voice Assistance:** "Hey Google, find parking near Brigade Road."
- **Valet Integration:** Expanding the service to include on-demand valet services.

---

## ✅ Conclusion

- The **Smart Parking Locator System** is a practical, scalable solution to one of Bangalore's most persistent daily challenges.
- By leveraging modern web technologies and location services, we can transform the chaotic parking experience into a smooth, predictable process.
- **A smarter city begins with smarter mobility.**

---

# Thank You!

**Any Questions?**
