export default async function rescheduleMeeting(input, context) {
  return {
    message: `Meeting has been rescheduled as requested.`,
    inputReceived: input
  };
}

