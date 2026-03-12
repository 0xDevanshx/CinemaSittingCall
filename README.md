
# 🎬 Cinema Seat Calling System

A **real-time cinema assistance dashboard** that allows theater staff to see which seats are requesting service.

Each seat can send a **"call request"**, which appears on a **live dashboard**.  
Staff can then **reset the request once service is provided**.

The system is designed to integrate with **ESP8266 / IoT buttons installed under cinema seats**.

---

# 📸 System Overview

The system has **three major components**:

```

ESP8266 Seat Button
│
│ HTTP POST
▼
Node.js Server (Socket.IO)
│
│ WebSocket
▼
React Dashboard

```

### Flow

1. A seat presses a button (ESP8266)
2. ESP8266 sends a request to the server
3. Node server updates seat state
4. Server broadcasts update using **WebSockets**
5. React dashboard updates instantly

---

# ✨ Features

- 🎛️ Visual **Cinema Hall Layout Builder**
- 🚨 **Real-time Seat Alerts**
- 🔴 Flashing red seats for active calls
- 🟢 Green seats for idle
- ⚪ Grey seats for disabled seats
- 📡 **WebSocket real-time updates**
- 🧪 Built-in **simulation mode**
- 🧠 Layout saved in **browser localStorage**
- 🔧 Fully configurable rows / aisles
- 🪑 Dynamic seat numbering (1A, 2A, 3B…)

---

# 🧱 Tech Stack

### Frontend
- React
- Socket.IO Client
- Axios
- CSS

### Backend
- Node.js
- Express
- Socket.IO
- CORS

### Hardware (optional)
- ESP8266 / NodeMCU
- Push button

---

# 📂 Project Structure

```

cinema-seat-system
│
├── server.js        # Node.js backend
│
├── frontend
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
│
├── package.json
│
└── README.md

```

---

# ⚙️ Installation Guide

## 1️⃣ Install Node.js

Download from:

```

[https://nodejs.org](https://nodejs.org)

````

Verify installation:

```bash
node -v
npm -v
````

---

# 🚀 Running the Backend

### Install dependencies

```bash
npm install express socket.io cors
```

### Start the server

```bash
node server.js
```

Expected output:

```
Server running on port 3000
```

Server will be available at:

```
http://localhost:3000
```

---

# 🚀 Running the React Frontend

Go to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Install required packages if missing:

```bash
npm install socket.io-client axios
```

Start React:

```bash
npm run dev
```

or

```bash
npm start
```

Frontend will run at:

```
http://localhost:5173
```

(or whichever port Vite assigns)

---

# 🔌 Backend API

## Get All Seat States

```
GET /get-all-states
```

Example response:

```json
{
 "1A": "idle",
 "2A": "idle",
 "3B": "calling"
}
```

---

## Update Seat State

```
POST /update-seat
```

Body:

```json
{
 "seat": "3B",
 "state": "calling"
}
```

Possible states:

```
idle
calling
```

---

# 📡 Real-Time Updates (Socket.IO)

When a seat updates, server broadcasts:

```
seat-update
```

Frontend listens:

```javascript
socket.on("seat-update", (data) => {
  setBackendStates(data)
})
```

This allows **instant updates across all dashboards**.

---

# 🎮 Simulation Mode

You can simulate a seat calling without hardware.

Click:

```
Test Call
```

What happens internally:

1. Random seat is selected
2. Axios sends POST request to backend
3. Backend updates seat state
4. WebSocket pushes update to UI

---

# 🪑 Seat Numbering Logic

Seats are dynamically generated using:

```
Seat Number + Row Letter
```

Examples:

```
1A
2A
3A
1B
2B
```

Calculation:

```javascript
const id = `${start + i + 1}${row.label}`
```

Example layout:

```
Row A
1A 2A 3A  |  4A 5A

Row B
1B 2B 3B  |  4B 5B
```

---

# 💾 Layout Persistence

Cinema layout is saved inside:

```
localStorage
```

Saved keys:

```
cinema_layout
internal_aisles
hall_name
```

This allows the dashboard to remember the configuration even after refresh.

---

# 🔄 Hard Reset (Clear Configuration)

If you want to **reset everything and redesign the hall layout**.

### Method 1 — Browser Console

Open DevTools:

```
F12 → Console
```

Run:

```javascript
localStorage.clear()
```

Refresh the page.

---

### Method 2 — Application Tab

Chrome DevTools:

```
Application
 → Local Storage
 → Delete cinema_layout
 → Delete internal_aisles
 → Delete hall_name
```

Refresh page.

---

# 🔴 Seat Status Meaning

| Color           | Meaning                                  |
| --------------- | ---------------------------------------- |
| 🟢 Green        | Seat idle                                |
| 🔴 Flashing Red | Customer requesting assistance           |
| ⚪ Grey          | Seat exists in layout but not in backend |

---

# 🔧 How Backend Controls Seat Status

Server maintains master seat list:

```javascript
let seatStates = {
 "1A": "idle",
 "2A": "idle",
 "3B": "calling"
};
```

This acts as **single source of truth**.

---

# 📟 ESP8266 Integration

Each seat device sends HTTP request:

Example Arduino code logic:

```
POST /update-seat
```

Payload:

```json
{
 "seat": "5C",
 "state": "calling"
}
```

Once sent:

1. Backend updates state
2. Dashboard turns seat **red**
3. Staff sees request

---

# 🧠 Why WebSockets?

Polling would cause delays.

Socket.IO allows:

```
Instant updates
Multiple dashboards
Low latency
```

Whenever a seat changes:

```
io.emit("seat-update", seatStates)
```

All dashboards instantly update.

---

# 👨‍💻 Development Tips

### Change server IP

Inside `App.jsx`

```
const PI_URL = "http://localhost:3000"
```

Replace with Raspberry Pi IP if deployed:

```
const PI_URL = "http://192.168.1.100:3000"
```

---

# 🛠 Troubleshooting

### Seats not updating

Check:

```
Server running?
Correct IP?
Firewall blocking port 3000?
```

---

### WebSocket not connecting

Check console for:

```
Frontend Connected
```

in server logs.

---

### Simulation not working

Check network request:

```
POST /update-seat
```

in browser DevTools → Network.

---

# 📈 Future Improvements

Possible upgrades:

* Database persistence
* Admin login
* Seat device battery monitoring
* SMS notification to staff
* Mobile dashboard
* Multi-hall support
* Seat service history

---


