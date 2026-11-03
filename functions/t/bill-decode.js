/**
 * Same-origin decoder for politicalpayola.com/legislation_lens.html
 *
 * Why this exists: the upstream decoder lives behind the Cloudflare tunnel at
 * app.thesoapbook.com, and Cloudflare's edge strips `Access-Control-Allow-Origin`
 * from that hostname -- so a browser fetch straight from politicalpayola.com is
 * blocked by CORS even though the origin server sends the header. Proxying here
 * makes the call same-origin, which removes CORS from the equation entirely and
 * keeps the Vertex credentials on the server, never in the browser.
 *
 * POST /t/bill-decode  {text?: string, image_data?: string}
 * -> 200 {ok, result:{...}} | 4xx/5xx {ok:false, error}
 */

const UPSTREAM = "https://app.thesoapbook.com/t/bill-decode";
const MAX_BODY_BYTES = 16 * 1024 * 1024; // matches the upstream reader cap

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-lens-proxy": "1",
    },
  });
}

export async function onRequestPost(context) {
  const { request } = context;

  let payload;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) {
      return json({ ok: false, error: "That document is too large. Try a smaller photo or paste the text." }, 413);
    }
    payload = JSON.parse(text || "{}");
  } catch (err) {
    return json({ ok: false, error: "Could not read the request body as JSON." }, 400);
  }

  const hasText = typeof payload.text === "string" && payload.text.trim().length > 0;
  const hasImage = typeof payload.image_data === "string" && payload.image_data.length > 32;
  if (!hasText && !hasImage) {
    return json({ ok: false, error: "Send either bill text or a photographed page." }, 400);
  }

  let upstream;
  try {
    upstream = await fetch(UPSTREAM, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    return json({ ok: false, error: "The decoder service did not answer. Please try again." }, 502);
  }

  const raw = await upstream.text();
  if (!upstream.ok) {
    let parsed = null;
    try { parsed = JSON.parse(raw); } catch (_) { /* not json */ }
    if (parsed && (parsed.error || parsed.unreadable)) {
      // A refusal we can explain is an answer, not an outage -- pass it through as 200
      // so the page shows the reason instead of a generic gateway error.
      return json(parsed, 200);
    }
    return json({
      ok: false,
      error: `Decoder returned ${upstream.status}.`,
      upstream_status: upstream.status,
      upstream_snippet: raw.slice(0, 200),
    }, upstream.status >= 500 ? 502 : upstream.status);
  }
  return new Response(raw, {
    status: 200,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-lens-proxy": "1" },
  });
}

export async function onRequestGet() {
  return json({ ok: true, endpoint: "/t/bill-decode", note: "POST bill text or an image to decode it." });
}