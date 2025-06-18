export default async function attachImageToAnyPost(input) {
  // input: { imageUrl, postId, platform, etc. }
  console.log("🖼️ Attach Image triggered with input:", input);

  const { imageUrl, pageId, notionToken } = input;

  const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${notionToken}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: {
        Attachment: {
          files: [
            {
              type: "external",
              name: imageUrl.split("/").pop(),
              external: { url: imageUrl },
            },
          ],
        },
      },
    }),
  });

  const data = await response.json();

  return {
    status: "success",
    message: "Image attached to post",
    notion: data,
  };
}
