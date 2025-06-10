export async function onRequest(context) {
  const { request } = context;
  console.log("🔍 요청 수신:", request.method);

  if (request.method === 'POST') {
    try {
      const body = await request.json();
      console.log("📨 POST Body:", body);
      return new Response(`✅ POST Success: You said — ${body.input}`, {
        headers: { "Content-Type": "text/plain" }
      });
    } catch (err) {
      console.log("❌ JSON 파싱 에러:", err.message);
      return new Response("❌ JSON parsing failed: " + err.message, { status: 400 });
    }
  }

  if (request.method === 'GET') {
    console.log("👋 GET 요청 처리 중...");
    return new Response("👋 MCP GET is working ✅", {
      headers: { "Content-Type": "text/plain" }
    });
  }

  console.log("❌ 지원되지 않는 메서드:", request.method);
  return new Response("❌ Method not allowed", { status: 405 });
}

