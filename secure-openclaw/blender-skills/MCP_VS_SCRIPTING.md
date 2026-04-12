# Blender Control: MCP Server vs Scripting vs Hybrid Approach

## Overview

There are three approaches to control Blender with AI:

1. **Scripting Approach** (what I just built)
2. **MCP Server Approach** (Model Context Protocol)
3. **Hybrid Approach** (combining both)

## Comparison

### 1. Scripting Approach (Current Implementation)

**How it works:**
- Bash wrapper executes Blender in background mode
- Python controller runs inside Blender
- Commands sent via command line
- JSON responses returned

**Pros:**
✅ Simple setup - no additional dependencies
✅ Works immediately with existing Blender installation
✅ No server/socket management needed
✅ Cross-platform (macOS, Linux, Windows)
✅ No network ports to configure
✅ Complete control over implementation
✅ Works with any AI system (not just Claude Desktop)
✅ Can be called from anywhere (command line, scripts, cron jobs)
✅ No need to keep Blender running

**Cons:**
❌ Blender restarts for each command (slower for multiple operations)
❌ No persistent state between commands
❌ Higher latency per command (startup overhead)
❌ Cannot interact with Blender GUI in real-time
❌ Not suitable for interactive/live manipulation

**Best for:**
- Batch operations
- Automated rendering pipelines
- CI/CD integration
- Scheduled tasks
- One-off scene generation
- When you don't need Blender GUI open

---

### 2. MCP Server Approach

**How it works:**
- Blender addon creates a TCP socket server (port 9876)
- MCP server connects Claude to this socket
- Real-time bidirectional communication
- Commands executed in running Blender instance

**Pros:**
✅ Fast - no restart between commands
✅ Persistent state maintained
✅ Real-time interaction with Blender GUI
✅ Can see changes immediately in viewport
✅ Multiple commands in quick succession
✅ Thread-safe execution
✅ 51 powerful tools (poly-mcp version)
✅ Auto-dependency installation
✅ Live scene inspection
✅ Better for iterative/interactive work

**Cons:**
❌ More complex setup (addon + MCP server + config)
❌ Requires Claude Desktop or PolyMCP
❌ Need to keep Blender running
❌ Port management (9876 must be available)
❌ Network/socket potential issues
❌ Blender 4.4+ required
❌ Additional dependencies (FastAPI, Uvicorn, etc.)
❌ More moving parts that can fail

**Best for:**
- Interactive 3D modeling sessions
- Real-time scene manipulation
- Iterative design work
- Learning/exploring Blender
- When you want to see changes live
- Complex multi-step workflows

---

### 3. Hybrid Approach (Recommended!)

**How it works:**
- Use MCP server for interactive work
- Use scripting for automation/batch work
- Switch based on use case

**Architecture:**
```
User Request
    ↓
Agent analyzes request
    ↓
    ├─ Interactive? → MCP Server → Live Blender
    └─ Batch/Automated? → Script → Background Blender
```

**Benefits:**
✅ Best of both worlds
✅ Flexibility for different scenarios
✅ MCP for fast iteration, scripting for production
✅ Can leverage existing tools
✅ Graceful fallback if MCP unavailable

**Implementation Strategy:**
1. Keep current scripting implementation
2. Add MCP server setup
3. Agent decides which to use based on context

---

## Detailed MCP Server Options

### Option A: ahujasid/blender-mcp
- **Repository:** https://github.com/ahujasid/blender-mcp
- **Website:** https://blender-mcp.com/ (unofficial)
- **Tools:** 22 tools across 6 namespaces
- **Installation:** uvx + Blender addon
- **Configuration:** Claude Desktop config JSON
- **Status:** Well-documented, tutorials available

### Option B: poly-mcp/Blender-MCP-Server
- **Repository:** https://github.com/poly-mcp/Blender-MCP-Server
- **Tools:** 51 powerful tools
- **Features:** Thread-safe, auto-dependency installation
- **Integration:** Made for PolyMCP orchestration
- **Status:** More comprehensive, production-ready

### Option C: CommonSenseMachines/blender-mcp
- **Repository:** https://github.com/CommonSenseMachines/blender-mcp
- **Focus:** Text to 4D Worlds
- **Status:** Experimental/advanced

### Option D: blender-open-mcp (Local LLMs)
- **Repository:** https://github.com/dhakalnirajan/blender-open-mcp
- **Focus:** Open Models MCP using Ollama
- **Benefit:** No cloud services, runs locally
- **Status:** Privacy-focused alternative

---

## Recommendation: Hybrid Approach

### Use MCP Server When:
- You're in an interactive session with Blender open
- You want to see changes in real-time
- You're doing iterative design work
- You need to inspect the scene frequently
- Multiple commands need to execute quickly
- You're using Claude Desktop

### Use Scripting When:
- Running batch operations
- Automated rendering pipelines
- CI/CD integration
- Scheduled/cron tasks
- Blender GUI not needed
- Working from command line
- Need cross-platform compatibility
- No network/port requirements

### Implementation Plan

**Phase 1: Keep Current System** ✅ (Done)
- Scripting approach fully functional
- Works for automation and batch tasks

**Phase 2: Add MCP Server** (Optional)
- Install MCP server (recommend poly-mcp for 51 tools)
- Configure Claude Desktop
- Install Blender addon
- Test connection

**Phase 3: Agent Decision Logic**
```python
def choose_blender_control(request):
    if is_interactive_session() and mcp_available():
        return use_mcp_server()
    else:
        return use_scripting()
```

---

## Installation Guide: MCP Server

### Prerequisites
- Blender 4.4+
- Claude Desktop app
- Python 3.10+
- UV package manager

### Setup Steps

**1. Install UV**
```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Verify
uv --version
```

**2. Configure Claude Desktop**
```bash
# Open config
# Claude > Settings > Developer > Edit Config

# Add to claude_desktop_config.json:
{
  "mcpServers": {
    "blender": {
      "command": "uvx",
      "args": ["blender-mcp"]
    }
  }
}
```

**3. Install Blender Addon**
```bash
# Download addon.py from chosen repo
# For poly-mcp (recommended):
# https://github.com/poly-mcp/Blender-MCP-Server

# In Blender:
# Edit > Preferences > Add-ons > Install
# Select downloaded addon.py
# Enable the addon
```

**4. Start MCP Server in Blender**
```
# In Blender addon panel:
# Click "Start MCP Server"
# Should see: "MCP Server started on port 9876"
```

**5. Verify Connection**
```
# In Claude Desktop:
# Look for hammer icon (🔨)
# Should see Blender MCP tools available
```

---

## Comparison Table

| Feature | Scripting | MCP Server | Hybrid |
|---------|-----------|------------|--------|
| **Setup Complexity** | Simple | Complex | Medium |
| **Speed per Command** | Slow (restart) | Fast | Depends |
| **Real-time GUI** | No | Yes | Yes (MCP) |
| **Persistent State** | No | Yes | Yes (MCP) |
| **Batch Operations** | Excellent | Good | Excellent |
| **Dependencies** | None | Many | Both |
| **Port Requirements** | None | 9876 | 9876 (MCP) |
| **Claude Desktop** | Not needed | Required | Optional |
| **Blender Running** | Not needed | Required | Depends |
| **Cross-platform** | Yes | Yes | Yes |
| **Automation** | Excellent | Good | Excellent |
| **Interactive Work** | Poor | Excellent | Excellent |
| **Tool Count** | 10 | 22-51 | Combined |
| **Fallback Option** | N/A | Script | Yes |

---

## Use Case Examples

### Example 1: Render Farm (Use Scripting)
```bash
# Process 100 frames
for frame in {1..100}; do
  ~/secure-openclaw/blender-skills/blender_wrapper.sh render_scene \
    "{\"output_path\": \"/renders/frame_$frame.png\"}"
done
```
✅ Scripting is perfect - no GUI needed, batch operation

### Example 2: Interactive Modeling (Use MCP)
User: "Create a red cube"
Agent: *Uses MCP* - User sees cube appear instantly
User: "Make it bigger and move it right"
Agent: *Uses MCP* - Changes happen in real-time
User: "Add a light above it"
Agent: *Uses MCP* - Light appears immediately
✅ MCP is perfect - fast iterations, visual feedback

### Example 3: Scene Generation Pipeline (Use Hybrid)
```
1. Generate base scene → MCP (interactive)
2. User adjusts interactively → MCP (real-time)
3. User approves design
4. Render 100 variations → Scripting (batch)
```
✅ Hybrid leverages strengths of both

---

## My Recommendation

**For you right now:**

1. **Start with the scripting approach I built** ✅
   - It's ready to use immediately
   - No additional setup
   - Great for learning and automation

2. **Add MCP server later if you need it**
   - Install when you want interactive sessions
   - Especially useful if you're using Claude Desktop
   - poly-mcp version recommended (51 tools)

3. **I'll automatically choose the best approach**
   - When MCP is available and you're interactive: use MCP
   - When you need batch/automation: use scripting
   - Seamless switching based on context

**Quick Decision Guide:**

- **Just want to try it out?** → Use scripting (already done!)
- **Heavy Claude Desktop user?** → Add MCP server
- **Need automation pipelines?** → Scripting is perfect
- **Interactive 3D modeling?** → MCP server worth it
- **Want maximum flexibility?** → Hybrid (both)

---

## Sources & Resources

### MCP Server Projects
- [ahujasid/blender-mcp](https://github.com/ahujasid/blender-mcp) - 22 tools, well-documented
- [poly-mcp/Blender-MCP-Server](https://github.com/poly-mcp/Blender-MCP-Server) - 51 tools, production-ready
- [CommonSenseMachines/blender-mcp](https://github.com/CommonSenseMachines/blender-mcp) - Text to 4D Worlds
- [blender-open-mcp](https://github.com/dhakalnirajan/blender-open-mcp) - Local LLM support

### Tutorials & Documentation
- [Blender MCP Official Site](https://blender-mcp.com/) (unofficial but helpful)
- [Installation Tutorial](https://www.blender-mcp.online/installation-tutorial)
- [YUV.AI Blog: BlenderMCP](https://yuv.ai/blog/blender-mcp)
- [Medium: How to Install Blender-MCP](https://medium.com/data-science-in-your-pocket/how-to-install-blender-mcp-in-windows-for-claude-ai-347233f83155)
- [Vagon: How to Use Blender MCP](https://vagon.io/blog/how-to-use-blender-mcp-with-anthropic-claude-ai)
- [PyPI: blender-mcp-server](https://pypi.org/project/blender-mcp-server/)

### Additional Resources
- [Building a Blender MCP Server Guide](https://medium.com/@technologuy/building-a-blender-mcp-server-a-complete-guide-to-ai-powered-3d-automation-c628089ad11d)
- [Blender MCP Tutorial Center](https://blender-mcp.com/tutorials.html)
- [DEV Community: Blender MCP Integration](https://dev.to/mehmetakar/blender-mcp-seamless-integration-of-blender-with-claude-ai-302g)

---

## Conclusion

**Answer to your question:**

Yes, MCP server would be better than pure scripting **for interactive work**, but scripting is better **for automation**.

**The hybrid approach is optimal** - use MCP when you're working interactively with Blender open, and use scripting for batch operations and automation.

You already have a fully functional scripting system ready to use. You can add MCP server later when you need real-time interaction. I'll intelligently choose which method to use based on the context of your request.

**Next steps:**
1. Try the scripting approach first (it's ready now!)
2. If you find yourself wanting real-time interaction, set up MCP server
3. I'll handle the decision of which to use automatically

Want me to help you set up the MCP server, or try out the scripting approach first?
