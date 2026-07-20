// Cloudflare Worker - Proxy for Oay Yaqin AI
// This hides the API key and bypasses filtering issues

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    // Only allow POST
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    try {
      const body = await request.json();
      const provider = body.provider || 'groq';
      const apiUrl = body.apiUrl;
      const apiKey = body.apiKey;
      const requestBody = body.requestBody;
      const headers = body.headers || {};

      // Use environment variable if no API key provided
      let finalApiKey = apiKey;

      if (!finalApiKey) {
        switch (provider) {
          case 'groq':
            finalApiKey = env.GROQ_API_KEY;
            break;
          case 'openai':
            finalApiKey = env.OPENAI_API_KEY;
            break;
          case 'anthropic':
            finalApiKey = env.ANTHROPIC_API_KEY;
            break;
          case 'google':
            finalApiKey = env.GOOGLE_API_KEY;
            break;
        }
      }

      if (!finalApiKey) {
        return new Response(JSON.stringify({
          error: 'API Key not found.'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        });
      }

      const fetchHeaders = {
        'Content-Type': 'application/json'
      };

      // آدرس نهایی درخواست
      let finalUrl = apiUrl;

      if (provider === 'anthropic') {
        fetchHeaders['x-api-key'] = finalApiKey;
        fetchHeaders['anthropic-version'] = '2023-06-01';
      } else if (provider === 'google') {
        const separator = apiUrl.includes('?') ? '&' : '?';
        finalUrl = apiUrl + separator + 'key=' + finalApiKey;
      } else {
        fetchHeaders['Authorization'] = 'Bearer ' + finalApiKey;
      }

      // Merge custom headers
      for (const key in headers) {
        fetchHeaders[key] = headers[key];
      }

      const response = await fetch(finalUrl, {
        method: 'POST',
        headers: fetchHeaders,
        body: JSON.stringify(requestBody)
      });

      const text = await response.text();

      return new Response(text, {
        status: response.status,
        headers: {
          'Content-Type': response.headers.get('Content-Type') || 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });

    } catch (error) {
      return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }
  }
};
