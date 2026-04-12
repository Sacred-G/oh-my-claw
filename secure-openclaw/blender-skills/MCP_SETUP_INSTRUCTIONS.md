# Blender MCP Setup Instructions

## What I've Done For You ✅

1. **Downloaded addon.py** → Saved to `~/secure-openclaw/blender-skills/mcp-addon/addon.py`
2. **Verified UV is installed** → Version 0.9.7 (already installed)
3. **Configured Claude Desktop** → Added blender-mcp to `claude_desktop_config.json`

## What You Need to Do Next

### Step 1: Install the Addon in Blender

1. **Open Blender**

2. **Go to Preferences**
   - Click: `Edit` → `Preferences`
   - Or press: `Cmd + ,` (macOS) / `Ctrl + ,` (Windows/Linux)

3. **Open Add-ons Section**
   - Click on the `Add-ons` tab on the left sidebar

4. **Install the Addon**
   - Click the `Install...` button (top right)
   - Navigate to: `~/secure-openclaw/blender-skills/mcp-addon/addon.py`
   - Select the file and click `Install Add-on`

5. **Enable the Addon**
   - In the search box, type: `Blender MCP`
   - Check the checkbox next to `Interface: Blender MCP`
   - The addon is now enabled!

### Step 2: Start the MCP Server in Blender

1. **Open the Blender MCP Panel**
   - In the 3D Viewport, look at the right sidebar
   - If the sidebar is hidden, press `N` to show it
   - Click on the `BlenderMCP` tab

2. **Start the Server**
   - You should see a button that says `Start MCP Server`
   - Click it
   - You should see a message: **"MCP Server started on port 9876"**

### Step 3: Restart Claude Desktop

1. **Quit Claude Desktop completely**
   - `Cmd + Q` (macOS) or close all windows

2. **Reopen Claude Desktop**

3. **Verify Connection**
   - Look for a hammer icon (🔨) in Claude Desktop
   - Click on it to see available tools
   - You should see Blender MCP tools listed!

## Verification

Once everything is set up, you can test it by asking me:

- "List all objects in my Blender scene"
- "Create a red cube in Blender"
- "What's currently in my Blender file?"

## Troubleshooting

### "MCP Server won't start"
- Make sure Blender version is 3.6 or newer
- Check if port 9876 is already in use: `lsof -i :9876`
- Try restarting Blender

### "Can't see the hammer icon in Claude Desktop"
- Make sure you fully quit and reopened Claude Desktop
- Check the config file is correct: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Look for the "blender" entry under "mcpServers"

### "First command doesn't work"
- This is normal! Sometimes the first command doesn't go through
- Try the command again - it should work after that

### "Addon not showing in Blender"
- Make sure you enabled it (checkbox) after installing
- Try searching for "MCP" in the addon preferences
- Check Blender version is 3.6+

## File Locations

- **Addon file**: `~/secure-openclaw/blender-skills/mcp-addon/addon.py`
- **Claude config**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **MCP server port**: 9876

## Current Config

Your Claude Desktop config now includes:
```json
{
  "mcpServers": {
    "blender": {
      "command": "uvx",
      "args": ["blender-mcp"]
    }
  }
}
```

## What This Enables

Once set up, I'll be able to:
- ✅ See what's in your Blender scene in real-time
- ✅ Create and modify objects instantly
- ✅ Apply materials and colors
- ✅ Control camera and lighting
- ✅ Execute complex Blender operations
- ✅ See changes immediately in your Blender viewport

All through natural language commands!

## Hybrid Mode

You now have BOTH approaches available:
- **MCP Server** (fast, interactive) - when Blender is open
- **Scripting** (automation, batch) - for automated tasks

I'll automatically choose the best method based on your request.

---

Ready to test it? Follow the steps above and let me know when you're done!
