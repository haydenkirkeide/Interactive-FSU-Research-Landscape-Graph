import { useEffect, useRef } from "react";
import { drawGraph } from "./graph.js";

const API_URL = "http://127.0.0.1:5002/api/network";   // must match app.run(port=...)

export default function App() {
  const svgRef = useRef(null);

  useEffect(() => {
    let cleanup = null;
    let cancelled = false;

    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        if (!cancelled) cleanup = drawGraph(svgRef.current, data);
      })
      .catch(err => console.error("Could not load network:", err));

    // StrictMode runs effects twice in dev; this stops the first simulation
    return () => {
      cancelled = true;
      if (cleanup) cleanup();
    };
  }, []);

  return (
    <>
      <h1 id="title">Citation Network Visualization in FSU (hlk21, Hayden Kirkeide)</h1>
      <svg id="graph" ref={svgRef}></svg>
      <div id="tooltip" className="tooltip"></div>
    </>
  );
}