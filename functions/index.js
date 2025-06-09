export async function onRequestPost(context) {
  let input = "Unknown";

  try {
    const body = await context.request.json();
    input = body.input || "Missing input";

    const gptRes = await fetch("https://assistant-agent-api.itstylebox999.workers.dev/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: input,
        notion_db_id: "example-db-id"  // 필요 시 이 부분을 동적으로 처리 가능
      })
    });

    const result = await gptRes.text(); // 혹은 .json()으로 바꿔도 됨
    return new Response("🔁 GPT 응답: " + result, {
      headers: { "Content-Type": "text/plain" }
    });

  } catch (err) {
    return new Response("❌ Error: " + err.message, { status: 400 });
  }
}
