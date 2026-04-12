# Blender Control Skills

This document defines skills for controlling Blender 3D through the Claude agent system.

## Available Skills

### 1. blender-scene-info
**Description:** Get information about the current Blender scene
**Usage:** When you need to understand the current state of the Blender scene
**Command:** `~/secure-openclaw/blender-skills/blender_wrapper.sh get_scene_info`

### 2. blender-list-objects
**Description:** List all objects in the current Blender scene
**Usage:** When you need to see what objects exist
**Command:** `~/secure-openclaw/blender-skills/blender_wrapper.sh list_objects`

### 3. blender-create-object
**Description:** Create a new object in Blender
**Parameters:**
- obj_type: CUBE, SPHERE, CYLINDER, PLANE, CAMERA, LIGHT
- name: Name for the new object
- location: [x, y, z] coordinates (default: [0, 0, 0])
**Usage:** When you need to add a new 3D object
**Example:** `~/secure-openclaw/blender-skills/blender_wrapper.sh create_object '{"obj_type": "CUBE", "name": "MyCube", "location": [2, 0, 0]}'`

### 4. blender-select-object
**Description:** Select an object by name
**Parameters:**
- name: Name of the object to select
**Usage:** When you need to select a specific object for operations
**Example:** `~/secure-openclaw/blender-skills/blender_wrapper.sh select_object '{"name": "Cube"}'`

### 5. blender-transform-object
**Description:** Move, rotate, or scale an object
**Parameters:**
- name: Name of the object
- location: [x, y, z] coordinates (optional)
- rotation: [x, y, z] rotation in radians (optional)
- scale: [x, y, z] scale factors (optional)
**Usage:** When you need to transform an object
**Example:** `~/secure-openclaw/blender-skills/blender_wrapper.sh transform_object '{"name": "Cube", "location": [5, 0, 0], "scale": [2, 2, 2]}'`

### 6. blender-delete-object
**Description:** Delete an object from the scene
**Parameters:**
- name: Name of the object to delete
**Usage:** When you need to remove an object
**Example:** `~/secure-openclaw/blender-skills/blender_wrapper.sh delete_object '{"name": "Cube"}'`

### 7. blender-render
**Description:** Render the current scene to an image
**Parameters:**
- output_path: Path where the rendered image should be saved
**Usage:** When you need to render the scene
**Example:** `~/secure-openclaw/blender-skills/blender_wrapper.sh render_scene '{"output_path": "/tmp/render.png"}'`

### 8. blender-camera
**Description:** Set camera position and rotation
**Parameters:**
- location: [x, y, z] camera position
- rotation: [x, y, z] camera rotation in radians
**Usage:** When you need to position the camera
**Example:** `~/secure-openclaw/blender-skills/blender_wrapper.sh set_camera_view '{"location": [7, -7, 5], "rotation": [1.1, 0, 0.8]}'`

### 9. blender-material
**Description:** Add a material with color to an object
**Parameters:**
- obj_name: Name of the object
- material_name: Name for the new material
- color: [r, g, b] color values (0.0 to 1.0)
**Usage:** When you need to color an object
**Example:** `~/secure-openclaw/blender-skills/blender_wrapper.sh add_material '{"obj_name": "Cube", "material_name": "Red", "color": [1.0, 0.0, 0.0]}'`

### 10. blender-execute
**Description:** Execute arbitrary Python command in Blender context
**Parameters:**
- command: Python expression to evaluate
**Usage:** For advanced operations not covered by other skills
**Example:** `~/secure-openclaw/blender-skills/blender_wrapper.sh execute_command '{"command": "bpy.context.scene.render.engine"}'`

## Integration Instructions for Claude

When the user asks you to control Blender, you should:

1. Use the Bash tool to execute the appropriate wrapper command
2. Parse the JSON response to understand the result
3. Provide feedback to the user about what happened
4. Chain multiple commands together for complex operations

## Examples of Common Tasks

### Create a simple scene
```bash
# Create a cube
~/secure-openclaw/blender-skills/blender_wrapper.sh create_object '{"obj_type": "CUBE", "name": "MyCube", "location": [0, 0, 0]}'

# Create a light
~/secure-openclaw/blender-skills/blender_wrapper.sh create_object '{"obj_type": "LIGHT", "name": "Light", "location": [5, 5, 5]}'

# Create a camera
~/secure-openclaw/blender-skills/blender_wrapper.sh create_object '{"obj_type": "CAMERA", "name": "Camera", "location": [7, -7, 5]}'

# Set camera view
~/secure-openclaw/blender-skills/blender_wrapper.sh set_camera_view '{"location": [7, -7, 5], "rotation": [1.1, 0, 0.8]}'

# Add color to cube
~/secure-openclaw/blender-skills/blender_wrapper.sh add_material '{"obj_name": "MyCube", "material_name": "Blue", "color": [0.0, 0.5, 1.0]}'

# Render
~/secure-openclaw/blender-skills/blender_wrapper.sh render_scene '{"output_path": "/tmp/my_render.png"}'
```

### Animate an object
```bash
# Move object to different positions and render frames
~/secure-openclaw/blender-skills/blender_wrapper.sh transform_object '{"name": "Cube", "location": [0, 0, 0]}'
# (render frame)
~/secure-openclaw/blender-skills/blender_wrapper.sh transform_object '{"name": "Cube", "location": [2, 0, 0]}'
# (render frame)
~/secure-openclaw/blender-skills/blender_wrapper.sh transform_object '{"name": "Cube", "location": [4, 0, 0]}'
# (render frame)
```

## Notes

- All commands run Blender in background mode (headless)
- JSON responses indicate success or error
- Coordinates use Blender's coordinate system (Z-up, right-handed)
- Rotations are in radians
- Colors use RGB values from 0.0 to 1.0
