/**
 * @intent auto_reply
 * @description Automatically reply to messages or comments based on user rules.
 * @example "Auto-reply to all emails with 'Thank you for your message'"
 */
export async function run({ prompt, context }) {
  const { gmailToken, replyTo, subject, threadId } = context;

  const email = [
    `To: ${replyTo}`,
    `Subject: Re: ${subject}`,
    "",
    prompt,
  ].join("\r\n");

  const encoded = Buffer.from(email).toString("base64url");

  await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${gmailToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: encoded, threadId }),
    }
  );

  return {
    message: "Auto-reply sent",
    prompt,
    to: replyTo,
  };
}
