# Vercel JWT Activation Record

On 20 August 2026, `JWT_SECRET` was added as a **Sensitive** Vercel environment variable for both **Production** and **Preview**. Its value is intentionally not recorded in this repository or this document.

Vercel then accepted a production redeploy so the secure session setting can take effect. The next verification step is to confirm the redeploy reaches the Ready state and that the stable public dashboard and Gemini routes still return valid responses.

The secret was subsequently rotated once more as a security precaution. Vercel confirmed the final production deployment `AtevRr2bo8R176MMeFHRAdB85WdG` as **Ready**, and the stable public `auth.me` endpoint returned HTTP 200 JSON afterwards.

`DATABASE_URL` remains intentionally deferred. Login, registration, scan history, farm-profile persistence, and notification persistence require a future MySQL/TiDB-compatible database connection before they can be activated in production.
