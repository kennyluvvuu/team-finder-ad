/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

const elem = document.getElementById("root")!;
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

// Safe HMR rendering for both Vite and Bun
let root;
if (typeof import.meta !== "undefined" && import.meta.hot && import.meta.hot.data) {
  import.meta.hot.data.root ??= createRoot(elem);
  root = import.meta.hot.data.root;
} else {
  root = createRoot(elem);
}

root.render(app);
