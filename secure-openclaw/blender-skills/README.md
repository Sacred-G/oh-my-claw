# Blender Control Skills for Secure OpenClaw

This package provides AI-powered control of Blender 3D through natural language commands via the Secure OpenClaw agent system.

## Overview

The Blender Control Skills allow you to:
- Create, modify, and delete 3D objects
- Control camera position and rendering
- Apply materials and colors
- Execute custom Python commands in Blender
- Automate complex 3D workflows

## Installation

### Prerequisites

1. **Blender 3.0+** installed on your system
   - macOS: Typically at `/Applications/Blender.app/Contents/MacOS/Blender`
   - Linux: Usually at `/usr/bin/blender` or `/usr/local/bin/blender`
   - Windows: Check `C:\Program Files\Blender Foundation\Blender\blender.exe`

2. **Python 3.x** (usually comes with Blender)

### Setup Steps

1. **Verify Blender Installation**
   ```bash
   /Applications/Blender.app/Contents/MacOS/Blender --version
   ```

2. **Configure Blender Path** (if different from default)
   Edit `~/secure-openclaw/blender-skills/blender_wrapper.sh` and update:
   ```bash
   BLENDER_PATH="/path/to/your/Blender"
   ```

3. **Test the Installation**
   ```bash
   ~/secure-openclaw/blender-skills/blender_wrapper.sh list_objects
   ```

## Architecture

The system consists of three main components:

### 1. `blender_controller.py`
The core Python module that runs inside Blender. It provides:
- **BlenderController class**: Main API for Blender operations
- Methods for scene manipulation, object creation, rendering, etc.
- JSON-based command/response interface

### 2. `blender_wrapper.sh`
A bash wrapper that:
- Launches Blender in background mode
- Loads the controller script
- Passes commands and parameters
- Returns JSON responses

### 3. `SKILLS.md`
Documentation defining available skills:
- Command syntax
- Parameter specifications
- Usage examples
- Integration guidelines

## Usage

### From Command Line

```bash
# Get scene information
~/secure-openclaw/blender-skills/blender_wrapper.sh get_scene_info

# Create a cube
~/secure-openclaw/blender-skills/blender_wrapper.sh create_object \
  '{"obj_type": "CUBE", "name": "MyCube", "location": [0, 0, 0]}'

# Transform an object
~/secure-openclaw/blender-skills/blender_wrapper.sh transform_object \
  '{"name": "MyCube", "location": [5, 0, 0], "scale": [2, 2, 2]}'

# Render scene
~/secure-openclaw/blender-skills/blender_wrapper.sh render_scene \
  '{"output_path": "/tmp/render.png"}'
```

### Through Secure OpenClaw Agent

Just ask in natural language:

- "Create a red cube in Blender at position 2, 0, 0"
- "List all objects in my Blender scene"
- "Render the current scene to /tmp/output.png"
- "Move the cube to position 5, 5, 0 and make it twice as big"
- "Add a blue sphere next to the cube"

The agent will automatically use the appropriate Blender skills to accomplish the task.

## Available Commands

| Command | Description | Parameters |
|---------|-------------|------------|
| `get_scene_info` | Get scene details | None |
| `list_objects` | List all objects | None |
| `create_object` | Create new object | obj_type, name, location |
| `select_object` | Select object | name |
| `transform_object` | Move/rotate/scale | name, location, rotation, scale |
| `delete_object` | Delete object | name |
| `render_scene` | Render to image | output_path |
| `set_camera_view` | Position camera | location, rotation |
| `add_material` | Add colored material | obj_name, material_name, color |
| `execute_command` | Run Python code | command |

See [SKILLS.md](SKILLS.md) for detailed documentation.

## Examples

### Example 1: Create a Simple Scene

```bash
# Create a cube
~/secure-openclaw/blender-skills/blender_wrapper.sh create_object \
  '{"obj_type": "CUBE", "name": "Box", "location": [0, 0, 0]}'

# Add red material
~/secure-openclaw/blender-skills/blender_wrapper.sh add_material \
  '{"obj_name": "Box", "material_name": "Red", "color": [1.0, 0.0, 0.0]}'

# Create a light
~/secure-openclaw/blender-skills/blender_wrapper.sh create_object \
  '{"obj_type": "LIGHT", "name": "MainLight", "location": [5, -5, 5]}'

# Create and position camera
~/secure-openclaw/blender-skills/blender_wrapper.sh create_object \
  '{"obj_type": "CAMERA", "name": "Camera", "location": [7, -7, 5]}'

~/secure-openclaw/blender-skills/blender_wrapper.sh set_camera_view \
  '{"location": [7, -7, 5], "rotation": [1.1, 0, 0.8]}'

# Render
~/secure-openclaw/blender-skills/blender_wrapper.sh render_scene \
  '{"output_path": "/tmp/my_scene.png"}'
```

### Example 2: Batch Create Objects

```bash
# Create a grid of cubes
for x in {0..4}; do
  for y in {0..4}; do
    ~/secure-openclaw/blender-skills/blender_wrapper.sh create_object \
      "{\"obj_type\": \"CUBE\", \"name\": \"Cube_${x}_${y}\", \"location\": [$x, $y, 0]}"
  done
done
```

### Example 3: Animation Frames

```bash
# Render animation frames with moving object
for frame in {0..10}; do
  x=$((frame * 2))
  ~/secure-openclaw/blender-skills/blender_wrapper.sh transform_object \
    "{\"name\": \"Cube\", \"location\": [$x, 0, 0]}"

  ~/secure-openclaw/blender-skills/blender_wrapper.sh render_scene \
    "{\"output_path\": \"/tmp/frame_$(printf %04d $frame).png\"}"
done
```

## Advanced: Using blender-remote for Live Control

For more interactive control with a running Blender instance:

1. **Install blender-remote**
   ```bash
   pip install blender-remote
   ```

2. **Install in Blender**
   - Follow instructions at: https://github.com/igamenovoer/blender-remote
   - Set environment variables for auto-start

3. **Connect from Python**
   ```python
   # Your external Python script can now control Blender in real-time
   # See blender-remote documentation for details
   ```

## Troubleshooting

### Blender not found
- Update `BLENDER_PATH` in `blender_wrapper.sh`
- Verify with: `which blender` or check your Applications folder

### Permission denied
- Make wrapper executable: `chmod +x ~/secure-openclaw/blender-skills/blender_wrapper.sh`

### Command errors
- Check JSON syntax (use single quotes around JSON, double quotes inside)
- Verify object names exist before operating on them
- Check Blender version compatibility (3.0+)

### Render issues
- Ensure output directory exists
- Check render settings in scene
- Verify camera is set up correctly

## API Reference

### BlenderController Methods

#### `get_scene_info() -> Dict[str, Any]`
Returns information about current scene including name, frame range, render engine, object count, and active camera.

#### `list_objects() -> List[Dict[str, Any]]`
Returns list of all objects with their properties (name, type, location, rotation, scale, visibility).

#### `create_object(obj_type: str, name: str, location: List[float]) -> Dict[str, Any]`
Creates a new object of specified type at given location.

**Object Types:**
- CUBE
- SPHERE
- CYLINDER
- PLANE
- CAMERA
- LIGHT

#### `select_object(name: str) -> Dict[str, Any]`
Selects object by name and makes it active.

#### `transform_object(name: str, location: Optional[List[float]], rotation: Optional[List[float]], scale: Optional[List[float]]) -> Dict[str, Any]`
Transforms object with optional location, rotation (radians), and scale.

#### `delete_object(name: str) -> Dict[str, Any]`
Removes object from scene.

#### `render_scene(output_path: str) -> Dict[str, Any]`
Renders current scene to specified file path.

#### `set_camera_view(location: List[float], rotation: List[float]) -> Dict[str, Any]`
Positions active camera.

#### `add_material(obj_name: str, material_name: str, color: List[float]) -> Dict[str, Any]`
Creates and assigns a material with specified color (RGB 0.0-1.0).

#### `execute_command(command: str) -> Dict[str, Any]`
Executes arbitrary Python expression in Blender context.

## Resources

### Documentation Links

- **Blender Python API**: https://docs.blender.org/api/current/
- **Blender Manual**: https://docs.blender.org/manual/en/latest/
- **Python Scripting Tutorial**: https://thenewschoolexeter.co.uk/2026/03/blender-programming-tutorial.html
- **Animation Pipeline Guide**: https://blog.cg-wire.com/blender-scripting-animation/
- **blender-remote**: https://github.com/igamenovoer/blender-remote

### Key Concepts

- **bpy**: Blender's Python module
- **bpy.data**: Access to all Blender data (objects, meshes, materials, etc.)
- **bpy.ops**: Operators (actions/commands)
- **bpy.context**: Current context (active object, scene, etc.)
- **bpy.types**: Type definitions for UI and data structures

## Contributing

To add new skills:

1. Add method to `BlenderController` class in `blender_controller.py`
2. Document in `SKILLS.md`
3. Add example to this README
4. Test thoroughly

## License

This project is part of Secure OpenClaw and follows the same license.

## Credits

Built using:
- Blender Python API (bpy)
- Research from official Blender documentation
- Inspired by blender-remote project
- 2026 Blender automation tutorials

---

For questions or issues, consult the agent or check the official Blender Python API documentation.
