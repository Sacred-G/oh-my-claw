#!/bin/bash

# Blender Wrapper Script
# This script provides a convenient way to execute Blender commands from the command line

BLENDER_PATH="/Applications/Blender.app/Contents/MacOS/Blender"
CONTROLLER_SCRIPT="$HOME/secure-openclaw/blender-skills/blender_controller.py"

# Check if Blender exists
if [ ! -f "$BLENDER_PATH" ]; then
    echo "Error: Blender not found at $BLENDER_PATH"
    echo "Please set BLENDER_PATH to your Blender installation"
    exit 1
fi

# Check if controller script exists
if [ ! -f "$CONTROLLER_SCRIPT" ]; then
    echo "Error: Controller script not found at $CONTROLLER_SCRIPT"
    exit 1
fi

# Usage function
usage() {
    echo "Usage: $0 <command> [params_json]"
    echo ""
    echo "Commands:"
    echo "  get_scene_info              - Get current scene information"
    echo "  list_objects                - List all objects in scene"
    echo "  create_object               - Create new object"
    echo "  select_object               - Select object by name"
    echo "  transform_object            - Transform object (move/rotate/scale)"
    echo "  delete_object               - Delete object"
    echo "  render_scene                - Render current scene"
    echo "  set_camera_view             - Set camera position and rotation"
    echo "  add_material                - Add material to object"
    echo "  execute_command             - Execute arbitrary Python command"
    echo ""
    echo "Example:"
    echo "  $0 create_object '{\"obj_type\": \"CUBE\", \"name\": \"MyCube\", \"location\": [0, 0, 0]}'"
    exit 1
}

# Check arguments
if [ $# -lt 1 ]; then
    usage
fi

COMMAND=$1
PARAMS=${2:-"{}"}

# Execute Blender with the command
"$BLENDER_PATH" --background --python "$CONTROLLER_SCRIPT" -- "$COMMAND" "$PARAMS"
