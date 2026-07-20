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
        if (provider === 'groq') {
          finalApiKey = env.GROQ_API_KEY;
        } else if (provider === 'openai') {
          finalApiKey = env.OPENAI_API_KEY;
        } else if (provider === 'anthropic') {
          finalApiKey = env.ANTHROPIC_API_KEY;
        } else if (provider === 'google') {
          finalApiKey = env.GOOGLE_API_KEY;
        }
      }

      if (!finalApiKey) {
        return new Response(JSON.stringify({ 
          error: 'API Key not found. Please set it in Cloudflare Worker environment variables or send it in request.' 
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        });
      }

      // Build headers for target API
      const fetchHeaders = {
        'Content-Type': 'application/json'
      };

      if (provider === 'anthropic') {
        fetchHeaders['x-api-key'] = finalApiKey;
        fetchHeaders['anthropic-version'] = '2023-06-01';
      } else if (provider === 'google') {
        // Google uses query param
        const separator = apiUrl.includes('?') ? '&' : '?';
        var finalUrl = apiUrl + separator + 'key=' + finalApiKey;
      } else {
        fetchHeaders['Authorization'] = 'Bearer ' + finalApiKey;
      }

      // Merge custom headers
      for (const key in headers) {
        fetchHeaders[key] = headers[key];
      }

      const finalUrl = provider === 'google' ? finalUrl : apiUrl;

      const response = await fetch(finalUrl, {
        method: 'POST',
        headers: fetchHeaders,
        body: JSON.stringify(requestBody)
      });

      const responseData = await response.json();

      return new Response(JSON.stringify(responseData), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }
  }
};
