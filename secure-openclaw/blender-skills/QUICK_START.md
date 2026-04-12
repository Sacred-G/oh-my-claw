# Blender MCP - Quick Start Guide

## Setup Status: 80% Complete! ✅

I've already done most of the work for you. Here's what's left:

---

## 3 Simple Steps to Finish Setup

### 📦 Step 1: Install Addon in Blender (2 minutes)

```
1. Open Blender
2. Edit → Preferences → Add-ons
3. Click "Install..." button
4. Choose: ~/secure-openclaw/blender-skills/mcp-addon/addon.py
5. Enable "Blender MCP" checkbox
```

### 🚀 Step 2: Start MCP Server (30 seconds)

```
1. In Blender, press "N" to show right sidebar
2. Click "BlenderMCP" tab
3. Click "Start MCP Server" button
4. Should say: "MCP Server started on port 9876"
```

### 🔄 Step 3: Restart Claude Desktop (30 seconds)

```
1. Quit Claude Desktop (Cmd+Q)
2. Reopen Claude Desktop
3. Look for hammer icon 🔨
4. Done! Ready to use
```

---

## Test It Out

Once setup is complete, try saying:

```
"Create a blue cube in Blender"
"List all objects in my scene"
"Add a red sphere next to the cube"
"Render the scene"
```

---

## What's Already Done ✅

- ✅ Downloaded addon.py file
- ✅ UV package manager verified
- ✅ Claude Desktop configured
- ✅ MCP server entry added to config

## What You Need to Do

- ⏳ Install addon in Blender
- ⏳ Start MCP server in Blender
- ⏳ Restart Claude Desktop

---

## Files You'll Need

**Addon file location:**
```
~/secure-openclaw/blender-skills/mcp-addon/addon.py
```

**Full instructions:**
```
~/secure-openclaw/blender-skills/MCP_SETUP_INSTRUCTIONS.md
```

---

## Quick Troubleshooting

**Can't find addon file?**
```bash
open ~/secure-openclaw/blender-skills/mcp-addon/
```

**Want to verify config?**
```bash
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Check if port 9876 is available?**
```bash
lsof -i :9876
```

---

## After Setup

You'll have TWO ways to control Blender:

1. **MCP Server** (fast, interactive)
   - Real-time GUI updates
   - Instant feedback
   - Perfect for design work

2. **Scripting** (automation, batch)
   - Background rendering
   - Batch operations
   - CI/CD pipelines

I'll automatically choose the best method for each task!

---

## Need Help?

Read the full guide:
```bash
cat ~/secure-openclaw/blender-skills/MCP_SETUP_INSTRUCTIONS.md
```

Or just ask me for help! 😊

---

**Estimated time to complete: 3-5 minutes**
