export async function onRequest(context) {
  const { request } = context;

  if (request.method === 'POST') {
    try {
      const body = await request.json();
      return new Response(`✅ MCP 응답: You said — ${body.input}`, {
        headers: { "Content-Type": "text/plain" }
      });
    } catch (err) {
      return new Response("❌ JSON Error: " + err.message, { status: 400 });
    }
  }

  // ✅ GET 요청 처리 추가
  if (request.method === 'GET') {
    return new Response("👋 Hello! MCP is running.", {
      headers: { "Content-Type": "text/plain" }
    });
  }

  return new Response("Method not allowed", { status: 405 });
}


