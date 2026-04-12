"""
Blender Controller - Helper script for controlling Blender via Python
This script provides utilities for external control of Blender through the bpy API
"""

import bpy
import json
import sys
from typing import Dict, Any, List, Optional


class BlenderController:
    """Main controller class for Blender automation"""

    @staticmethod
    def get_scene_info() -> Dict[str, Any]:
        """Get information about the current scene"""
        scene = bpy.context.scene
        return {
            "name": scene.name,
            "frame_current": scene.frame_current,
            "frame_start": scene.frame_start,
            "frame_end": scene.frame_end,
            "render_engine": scene.render.engine,
            "objects_count": len(scene.objects),
            "camera": scene.camera.name if scene.camera else None
        }

    @staticmethod
    def list_objects() -> List[Dict[str, Any]]:
        """List all objects in the scene"""
        objects = []
        for obj in bpy.data.objects:
            objects.append({
                "name": obj.name,
                "type": obj.type,
                "location": list(obj.location),
                "rotation": list(obj.rotation_euler),
                "scale": list(obj.scale),
                "visible": not obj.hide_viewport
            })
        return objects

    @staticmethod
    def create_object(obj_type: str, name: str, location: List[float] = [0, 0, 0]) -> Dict[str, Any]:
        """Create a new object in the scene"""
        if obj_type == "CUBE":
            bpy.ops.mesh.primitive_cube_add(location=location)
        elif obj_type == "SPHERE":
            bpy.ops.mesh.primitive_uv_sphere_add(location=location)
        elif obj_type == "CYLINDER":
            bpy.ops.mesh.primitive_cylinder_add(location=location)
        elif obj_type == "PLANE":
            bpy.ops.mesh.primitive_plane_add(location=location)
        elif obj_type == "CAMERA":
            bpy.ops.object.camera_add(location=location)
        elif obj_type == "LIGHT":
            bpy.ops.object.light_add(location=location)
        else:
            return {"error": f"Unknown object type: {obj_type}"}

        obj = bpy.context.active_object
        obj.name = name

        return {
            "success": True,
            "name": obj.name,
            "type": obj.type,
            "location": list(obj.location)
        }

    @staticmethod
    def select_object(name: str) -> Dict[str, Any]:
        """Select an object by name"""
        if name not in bpy.data.objects:
            return {"error": f"Object '{name}' not found"}

        # Deselect all
        bpy.ops.object.select_all(action='DESELECT')

        # Select the object
        obj = bpy.data.objects[name]
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj

        return {
            "success": True,
            "name": obj.name,
            "type": obj.type
        }

    @staticmethod
    def transform_object(name: str, location: Optional[List[float]] = None,
                        rotation: Optional[List[float]] = None,
                        scale: Optional[List[float]] = None) -> Dict[str, Any]:
        """Transform an object (move, rotate, scale)"""
        if name not in bpy.data.objects:
            return {"error": f"Object '{name}' not found"}

        obj = bpy.data.objects[name]

        if location:
            obj.location = location
        if rotation:
            obj.rotation_euler = rotation
        if scale:
            obj.scale = scale

        return {
            "success": True,
            "name": obj.name,
            "location": list(obj.location),
            "rotation": list(obj.rotation_euler),
            "scale": list(obj.scale)
        }

    @staticmethod
    def delete_object(name: str) -> Dict[str, Any]:
        """Delete an object by name"""
        if name not in bpy.data.objects:
            return {"error": f"Object '{name}' not found"}

        obj = bpy.data.objects[name]
        bpy.data.objects.remove(obj, do_unlink=True)

        return {"success": True, "deleted": name}

    @staticmethod
    def render_scene(output_path: str) -> Dict[str, Any]:
        """Render the current scene"""
        bpy.context.scene.render.filepath = output_path
        bpy.ops.render.render(write_still=True)

        return {
            "success": True,
            "output_path": output_path
        }

    @staticmethod
    def set_camera_view(location: List[float], rotation: List[float]) -> Dict[str, Any]:
        """Set camera location and rotation"""
        camera = bpy.context.scene.camera
        if not camera:
            return {"error": "No active camera in scene"}

        camera.location = location
        camera.rotation_euler = rotation

        return {
            "success": True,
            "camera": camera.name,
            "location": list(camera.location),
            "rotation": list(camera.rotation_euler)
        }

    @staticmethod
    def add_material(obj_name: str, material_name: str, color: List[float]) -> Dict[str, Any]:
        """Add a material to an object"""
        if obj_name not in bpy.data.objects:
            return {"error": f"Object '{obj_name}' not found"}

        obj = bpy.data.objects[obj_name]

        # Create material
        mat = bpy.data.materials.new(name=material_name)
        mat.use_nodes = True

        # Set color
        bsdf = mat.node_tree.nodes.get("Principled BSDF")
        if bsdf:
            bsdf.inputs['Base Color'].default_value = (*color, 1.0)

        # Assign material
        if obj.data.materials:
            obj.data.materials[0] = mat
        else:
            obj.data.materials.append(mat)

        return {
            "success": True,
            "object": obj_name,
            "material": material_name,
            "color": color
        }

    @staticmethod
    def execute_command(command: str) -> Dict[str, Any]:
        """Execute arbitrary Python command in Blender context"""
        try:
            result = eval(command)
            return {
                "success": True,
                "result": str(result)
            }
        except Exception as e:
            return {
                "error": str(e),
                "command": command
            }


def main():
    """Main entry point for CLI usage"""
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No command provided"}))
        return

    # Get command from arguments (after --)
    try:
        dash_index = sys.argv.index("--")
        args = sys.argv[dash_index + 1:]
    except ValueError:
        print(json.dumps({"error": "Use -- to separate Blender args from script args"}))
        return

    if not args:
        print(json.dumps({"error": "No command provided after --"}))
        return

    command = args[0]
    params = json.loads(args[1]) if len(args) > 1 else {}

    controller = BlenderController()

    # Route command to appropriate method
    if hasattr(controller, command):
        method = getattr(controller, command)
        result = method(**params)
        print(json.dumps(result, indent=2))
    else:
        print(json.dumps({"error": f"Unknown command: {command}"}))


if __name__ == "__main__":
    main()
