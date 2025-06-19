/**
 * @intent auto_tagging
 * @description Automatically tag items based on user input or content.
 * @example "Automatically tag all new notes with #meeting"
 */
export async function run({ prompt, context }) {
  const { notionToken, pageId, tags = [] } = context;

  const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${notionToken}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: {
        Tags: {
          multi_select: tags.map((t) => ({ name: t })),
        },
      },
    }),
  });

  const data = await response.json();

  return {
    message: "Auto-tagging completed",
    prompt,
    pageId,
    notion: data,
  };
}
