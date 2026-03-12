import { useState, useMemo, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import "./App.css";

// --- CONFIGURATION ---
// Change "localhost" to your Raspberry Pi's IP address (e.g., 192.168.1.100)
const PI_URL = "http://localhost:3000";
const socket = io(PI_URL);

function App() {
  // --- 💾 PERSISTENCE LOGIC (Load from Browser Memory) ---
  const getSavedLayout = () => {
    const saved = localStorage.getItem("cinema_layout");
    return saved ? JSON.parse(saved) : [{ label: "A", blocks: [3, 2] }];
  };

  const getSavedAisles = () => {
    const saved = localStorage.getItem("internal_aisles");
    return saved ? parseInt(saved) : 1;
  };

  // --- STATE ---
  const [viewMode, setViewMode] = useState("config"); // 'config' or 'live'
  const [hallName, setHallName] = useState(localStorage.getItem("hall_name") || "Hall 3");
  const [internalAisles, setInternalAisles] = useState(getSavedAisles());
  const [rows, setRows] = useState(getSavedLayout());
  
  // Real-time states from Backend (JSON)
  const [backendStates, setBackendStates] = useState({}); 
  
  // Dragger state
  const [leftWidth, setLeftWidth] = useState(45);
  const [isDragging, setIsDragging] = useState(false);
  const gridRef = useRef(null);

  // --- 🌐 BACKEND SYNC (WebSockets) ---
  useEffect(() => {
    // Listen for seat updates from Raspberry Pi
    socket.on("seat-update", (data) => {
      setBackendStates(data);
    });

    return () => socket.off("seat-update");
  }, []);

 // --- ⚡ ACTIONS ---
  const saveConfiguration = () => {
    localStorage.setItem("cinema_layout", JSON.stringify(rows));
    localStorage.setItem("internal_aisles", internalAisles.toString());
    localStorage.setItem("hall_name", hallName);
    setViewMode("live");
  };


  
  // --- ⚡ ACTIONS ---
  
  // FIX 1: The Simulation must tell the Backend to turn RED
  const simulateCall = async () => {
    // 1. Pick a random row
    const randomRowIndex = Math.floor(Math.random() * rows.length);
    const row = rows[randomRowIndex];
    
    // 2. Pick a random block and then a random seat within that block
    const randomBlockIndex = Math.floor(Math.random() * row.blocks.length);
    const seatCountInBlock = row.blocks[randomBlockIndex];
    
    if (seatCountInBlock === 0) return; // Safety check

    // Calculate the actual seat number based on previous blocks
    const startOffset = row.blocks.slice(0, randomBlockIndex).reduce((a, b) => a + b, 0);
    const randomSeatInBlock = Math.floor(Math.random() * seatCountInBlock) + 1;
    
    // This is the EXACT ID visible on the screen (e.g., "3D")
    const seatId = `${startOffset + randomSeatInBlock}${row.label}`;
    
    console.log(`📡 Attempting to send to backend: ${seatId}`);

    try {
      // 3. Send the EXACT ID to the Pi
      await axios.post(`${PI_URL}/update-seat`, {
        seat: seatId,
        state: "calling"
      });
      console.log(`✅ Success! Backend updated for: ${seatId}`);
    } catch (err) {
      console.error("❌ Network Error: Is the Node server running?", err);
    }
  };

  // FIX 2: Ensure Reset tells the Backend to turn GREEN
  const handleResetCall = async (seatId) => {
    try {
      await axios.post(`${PI_URL}/update-seat`, {
        seat: seatId,
        state: "idle"
      });
      console.log(`Sent 'idle' for ${seatId} to Backend`);
    } catch (err) {
      console.error("Communication error with Pi:", err);
    }
  };

  // --- 📏 DRAGGER MATH ---
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      let newWidthPercent = (e.clientX / window.innerWidth) * 100;
      let maxLeftPercent = 80; 
      if (gridRef.current) {
        const gridWidth = gridRef.current.getBoundingClientRect().width;
        const maxLeftPx = window.innerWidth - (gridWidth + 120);
        maxLeftPercent = (maxLeftPx / window.innerWidth) * 100;
      }
      setLeftWidth(Math.max(20, Math.min(newWidthPercent, maxLeftPercent, 80)));
    };
    const stopDragging = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", stopDragging);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopDragging);
    };
  }, [isDragging]);

  const maxSeatsPerBlock = useMemo(() => {
    const numBlocks = internalAisles + 1;
    const maxes = Array(numBlocks).fill(0);
    rows.forEach(row => {
      row.blocks.forEach((count, i) => {
        if (i < numBlocks && count > maxes[i]) maxes[i] = count;
      });
    });
    return maxes;
  }, [rows, internalAisles]);

  // --- 🛠️ HANDLERS ---
  const handleInternalAisleChange = (e) => {
    const count = parseInt(e.target.value) || 0;
    setRows(rows.map(row => {
      let b = [...row.blocks];
      while (b.length < count + 1) b.push(2);
      return { ...row, blocks: b.slice(0, count + 1) };
    }));
    setInternalAisles(count);
  };

  const updateSeats = (rIdx, bIdx, delta) => {
    const newRows = [...rows];
    newRows[rIdx].blocks[bIdx] = Math.max(0, newRows[rIdx].blocks[bIdx] + delta);
    setRows(newRows);
  };

  const addRow = () => {
    const label = String.fromCharCode(65 + rows.length);
    setRows([...rows, { label, blocks: Array(internalAisles + 1).fill(4) }]);
  };

  // ==========================================
  // RENDER LIVE DASHBOARD
  // ==========================================
  if (viewMode === "live") {
    const activeList = Object.keys(backendStates).filter(id => backendStates[id] === "calling");

    return (
      <div className="layout-container">
        <header className="header live-header">
          <div className="status-indicator">
            <span className="dot online"></span>
            <h2>{hallName} - LIVE</h2>
          </div>
          <div className="header-actions">
            <button className="simulate-btn" onClick={simulateCall}>Test Call</button>
            <button className="back-btn" onClick={() => setViewMode("config")}>Edit Layout</button>
          </div>
        </header>

        <div className="live-split-view">
          <div className="visual-panel live-grid-panel">
            <div className="visual-content">
              <div className="screen-bar">S C R E E N</div>
              <div className="cinema-grid" style={{ width: "max-content" }}>
                {rows.map((row, rIdx) => (
                  <div key={rIdx} className="visual-row">
                    <div className="row-label">{row.label}</div>
                    <div className="visual-aisle">↑↓</div>
                    {row.blocks.map((count, bIdx) => {
                      const max = maxSeatsPerBlock[bIdx] || 0;
                      const start = row.blocks.slice(0, bIdx).reduce((a, b) => a + b, 0);
                      return (
                        <div key={bIdx} className="visual-block">
                          {Array.from({ length: count }).map((_, i) => {
                            const id = `${start + i + 1}${row.label}`;
                            const state = backendStates[id];
                            const statusClass = state === "calling" ? "calling" : state === "idle" ? "idle" : "disabled";
                            return (
                              <div key={id} className={`small-seat ${statusClass}`}>
                                {id}
                                {state === "calling" && <button className="seat-reset-btn" onClick={() => handleResetCall(id)}>✓</button>}
                              </div>
                            );
                          })}
                          {Array.from({ length: max - count }).map((_, i) => <div key={i} className="empty-seat"></div>)}
                          {bIdx < row.blocks.length - 1 && <div className="visual-aisle">↑↓</div>}
                        </div>
                      );
                    })}
                    <div className="visual-aisle">↑↓</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="active-calls-panel">
            <h3>🚨 Active Requests ({activeList.length})</h3>
            <div className="calls-list">
              {activeList.length === 0 ? <p className="no-calls">All clear</p> : 
                activeList.map(id => (
                  <div key={id} className="call-card">
                    <span className="call-seat-id">{id}</span>
                    <button className="panel-reset-btn" onClick={() => handleResetCall(id)}>Reset</button>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER CONFIGURATION
  // ==========================================
  return (
    <div className={`layout-container ${isDragging ? "no-select" : ""}`}>
      <header className="header">
        <h2>Hall Configuration</h2>
        <div className="header-info">
          Hall: <input value={hallName} onChange={(e) => setHallName(e.target.value)} />
          <span> Aisles: </span>
          <input type="number" value={internalAisles} onChange={handleInternalAisleChange} style={{width: "45px"}} />
        </div>
        <button className="save-btn" onClick={saveConfiguration}>Save & Go Live</button>
      </header>

      <div className="split-view">
        <div className="config-panel" style={{ width: `${leftWidth}%` }}>
          <div className="panel-header"><h3>Row Setup</h3><button className="add-row-btn" onClick={addRow}>+ Add Row</button></div>
          {rows.map((row, rIdx) => (
            <div key={rIdx} className="row-editor">
              <div className="row-editor-header">
                <h4>Row {row.label} ({row.blocks.reduce((a,b)=>a+b,0)} seats)</h4>
                <button className="delete-row-btn" onClick={() => setRows(rows.filter((_, i) => i !== rIdx))}>Delete</button>
              </div>
              <div className="seat-blocks">
                <span className="aisle-tag">Aisle</span>
                {row.blocks.map((count, bIdx) => (
                  <div key={bIdx} className="block-editor">
                    <div className="seat-count-box">[{count}]</div>
                    <div className="btn-group">
                      <button onClick={() => updateSeats(rIdx, bIdx, 1)}>+</button>
                      <button onClick={() => updateSeats(rIdx, bIdx, -1)}>-</button>
                    </div>
                    {bIdx < row.blocks.length - 1 && <span className="aisle-tag">Aisle</span>}
                  </div>
                ))}
                <span className="aisle-tag">Aisle</span>
              </div>
            </div>
          ))}
        </div>

        <div className="resizer" onMouseDown={() => setIsDragging(true)}><div className="resizer-handle">⋮</div></div>

        <div className="visual-panel">
          <div className="visual-content">
            <div className="screen-bar">S C R E E N</div>
            <div className="cinema-grid" ref={gridRef} style={{ width: "max-content" }}>
              {rows.map((row, rIdx) => (
                <div key={rIdx} className="visual-row">
                  <div className="row-label">{row.label}</div>
                  <div className="visual-aisle">↑↓</div>
                  {row.blocks.map((count, bIdx) => {
                    const max = maxSeatsPerBlock[bIdx] || 0;
                    const start = row.blocks.slice(0, bIdx).reduce((a, b) => a + b, 0);
                    return (
                      <div key={bIdx} className="visual-block">
                        {Array.from({ length: count }).map((_, i) => <div key={i} className="small-seat idle">{start + i + 1}{row.label}</div>)}
                        {Array.from({ length: max - count }).map((_, i) => <div key={i} className="empty-seat"></div>)}
                        {bIdx < row.blocks.length - 1 && <div className="visual-aisle">↑↓</div>}
                      </div>
                    );
                  })}
                  <div className="visual-aisle">↑↓</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;