import config from '../configs/we.json' assert { type: 'json' };

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/run" && request.method === "POST") {
      const body = await request.json();

      // config에서 정보 가져오기
      const notionDb = config.notion?.db_id || "not-set";
      const userEmail = config.gmail?.user || "unknown@example.com";

      return new Response(
        JSON.stringify({
          message: "Custom GPT agent received your request.",
          received: body,
          from_config: {
            notion_db: notionDb,
            gmail_user: userEmail
          }
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response("Not Found", { status: 404 });
  },
};

