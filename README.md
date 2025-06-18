# Personal Assistant Agent

This is a lightweight, intention-based AI assistant system designed to manage and support personal productivity workflows using Notion, Google services (Calendar, Meet, Gmail), and other integrated tools. The assistant runs on Cloudflare Workers and connects with a Custom GPT to receive and process user input, perform task coordination, and manage calendar updates and project flows efficiently.

## 🔧 Features

- Context-aware scheduling and task suggestions based on user's Notion and Google Calendar data
- Dynamic intent classification to determine next actions
- Supports email-based requests, reminders, summaries, and more
- Modular scenario-based workflow files with simplified routing logic
- Easy to customize and extend with JSON-based configuration

## 📁 Project Structure

```
agent-simplified/
├── configs/
│   ├── prompt-router.json
│   └── apps/
│       ├── notion.json
│       ├── notion.calendar.json
│       ├── google.calendar.json
│       ├── google.meet.json
│       ├── google.gmail.json
├── workflows/
│   └── scenario/
│       ├── create.json
│       ├── insight.json
│       ├── manage.json
│       ├── remind.json
│       ├── summarize.json
│       ├── retrieve.json
│       ├── suggest.json
│       └── intention-classifier.json
├── src/
│   ├── index.js
│   ├── router.js
│   ├── intent-parser.js
│   ├── ai-agent.js
│   └── utils.js
├── system/
│   └── system_prompt.json
├── public/
│   └── index.html
├── wrangler.toml
├── package.json
├── .gitignore
└── README.md
```

## 🚀 Setup & Deployment

1. Clone the repository and navigate to the project directory.
2. Make sure you have Cloudflare Wrangler CLI installed.
3. Add your environment and secrets using `wrangler`:
   ```bash
   wrangler secret put OPENAI_API_KEY
   wrangler secret put NOTION_TOKEN
   ```
4. Deploy your worker:
   ```bash
   wrangler deploy
   ```

## ✅ Compatibility

- Works seamlessly with Custom GPTs via HTTP requests
- Designed to work alongside Notion databases and Google APIs
- Easily extendable via modular workflow and config files

---

Feel free to customize each intent or workflow based on your specific needs. This system is meant to simplify, not overwhelm.