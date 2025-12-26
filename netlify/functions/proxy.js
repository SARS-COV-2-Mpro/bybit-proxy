const BYBIT_MAINNET = "https://api.bybit.com";
const BYBIT_TESTNET = "https://api-demo-testnet.bybit.com";

export const handler = async (event, context) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-BAPI-API-KEY, X-BAPI-TIMESTAMP, X-BAPI-SIGN, X-BAPI-RECV-WINDOW",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  if (event.path === "/health") {
    return {
      statusCode: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true }),
    };
  }

  try {
    const path = event.path;
    let baseUrl, apiPath;

    if (path.startsWith("/mainnet")) {
      baseUrl = BYBIT_MAINNET;
      apiPath = path.replace(/^\/mainnet/, "");
    } else if (path.startsWith("/testnet")) {
      baseUrl = BYBIT_TESTNET;
      apiPath = path.replace(/^\/testnet/, "");
    } else {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Use /mainnet/* or /testnet/*" }),
      };
    }

    const queryString = event.rawQuery || "";
    const targetUrl = `${baseUrl}${apiPath}${queryString ? "?" + queryString : ""}`;

    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    };

    const headerMappings = {
      "x-bapi-api-key": "X-BAPI-API-KEY",
      "x-bapi-timestamp": "X-BAPI-TIMESTAMP",
      "x-bapi-sign": "X-BAPI-SIGN",
      "x-bapi-recv-window": "X-BAPI-RECV-WINDOW",
    };

    for (const [incoming, outgoing] of Object.entries(headerMappings)) {
      const value = event.headers[incoming] || event.headers[incoming.toUpperCase()];
      if (value) {
        headers[outgoing] = value;
      }
    }

    const fetchOptions = {
      method: event.httpMethod,
      headers,
    };

    if (event.httpMethod !== "GET" && event.httpMethod !== "HEAD" && event.body) {
      headers["Content-Type"] = event.headers["content-type"] || "application/json";
      fetchOptions.body = event.body;
    }

    const response = await fetch(targetUrl, fetchOptions);
    const responseText = await response.text();

    const contentType = responseText.trim().startsWith("{")
      ? "application/json"
      : "text/plain";

    return {
      statusCode: response.status,
      headers: { ...corsHeaders, "Content-Type": contentType },
      body: responseText,
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
