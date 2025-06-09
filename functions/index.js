export async function onRequest(context) {
  if (context.request.method === 'POST') {
    let input;
    try {
      const requestBody = await context.request.json();
      input = requestBody.input;
    } catch (err) {
      return new Response("JSON parse error: " + err.message, { status: 400 });
    }
    return new Response(`✅ MCP 응답: You said — ${input}`);
  }
  return new Response("Only POST method allowed", { status: 405 });
}
