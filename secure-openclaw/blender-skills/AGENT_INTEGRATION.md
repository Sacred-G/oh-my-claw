# Blender Skills - Agent Integration Guide

This guide explains how the Secure OpenClaw agent should use the Blender control skills.

## When to Use Blender Skills

Use Blender skills when the user requests:
- Creating 3D objects or scenes
- Controlling Blender
- Rendering 3D images
- Modifying 3D objects (position, rotation, scale, color)
- Automating Blender workflows
- Batch creating objects or animations

## How to Use the Skills

### Basic Pattern

1. **Use the Bash tool** to execute the wrapper script
2. **Parse the JSON response** to understand the result
3. **Provide clear feedback** to the user
4. **Chain commands** for complex operations

### Example Workflows

#### Example 1: Create a red cube

User: "Create a red cube in Blender"

Steps:
1. Create the cube object
2. Add red material to it
3. Confirm to user

Commands:
```bash
~/secure-openclaw/blender-skills/blender_wrapper.sh create_object '{"obj_type": "CUBE", "name": "RedCube", "location": [0, 0, 0]}'

~/secure-openclaw/blender-skills/blender_wrapper.sh add_material '{"obj_name": "RedCube", "material_name": "Red", "color": [1.0, 0.0, 0.0]}'
```

Response: "I created a red cube in Blender at the origin (0, 0, 0)."

#### Example 2: List objects

User: "What objects are in my Blender scene?"

Command:
```bash
~/secure-openclaw/blender-skills/blender_wrapper.sh list_objects
```

Parse the JSON and summarize: "Your Blender scene has 3 objects: a Camera, a Cube at position (0, 0, 0), and a Light."

#### Example 3: Move and scale

User: "Move the cube to position 5, 0, 0 and make it twice as big"

Command:
```bash
~/secure-openclaw/blender-skills/blender_wrapper.sh transform_object '{"name": "Cube", "location": [5, 0, 0], "scale": [2, 2, 2]}'
```

Response: "I moved the cube to position (5, 0, 0) and scaled it to 2x its original size."

#### Example 4: Create a complete scene

User: "Create a simple scene with a colored cube, a light, and render it"

Steps:
1. Create cube with color
2. Create light
3. Position camera
4. Render

Commands:
```bash
# Create blue cube
~/secure-openclaw/blender-skills/blender_wrapper.sh create_object '{"obj_type": "CUBE", "name": "BlueCube", "location": [0, 0, 0]}'
~/secure-openclaw/blender-skills/blender_wrapper.sh add_material '{"obj_name": "BlueCube", "material_name": "Blue", "color": [0.2, 0.5, 1.0]}'

# Create light
~/secure-openclaw/blender-skills/blender_wrapper.sh create_object '{"obj_type": "LIGHT", "name": "MainLight", "location": [5, -5, 5]}'

# Position camera
~/secure-openclaw/blender-skills/blender_wrapper.sh set_camera_view '{"location": [7, -7, 5], "rotation": [1.1, 0, 0.8]}'

# Render
~/secure-openclaw/blender-skills/blender_wrapper.sh render_scene '{"output_path": "/tmp/my_scene.png"}'
```

Response: "I created a scene with a blue cube, added a light, positioned the camera, and rendered it to /tmp/my_scene.png"

#### Example 5: Create multiple objects in a pattern

User: "Create a grid of 3x3 cubes"

Use a bash loop:
```bash
for x in {0..2}; do
  for y in {0..2}; do
    ~/secure-openclaw/blender-skills/blender_wrapper.sh create_object \
      "{\"obj_type\": \"CUBE\", \"name\": \"Cube_${x}_${y}\", \"location\": [$((x*3)), $((y*3)), 0]}"
  done
done
```

Response: "I created a 3x3 grid of cubes in Blender, spaced 3 units apart."

## Command Reference

### Available Commands

| Command | Usage |
|---------|-------|
| `get_scene_info` | Get info about the scene |
| `list_objects` | List all objects |
| `create_object` | Create object (CUBE, SPHERE, CYLINDER, PLANE, CAMERA, LIGHT) |
| `select_object` | Select object by name |
| `transform_object` | Move/rotate/scale object |
| `delete_object` | Delete object |
| `render_scene` | Render to image file |
| `set_camera_view` | Position camera |
| `add_material` | Add colored material |
| `execute_command` | Run custom Python in Blender |

### Wrapper Path

Always use full path: `~/secure-openclaw/blender-skills/blender_wrapper.sh`

### Timeout

Always set timeout to 30000 (30 seconds) or more for Blender commands, as Blender can take time to start up in background mode.

### JSON Formatting

- Use single quotes around the entire JSON parameter
- Use double quotes inside the JSON
- Example: `'{"name": "Cube", "location": [0, 0, 0]}'`

### Error Handling

Check the JSON response for `"error"` field. If present, inform the user:
```json
{"error": "Object 'MissingCube' not found"}
```

Response: "I couldn't find an object named 'MissingCube' in your scene. Would you like me to create it?"

## Best Practices

### 1. Always confirm actions
Don't just execute silently. Tell the user what you did:
- "I created a red sphere at position (2, 0, 0)"
- "I rendered your scene to /tmp/output.png"
- "I moved the cube to position (5, 0, 0) and rotated it 45 degrees"

### 2. Parse JSON responses
Don't show raw JSON to users. Extract the relevant information and present it naturally.

### 3. Chain commands logically
When creating colored objects, create the object first, then add the material.

### 4. Use descriptive names
When creating objects, use meaningful names like "RedCube", "MainLight", "BackgroundPlane" instead of generic names.

### 5. Suggest next steps
After creating a scene, suggest: "Would you like me to render this scene?"

### 6. Handle coordinates clearly
Blender uses Z-up coordinate system. When users say "above", increase Z. "Right" increases X. "Forward" increases Y.

### 7. Rotation clarification
Rotations are in radians. 3.14159 ≈ 180 degrees, 1.5708 ≈ 90 degrees.
If user says degrees, convert: radians = degrees * (π / 180)

### 8. Color format
Colors are RGB from 0.0 to 1.0, not 0-255.
If user says "red", use [1.0, 0.0, 0.0]
If user says "RGB 255, 128, 0", convert: [1.0, 0.5, 0.0]

### 9. Render paths
Use /tmp/ for temporary renders, or ask user for a specific path.
Always use absolute paths for output_path.

### 10. Check before deleting
If user asks to delete, list the object first to confirm it exists.

## Common User Requests and Responses

| User Request | What to Do |
|--------------|------------|
| "Create a [color] [shape]" | create_object + add_material |
| "Move X to Y" | transform_object with location |
| "Make X bigger/smaller" | transform_object with scale |
| "Rotate X" | transform_object with rotation |
| "What's in my scene?" | list_objects and summarize |
| "Render this" | render_scene to /tmp/render.png |
| "Delete X" | delete_object |
| "Position the camera" | set_camera_view |
| "Create a scene with..." | Chain multiple commands |

## Natural Language Processing Tips

### Understand implicit requests
- "Give me a red box" = create cube + add red material
- "Put it over there" (after creating object) = transform_object
- "Light it up" = create_object with LIGHT type
- "Take a picture" = render_scene

### Ask clarifying questions when needed
- User: "Create a sphere"
  You: "I'll create a sphere. What color would you like it, and where should I place it?"

### Infer reasonable defaults
- No position specified? Use [0, 0, 0]
- No color specified? Suggest: "I'll make it gray. Let me know if you want a different color."
- No name specified? Create a descriptive name like "Sphere_1"

## Advanced Features

### Execute arbitrary Python
For advanced users who know Blender Python:
```bash
~/secure-openclaw/blender-skills/blender_wrapper.sh execute_command \
  '{"command": "bpy.context.scene.render.resolution_x"}'
```

### Batch operations
Use bash scripting for repetitive tasks:
```bash
for i in {1..10}; do
  ~/secure-openclaw/blender-skills/blender_wrapper.sh create_object \
    "{\"obj_type\": \"SPHERE\", \"name\": \"Star_$i\", \"location\": [$((RANDOM % 10)), $((RANDOM % 10)), $((RANDOM % 10))]}"
done
```

### Animation frames
Render multiple frames by transforming objects between renders:
```bash
for frame in {0..24}; do
  angle=$(echo "$frame * 0.26" | bc -l)  # 15 degrees per frame
  ~/secure-openclaw/blender-skills/blender_wrapper.sh transform_object \
    "{\"name\": \"Cube\", \"rotation\": [0, 0, $angle]}"
  ~/secure-openclaw/blender-skills/blender_wrapper.sh render_scene \
    "{\"output_path\": \"/tmp/frame_$(printf %04d $frame).png\"}"
done
```

## Examples to Remember

### Simple cube creation
```bash
~/secure-openclaw/blender-skills/blender_wrapper.sh create_object \
  '{"obj_type": "CUBE", "name": "MyCube", "location": [0, 0, 0]}'
```

### Complete scene setup
```bash
# Objects
~/secure-openclaw/blender-skills/blender_wrapper.sh create_object '{"obj_type": "CUBE", "name": "Box", "location": [0, 0, 0]}'
~/secure-openclaw/blender-skills/blender_wrapper.sh add_material '{"obj_name": "Box", "material_name": "Red", "color": [1.0, 0.0, 0.0]}'

# Lighting
~/secure-openclaw/blender-skills/blender_wrapper.sh create_object '{"obj_type": "LIGHT", "name": "Key", "location": [5, -5, 5]}'

# Camera
~/secure-openclaw/blender-skills/blender_wrapper.sh set_camera_view '{"location": [7, -7, 5], "rotation": [1.1, 0, 0.8]}'

# Render
~/secure-openclaw/blender-skills/blender_wrapper.sh render_scene '{"output_path": "/tmp/scene.png"}'
```

## Troubleshooting

### "Object not found"
Object names are case-sensitive. List objects first to get exact names.

### Render appears black
Ensure there's a light source in the scene and the camera is positioned correctly.

### Timeout errors
Increase timeout for complex operations. Blender startup can take 10-20 seconds.

### JSON parse errors
Check quote escaping. Use single quotes around JSON, double quotes inside.

---

Remember: The goal is to make Blender accessible through natural conversation. Be helpful, confirm actions, and guide users toward creating what they envision!
