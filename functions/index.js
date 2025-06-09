export async function onRequestPost(context) {
  const requestBody = await context.request.json();
  const input = requestBody.input;
  return new Response("✅ MCP 응답: You said — " + input, {
    headers: { "Content-Type": "text/plain" }
  });
}
