export default async function repurposeContent(input) {
  // input: { originalContent, targetFormat, platform }
  console.log("♻️ Repurpose Content triggered with input:", input);

  const { originalContent, targetFormat, openaiApiKey } = input;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Rewrite the following content for ${targetFormat}`,
        },
        { role: "user", content: originalContent },
      ],
    }),
  });

  const data = await response.json();
  const rewritten = data.choices?.[0]?.message?.content?.trim() || "";

  return {
    status: "success",
    message: rewritten,
  };
}
