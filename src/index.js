export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 기본 엔드포인트: /run
    if (url.pathname === "/run" && request.method === "POST") {
      const data = await request.json();

      // 예시로 Notion 설정을 불러오는 방식 (추후 확장 가능)
      const notionDb = data.notion_db_id || "not-set";
      const message = data.message || "Hello GPT";

      return new Response(
        JSON.stringify({
          reply: `✅ Received message: ${message}, Notion DB: ${notionDb}`,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response("Not Found", { status: 404 });
  },
};
