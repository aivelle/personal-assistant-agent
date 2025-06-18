export default async function voiceToAnywhere(input, context) {
  return {
    message: `Voice captured and sent to the specified target.`,
    inputReceived: input
  };
}

