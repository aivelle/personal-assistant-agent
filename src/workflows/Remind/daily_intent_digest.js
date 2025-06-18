export default async function dailyIntentDigest(input) {
    // input: { date }
    console.log("🗓️ Daily Intent Digest triggered for:", input.date);
  
    // TODO: Aggregate daily intent records from DB or cache
    return {
      status: "success",
      message: "Daily digest generated (mock)."
    };
  }
  