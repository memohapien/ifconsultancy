var VALID_TYPES = ['capabilities', 'impact', 'global', 'nexus', 'logos'];

var headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=60'
};

var corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestGet(context) {
  var type = context.params.type;
  if (!type || !VALID_TYPES.includes(type[0])) {
    return new Response(JSON.stringify({ error: 'Invalid content type.' }), {
      status: 400, headers: headers
    });
  }

  var key = 'content:' + type[0];

  if (context.env.CONTENT_KV) {
    var stored = await context.env.CONTENT_KV.get(key);
    if (stored) {
      return new Response(stored, { status: 200, headers: headers });
    }
  }

  return new Response(JSON.stringify({ error: 'Not found. Using static fallback.' }), {
    status: 404, headers: headers
  });
}

export async function onRequestPut(context) {
  var type = context.params.type;
  if (!type || !VALID_TYPES.includes(type[0])) {
    return new Response(JSON.stringify({ error: 'Invalid content type.' }), {
      status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  if (!context.env.ADMIN_KEY) {
    return new Response(JSON.stringify({ error: 'Admin not configured.' }), {
      status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  var auth = context.request.headers.get('Authorization');
  if (!auth || auth !== 'Bearer ' + context.env.ADMIN_KEY) {
    return new Response(JSON.stringify({ error: 'Unauthorized.' }), {
      status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  if (!context.env.CONTENT_KV) {
    return new Response(JSON.stringify({ error: 'KV not configured.' }), {
      status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    var body = await context.request.text();
    JSON.parse(body);

    var key = 'content:' + type[0];
    await context.env.CONTENT_KV.put(key, body);

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Invalid JSON.' }), {
      status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
