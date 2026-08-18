# OpenCode Installation Steps

## 1. Install OpenCode

```bash
curl -fsSL https://opencode.ai/install | bash
```

This installs the binary to `/home/codespace/.opencode/bin/opencode`.

## 2. Add to PATH and API Key

Add these lines to `~/.bashrc`:

```bash
# opencode
export PATH=/home/codespace/.opencode/bin:$PATH
export BYNARA_API_KEY=sk-nry-...
```

Then reload:

```bash
source ~/.bashrc
```

## 3. Create Project Config

Create `opencode.json` in the project root with your provider configuration:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "supabase": {
      "type": "remote",
      "url": "https://mcp.supabase.com/mcp",
      "enabled": true,
      "oauth": false,
      "headers": {
        "Authorization": "Bearer sbp_..."
      }
    }
  },
  "provider": {
    "bynara": {
      "name": "Bynara",
      "package": "openai-compatible",
      "env": ["BYNARA_API_KEY"],
      "options": {
        "baseURL": "https://router.bynara.id/v1"
      },
      "models": {
        "agnes-2.5-flash": { "name": "Agnes 2.5 Flash" }
      }
    }
  }
}
```

## 4. Authenticate Supabase MCP

```bash
opencode mcp auth supabase
```

If you get a URL error, fix the endpoint and run again:

```bash
git commit -m "fix: correct supabase MCP URL"
opencode mcp auth supabase
```

## 5. Launch OpenCode

```bash
opencode
```
