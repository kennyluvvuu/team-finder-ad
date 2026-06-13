import { serve } from "bun";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

const server = serve({
  port: 3000,
  async fetch(req: Request) {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // 1. Proxy API requests
    if (pathname.startsWith("/api/")) {
      const targetUrl = `${BACKEND_URL}${pathname}${url.search}`;
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
    }

    // 2. Proxy Media requests
    if (pathname.startsWith("/media/")) {
      const targetUrl = `${BACKEND_URL}${pathname}${url.search}`;
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
    }

    // 3. Serve static assets from the `dist` directory
    const filePath = `dist${pathname}`;
    const file = Bun.file(filePath);
    if (pathname !== "/" && !pathname.endsWith("/") && await file.exists()) {
      return new Response(file);
    }

    // 4. Fallback to dist/index.html (for client-side routing / SPA)
    const indexFile = Bun.file("dist/index.html");
    if (await indexFile.exists()) {
      return new Response(indexFile);
    }

    return new Response("Not Found", { status: 404 });
  }
});

console.log(`🚀 Production server running at ${server.url}`);

