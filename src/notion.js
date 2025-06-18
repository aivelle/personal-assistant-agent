import config from "../configs/databases.js";

// Returns the databases for the given userId. Throws an error if not found.
export function getDatabases(userId = "user_id") {
  if (!config.users[userId] || !config.users[userId].databases) {
    throw new Error(`No databases found for user: ${userId}`);
  }
  return config.users[userId].databases;
}

// Example: Print all database names and IDs for testing
for (const [dbName, dbObj] of Object.entries(getDatabases())) {
  console.log(`[${dbName}] - ID: ${dbObj.database_id}`);
}

// You can add actual Notion API integration functions here

// Create a new Task in Notion
export async function createNotionTask(properties, notionToken) {
  const databaseId = getDatabases("user_id")["Tasks"].database_id;
  const response = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${notionToken}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties
    })
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Notion API error: ${error}`);
  }
  return response.json();
} 