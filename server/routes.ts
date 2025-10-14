[
  {"action": "replace", "content": "import type { Express } from \"express\";\n"},
  {"action": "remove", "content": "import { createServer, type Server } from \"http\";\n"},
  {"action": "replace", "content": "export function registerRoutes(app: Express): void {\n"},
  {"action": "remove", "content": "  const server = createServer(app);\n"},
  {"action": "remove", "content": "\n  // Health check endpoint\n  app.get('/health', (_req, res) => {\n    res.json({ status: 'ok' });\n  });\n\n  return server;\n}\n"}
]
```