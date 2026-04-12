#!/bin/bash

# Example: Create a colorful scene with multiple objects
# This demonstrates how to chain Blender commands together

WRAPPER="$HOME/secure-openclaw/blender-skills/blender_wrapper.sh"

echo "Creating a colorful scene in Blender..."

# Create a red cube
echo "Creating red cube..."
$WRAPPER create_object '{"obj_type": "CUBE", "name": "RedCube", "location": [-3, 0, 0]}'
$WRAPPER add_material '{"obj_name": "RedCube", "material_name": "Red", "color": [1.0, 0.0, 0.0]}'

# Create a green sphere
echo "Creating green sphere..."
$WRAPPER create_object '{"obj_type": "SPHERE", "name": "GreenSphere", "location": [0, 0, 0]}'
$WRAPPER add_material '{"obj_name": "GreenSphere", "material_name": "Green", "color": [0.0, 1.0, 0.0]}'

# Create a blue cylinder
echo "Creating blue cylinder..."
$WRAPPER create_object '{"obj_type": "CYLINDER", "name": "BlueCylinder", "location": [3, 0, 0]}'
$WRAPPER add_material '{"obj_name": "BlueCylinder", "material_name": "Blue", "color": [0.0, 0.0, 1.0]}'

# Create a ground plane
echo "Creating ground plane..."
$WRAPPER create_object '{"obj_type": "PLANE", "name": "Ground", "location": [0, 0, -2]}'
$WRAPPER transform_object '{"name": "Ground", "scale": [10, 10, 1]}'
$WRAPPER add_material '{"obj_name": "Ground", "material_name": "Gray", "color": [0.5, 0.5, 0.5]}'

# Position the camera
echo "Setting up camera..."
$WRAPPER set_camera_view '{"location": [10, -10, 6], "rotation": [1.1, 0, 0.785]}'

# List all objects
echo -e "\nCurrent objects in scene:"
$WRAPPER list_objects

echo -e "\nScene created! You can now render it with:"
echo "$WRAPPER render_scene '{\"output_path\": \"/tmp/colorful_scene.png\"}'"
