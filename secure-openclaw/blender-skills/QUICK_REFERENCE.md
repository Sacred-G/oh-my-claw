# Blender Skills - Quick Reference

## Wrapper Command
```bash
~/secure-openclaw/blender-skills/blender_wrapper.sh <command> '<json_params>'
```

## Commands Cheat Sheet

### Get Information
```bash
# Scene info
blender_wrapper.sh get_scene_info

# List objects
blender_wrapper.sh list_objects
```

### Create Objects
```bash
# Cube
blender_wrapper.sh create_object '{"obj_type": "CUBE", "name": "MyCube", "location": [0, 0, 0]}'

# Sphere
blender_wrapper.sh create_object '{"obj_type": "SPHERE", "name": "Ball", "location": [2, 0, 0]}'

# Cylinder
blender_wrapper.sh create_object '{"obj_type": "CYLINDER", "name": "Tube", "location": [0, 2, 0]}'

# Plane
blender_wrapper.sh create_object '{"obj_type": "PLANE", "name": "Floor", "location": [0, 0, -1]}'

# Camera
blender_wrapper.sh create_object '{"obj_type": "CAMERA", "name": "Cam1", "location": [7, -7, 5]}'

# Light
blender_wrapper.sh create_object '{"obj_type": "LIGHT", "name": "Sun", "location": [5, -5, 5]}'
```

### Transform Objects
```bash
# Move
blender_wrapper.sh transform_object '{"name": "Cube", "location": [5, 0, 0]}'

# Rotate (radians)
blender_wrapper.sh transform_object '{"name": "Cube", "rotation": [0, 0, 1.57]}'

# Scale
blender_wrapper.sh transform_object '{"name": "Cube", "scale": [2, 2, 2]}'

# All at once
blender_wrapper.sh transform_object '{"name": "Cube", "location": [5, 0, 0], "rotation": [0, 0, 1.57], "scale": [2, 2, 2]}'
```

### Materials & Colors
```bash
# Red (RGB: 1.0, 0.0, 0.0)
blender_wrapper.sh add_material '{"obj_name": "Cube", "material_name": "Red", "color": [1.0, 0.0, 0.0]}'

# Green
blender_wrapper.sh add_material '{"obj_name": "Cube", "material_name": "Green", "color": [0.0, 1.0, 0.0]}'

# Blue
blender_wrapper.sh add_material '{"obj_name": "Cube", "material_name": "Blue", "color": [0.0, 0.0, 1.0]}'

# Gray
blender_wrapper.sh add_material '{"obj_name": "Cube", "material_name": "Gray", "color": [0.5, 0.5, 0.5]}'

# Custom color
blender_wrapper.sh add_material '{"obj_name": "Cube", "material_name": "Custom", "color": [0.8, 0.3, 0.1]}'
```

### Camera
```bash
# Set camera position and rotation
blender_wrapper.sh set_camera_view '{"location": [7, -7, 5], "rotation": [1.1, 0, 0.8]}'
```

### Rendering
```bash
# Render to file
blender_wrapper.sh render_scene '{"output_path": "/tmp/render.png"}'

# Render with custom name
blender_wrapper.sh render_scene '{"output_path": "/tmp/my_scene_001.png"}'
```

### Object Management
```bash
# Select object
blender_wrapper.sh select_object '{"name": "Cube"}'

# Delete object
blender_wrapper.sh delete_object '{"name": "Cube"}'
```

### Advanced
```bash
# Execute Python
blender_wrapper.sh execute_command '{"command": "bpy.context.scene.render.engine"}'

# Get render resolution
blender_wrapper.sh execute_command '{"command": "bpy.context.scene.render.resolution_x"}'
```

## Common Patterns

### Create Colored Object
```bash
blender_wrapper.sh create_object '{"obj_type": "CUBE", "name": "RedBox", "location": [0, 0, 0]}'
blender_wrapper.sh add_material '{"obj_name": "RedBox", "material_name": "Red", "color": [1.0, 0.0, 0.0]}'
```

### Simple Scene
```bash
# Cube
blender_wrapper.sh create_object '{"obj_type": "CUBE", "name": "Box", "location": [0, 0, 0]}'
blender_wrapper.sh add_material '{"obj_name": "Box", "material_name": "Blue", "color": [0.2, 0.5, 1.0]}'

# Light
blender_wrapper.sh create_object '{"obj_type": "LIGHT", "name": "Sun", "location": [5, -5, 5]}'

# Camera
blender_wrapper.sh set_camera_view '{"location": [7, -7, 5], "rotation": [1.1, 0, 0.8]}'

# Render
blender_wrapper.sh render_scene '{"output_path": "/tmp/scene.png"}'
```

### Grid of Objects
```bash
for x in {0..2}; do
  for y in {0..2}; do
    blender_wrapper.sh create_object \
      "{\"obj_type\": \"CUBE\", \"name\": \"Cube_${x}_${y}\", \"location\": [$((x*3)), $((y*3)), 0]}"
  done
done
```

## Color Reference (RGB 0.0-1.0)

| Color | RGB Values |
|-------|------------|
| Red | [1.0, 0.0, 0.0] |
| Green | [0.0, 1.0, 0.0] |
| Blue | [0.0, 0.0, 1.0] |
| Yellow | [1.0, 1.0, 0.0] |
| Cyan | [0.0, 1.0, 1.0] |
| Magenta | [1.0, 0.0, 1.0] |
| White | [1.0, 1.0, 1.0] |
| Black | [0.0, 0.0, 0.0] |
| Gray | [0.5, 0.5, 0.5] |
| Orange | [1.0, 0.5, 0.0] |
| Purple | [0.5, 0.0, 0.5] |

## Coordinate System

- **X-axis**: Left (-) to Right (+)
- **Y-axis**: Back (-) to Front (+)
- **Z-axis**: Down (-) to Up (+)

Blender uses Z-up coordinate system.

## Rotation (Radians)

| Degrees | Radians |
|---------|---------|
| 0° | 0 |
| 45° | 0.785 |
| 90° | 1.571 |
| 180° | 3.142 |
| 270° | 4.712 |
| 360° | 6.283 |

Formula: radians = degrees × (π / 180) ≈ degrees × 0.01745

## Object Types

- `CUBE` - Basic cube mesh
- `SPHERE` - UV sphere mesh
- `CYLINDER` - Cylinder mesh
- `PLANE` - Flat plane mesh
- `CAMERA` - Camera object
- `LIGHT` - Light source

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Blender not found" | Update `BLENDER_PATH` in wrapper script |
| "Object not found" | Check exact name with `list_objects` |
| Render is black | Add light and check camera position |
| JSON error | Check quote escaping: `'{"key": "value"}'` |
| Timeout | Increase timeout parameter to 30000+ |

## File Locations

- **Wrapper**: `~/secure-openclaw/blender-skills/blender_wrapper.sh`
- **Controller**: `~/secure-openclaw/blender-skills/blender_controller.py`
- **Documentation**: `~/secure-openclaw/blender-skills/README.md`
- **Examples**: `~/secure-openclaw/blender-skills/examples/`

## Example Script

See: `~/secure-openclaw/blender-skills/examples/create_colorful_scene.sh`

Run with:
```bash
~/secure-openclaw/blender-skills/examples/create_colorful_scene.sh
```
