import { serve } from "bun";
import index from "./index.html";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

const server = serve({
  routes: {
    "/api/*": async (req) => {
      const url = new URL(req.url);
      const targetUrl = `${BACKEND_URL}${url.pathname}${url.search}`;
      const headers = new Headers(req.headers);
      headers.delete("host");
      
      const body = req.method !== "GET" && req.method !== "HEAD" ? await req.blob() : undefined;
      
      try {
        return await fetch(targetUrl, {
          method: req.method,
          headers,
          body,
          redirect: "manual",
        });
      } catch (e) {
        console.error("Proxy error for target:", targetUrl, e);
        return Response.json({ error: "Backend server is offline" }, { status: 502 });
      }
    },

    "/media/*": async (req) => {
      const url = new URL(req.url);
      const targetUrl = `${BACKEND_URL}${url.pathname}${url.search}`;
      const headers = new Headers(req.headers);
      headers.delete("host");
      
      try {
        return await fetch(targetUrl, {
          method: req.method,
          headers,
          redirect: "manual",
        });
      } catch (e) {
        return Response.json({ error: "Backend server is offline" }, { status: 502 });
      }
    },

    // Serve index.html for all unmatched routes.
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);

