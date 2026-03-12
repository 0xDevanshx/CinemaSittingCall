const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// This is the "Master List" the Frontend will follow
// If a seat is NOT in this list, React will show it as GREY
let seatStates = {
  "1A": "idle",
  "2A": "idle",
  "3B": "calling"
};

// --- ROUTES FOR POSTMAN / ESP8266 ---


// NEW: GET route to see the current state of all seats
app.get("/get-all-states", (req, res) => {
  console.log("Status check requested via GET");
  res.status(200).json(seatStates);
});

// Update a seat state (Postman will use this)
app.post("/update-seat", (req, res) => {
  const { seat, state } = req.body; // e.g. { "seat": "1A", "state": "calling" }
  
  seatStates[seat] = state;
  
  // Tell all connected React Dashboards to update
  io.emit("seat-update", seatStates);
  
  console.log(`Update: ${seat} is now ${state}`);
  res.status(200).send({ message: "Updated", seatStates });
});

io.on("connection", (socket) => {
  console.log("Frontend Connected");
  socket.emit("seat-update", seatStates); // Send current data on connect
});

server.listen(3000, "0.0.0.0", () => {
  console.log("Server running on port 3000");
});

