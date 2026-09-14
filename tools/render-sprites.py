"""
Renders 3D models to top-down sprites, all under one light.

Run with Blender, headless:

    /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/render-sprites.py -- <models dir> <out dir>

This is the pre-rendered-sprite technique that made Diablo and StarCraft cohere:
choose the lighting once for the whole project, bake it into every asset before
it reaches the game, and stop trying to reconcile objects with each other
afterwards. In a 3D game that coherence is free — one render, one light, one
camera. Composited 2D has to manufacture it, and this is where it is cheapest to
do so.

Two things are fixed for every model and are the whole point:

  the camera is orthographic and points straight down, which matches the game's
  own flat projection — no perspective, no 3/4 drift, the failure mode that
  makes bought sprites look pasted on;

  the sun sits at the same angle as LIGHT_ANGLE in src/render/light.ts, up and to
  the left, so every sprite is lit exactly as the road, the kerbs and the islands
  already are.

Scale is not fixed. Each model is framed to its own bounding box so it uses all
its pixels, and its true world size goes into a manifest instead — the game then
draws it at the right size rather than at whatever size happened to look right.
That is how a chimney ends up taller than a car without anyone tuning a number.
"""

import json
import math
import os
import sys
from pathlib import Path

import bpy
from mathutils import Vector

# Matches LIGHT_ANGLE in src/render/light.ts: shadows fall down and slightly
# right on screen, so the sun is up and to the left. Screen y runs down and
# world y runs up, hence the sign flip on the second component.
LIGHT_ANGLE = math.pi * 0.32
SUN_DIRECTION = Vector((-math.cos(LIGHT_ANGLE), math.sin(LIGHT_ANGLE), 1.15)).normalized()

PIXELS = 256
MARGIN = 1.08


def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for block in (bpy.data.meshes, bpy.data.materials, bpy.data.images):
        for item in list(block):
            if item.users == 0:
                block.remove(item)


def setup_world():
    scene = bpy.context.scene
    for engine in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
        try:
            scene.render.engine = engine
            break
        except TypeError:
            continue

    scene.render.film_transparent = True
    scene.render.resolution_x = PIXELS
    scene.render.resolution_y = PIXELS
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'

    # Ambient, so the side away from the sun is shaded rather than black. The
    # board it will stand on is soft and low contrast; a sprite with a pure black
    # face would be the only harsh thing in the frame.
    world = bpy.data.worlds.new('flat')
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs[0].default_value = (0.62, 0.64, 0.66, 1)
    world.node_tree.nodes['Background'].inputs[1].default_value = 0.55
    scene.world = world

    light = bpy.data.lights.new('sun', type='SUN')
    light.energy = 3.6
    light.angle = math.radians(14)
    sun = bpy.data.objects.new('sun', light)
    bpy.context.collection.objects.link(sun)
    sun.location = SUN_DIRECTION * 30
    sun.rotation_euler = (-SUN_DIRECTION).to_track_quat('-Z', 'Y').to_euler()

    camera_data = bpy.data.cameras.new('top')
    camera_data.type = 'ORTHO'
    camera = bpy.data.objects.new('top', camera_data)
    bpy.context.collection.objects.link(camera)
    scene.camera = camera
    return camera


def bounds():
    """World-space extent of everything currently imported."""
    low = Vector((1e9, 1e9, 1e9))
    high = Vector((-1e9, -1e9, -1e9))
    for obj in bpy.context.scene.objects:
        if obj.type != 'MESH':
            continue
        for corner in obj.bound_box:
            point = obj.matrix_world @ Vector(corner)
            low = Vector((min(low[i], point[i]) for i in range(3)))
            high = Vector((max(high[i], point[i]) for i in range(3)))
    return low, high


def render(path, out_dir, camera):
    clear_scene()
    camera = setup_world()
    bpy.ops.import_scene.gltf(filepath=str(path))

    low, high = bounds()
    size = high - low
    centre = (low + high) / 2
    span = max(size.x, size.y) * MARGIN

    camera.data.ortho_scale = span
    camera.location = (centre.x, centre.y, high.z + 40)
    camera.rotation_euler = (0, 0, 0)

    name = path.stem
    bpy.context.scene.render.filepath = str(Path(out_dir) / f'{name}.png')
    bpy.ops.render.render(write_still=True)

    return {
        'name': name,
        # True size in model units, which for this kit is metres. The game turns
        # it into design units with one shared constant.
        'width': round(size.x, 3),
        'depth': round(size.y, 3),
        'height': round(size.z, 3),
        'framed': round(span, 3)
    }


def main():
    argv = sys.argv[sys.argv.index('--') + 1:]
    models = Path(argv[0])
    out_dir = Path(argv[1])
    out_dir.mkdir(parents=True, exist_ok=True)

    camera = setup_world()
    manifest = []
    for path in sorted(models.glob('*.glb')):
        manifest.append(render(path, out_dir, camera))
        print(f'rendered {path.stem}')

    (out_dir / 'manifest.json').write_text(json.dumps(manifest, indent=2))
    print(f'{len(manifest)} sprites -> {out_dir}')


main()
