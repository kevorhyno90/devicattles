Codespaces / app.github.dev preview — asset 401/redirect workaround

Problem

When you open the app using the GitHub Codespaces (app.github.dev) forwarded-port preview URL, the portal may require an authenticated preview session. Unauthenticated requests for assets (JS/CSS) are redirected to a signin flow which results in 401/302 responses and aborted module loads.

Quick fixes

- Use the Codespaces "Open in Browser" / forwarded port link that GitHub provides for the port (this preserves the preview token and prevents redirects).
- Make the forwarded port public in Codespaces port forwarding settings. This allows the preview proxy to serve assets without requiring an interactive signin.
- Run the dev server locally and open `http://localhost:5000` in your browser instead of using the app.github.dev proxy.

How to open the correct preview link

1. In the Codespaces UI, open the "Ports" panel.
2. Find the forwarded port for your dev server (default `5000`).
3. Click the three-dot menu and choose "Open in Browser" (or copy the provided preview URL). Use that URL to open the app.
4. If you need the preview to be public, choose "Make Public" in the same port menu.

Why this happens

The GitHub preview proxy protects forwarded ports and will redirect unauthenticated requests to a signin endpoint (https://github.dev/pf-signin). Static asset requests from the page (for example `/src/...`) will therefore be intercepted and redirected, leading to 401/ERR_ABORTED in the browser.

If you want me to automate anything here (add scripts, detect the preview URL, or add config suggestions), say what you'd like and I'll implement it.