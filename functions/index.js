export async function onRequestPost(context) {
  let input = "Unknown";

  try {
    const requestBody = await context.request.json();
    input = requestBody.input || "Missing input";
  } catch (err) {
    return new Response("❌ Error parsing JSON: " + err.message, {
      status: 400,
      headers: { "Content-Type": "text/plain" }
    });
  }

  return new Response("✅ MCP 응답: You said — " + input, {
    headers: { "Content-Type": "text/plain" }
  });
}
