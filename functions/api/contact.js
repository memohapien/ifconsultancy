export async function onRequestPost(context) {
  var { request, env } = context;

  var headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  try {
    var body = await request.json();
    var { name, org, email, topic, message, token } = body;

    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: 'Name, email and message are required.' }), {
        status: 400, headers: headers
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email address.' }), {
        status: 400, headers: headers
      });
    }

    if (name.length > 200 || email.length > 200 || (org && org.length > 200) ||
        (topic && topic.length > 200) || message.length > 5000) {
      return new Response(JSON.stringify({ error: 'Field length exceeded.' }), {
        status: 400, headers: headers
      });
    }

    // Turnstile verification
    if (env.TURNSTILE_SECRET_KEY && token) {
      var tsResult = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: env.TURNSTILE_SECRET_KEY,
          response: token,
          remoteip: request.headers.get('CF-Connecting-IP')
        })
      });
      var tsData = await tsResult.json();
      if (!tsData.success) {
        return new Response(JSON.stringify({ error: 'Bot verification failed.' }), {
          status: 403, headers: headers
        });
      }
    }

    // Rate limiting via KV (5 submissions per IP per hour)
    var ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (env.RATE_KV) {
      var rateKey = 'rate:' + ip;
      var current = parseInt(await env.RATE_KV.get(rateKey) || '0', 10);
      if (current >= 5) {
        return new Response(JSON.stringify({ error: 'Too many submissions. Please try again later.' }), {
          status: 429, headers: headers
        });
      }
      await env.RATE_KV.put(rateKey, String(current + 1), { expirationTtl: 3600 });
    }

    // Store in D1
    if (env.DB) {
      var ipHash = await hashIP(ip);
      await env.DB.prepare(
        'INSERT INTO contact_submissions (name, org, email, topic, message, ip_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        name, org || '', email, topic || '', message, ipHash, new Date().toISOString()
      ).run();
    }

    // Send notification email via Resend
    if (env.RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + env.RESEND_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: env.RESEND_FROM || 'IF Consultancy <noreply@ifconsultancy-tr.com>',
          to: [env.NOTIFY_EMAIL || 'if@ifconsultancy-tr.com'],
          subject: 'New enquiry — ' + (topic || 'General'),
          html: buildEmailHTML(name, org, email, topic, message)
        })
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: headers
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error. Please try again.' }), {
      status: 500, headers: headers
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

async function hashIP(ip) {
  var encoder = new TextEncoder();
  var data = encoder.encode(ip + ':salt:ifconsultancy');
  var hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(function (b) {
    return b.toString(16).padStart(2, '0');
  }).join('').substring(0, 16);
}

function buildEmailHTML(name, org, email, topic, message) {
  var orgLine = org ? '<tr><td style="color:#6E7573;padding:6px 12px 6px 0;vertical-align:top;">Organization</td><td style="padding:6px 0;vertical-align:top;">' + esc(org) + '</td></tr>' : '';
  return '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#0B0E0F;max-width:600px;">' +
    '<p style="color:#6E7573;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">New enquiry via ifconsultancy-tr.com</p>' +
    '<table style="border-collapse:collapse;width:100%;margin:20px 0;font-size:15px;">' +
    '<tr><td style="color:#6E7573;padding:6px 12px 6px 0;vertical-align:top;">Name</td><td style="padding:6px 0;vertical-align:top;">' + esc(name) + '</td></tr>' +
    orgLine +
    '<tr><td style="color:#6E7573;padding:6px 12px 6px 0;vertical-align:top;">Email</td><td style="padding:6px 0;vertical-align:top;"><a href="mailto:' + esc(email) + '">' + esc(email) + '</a></td></tr>' +
    '<tr><td style="color:#6E7573;padding:6px 12px 6px 0;vertical-align:top;">Topic</td><td style="padding:6px 0;vertical-align:top;">' + esc(topic || 'Not specified') + '</td></tr>' +
    '</table>' +
    '<div style="background:#f5f5f2;padding:20px;margin:20px 0;white-space:pre-wrap;font-size:15px;line-height:1.6;">' + esc(message) + '</div>' +
    '<p style="color:#6E7573;font-size:13px;">Reply directly to <a href="mailto:' + esc(email) + '">' + esc(email) + '</a></p>' +
    '</body></html>';
}

function esc(s) {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
