export async function onRequestPost(context) {
  console.log("🌱 Hello from MCP!");

  let input = "Unknown";

  try {
    const requestBody = await context.request.json();
    input = requestBody.input || "Missing input";
  } catch (err) {
    console.log("❌ JSON 파싱 에러:", err.message);
    return new Response("❌ Error parsing JSON: " + err.message, {
      status: 400,
      headers: { "Content-Type": "text/plain" }
    });
  }

  console.log("📨 입력값:", input);
  return new Response("✅ MCP 응답: You said — " + input, {
    headers: { "Content-Type": "text/plain" }
  });
}
