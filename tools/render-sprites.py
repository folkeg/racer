"""
Renders 3D models to sprites, all under one light, at the game's own camera.

Run with Blender, headless:

    Blender -b -P tools/render-sprites.py -- <models dir> <out dir> [tilt-degrees] [yaws]

This is the pre-rendered-sprite technique that made Diablo and StarCraft cohere:
choose the lighting once for the whole project, bake it into every asset before
it reaches the game, and stop trying to reconcile objects with each other
afterwards. In a 3D game that coherence is free — one render, one light, one
camera. Composited 2D has to manufacture it, and this is where it is cheapest.

Three things are fixed for every model.

THE CAMERA IS THE GAME'S CAMERA. It is orthographic, and it is tilted by exactly
the angle the game's ground plane is viewed from: src/render/camera.ts pitches
1.40 radians off the horizontal, which is 9.8 degrees off vertical. The first
version of this script pointed the camera straight down, on the reasoning that
the projection is "flat" — and straight down is the one angle from which a
building is not a building. A cylindrical tank rendered from directly overhead
is a grey disc with a dot in the middle; it was put on the board and immediately
asked about, twice. The tilt is what puts a wall under the roof.

THE SUN DOES NOT MOVE. So a model that has to stand at an angle cannot be
rotated by the game — rotating the sprite rotates its baked shadow with it, and
one building lit from the wrong side is more obviously wrong than a whole board
lit flatly. Instead the *model* is turned under a fixed sun and camera, and each
yaw is written as its own sprite. That is what lets a row of sheds line a curved
straight and still agree with the light on the road beside them.

SCALE IS MEASURED, NOT CHOSEN. Each model is framed to its own bounding box and
its true size goes into the manifest, so the game draws it at the size it is.
With a tilt the footprint no longer sits in the middle of the frame — height
pushes the image up — so the manifest also carries where the ground actually is.
"""

import json
import math
import os
import sys
from pathlib import Path

import bpy
from mathutils import Matrix, Vector

# Matches LIGHT_ANGLE in src/render/light.ts: shadows fall down and slightly
# right on screen, so the sun is up and to the left. Screen y runs down and
# world y runs up, hence the sign flip on the second component.
LIGHT_ANGLE = math.pi * 0.32
SUN_DIRECTION = Vector((-math.cos(LIGHT_ANGLE), math.sin(LIGHT_ANGLE), 1.15)).normalized()

# PITCH in src/render/camera.ts is 1.40 radians off the horizontal.
GAME_TILT_DEGREES = 90 - math.degrees(1.40)

PIXELS = 176
MARGIN = 1.10


def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for block in (bpy.data.meshes, bpy.data.materials, bpy.data.images):
        for item in list(block):
            if item.users == 0:
                block.remove(item)


def setup_world(tilt):
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
    # Blender's default is 15, which is barely compressed at all.
    scene.render.image_settings.compression = 100

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

    camera_data = bpy.data.cameras.new('game')
    camera_data.type = 'ORTHO'
    camera = bpy.data.objects.new('game', camera_data)
    bpy.context.collection.objects.link(camera)
    # Tilted about X, so the camera looks down and towards +Y. Screen right is
    # world +X; screen up is world (0, cos t, sin t) — which is why height moves
    # a point up the frame and depth is foreshortened by cos t, exactly as the
    # game's own projection foreshortens the ground.
    camera.rotation_euler = (math.radians(tilt), 0, 0)
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


def roots():
    """Top-level imported objects.

    Not the meshes: glTF import parents every mesh under an empty, so a rotation
    applied to objects filtered by type MESH and parent None touches nothing at
    all — which is exactly how the first yaw set came out as eight copies of the
    same sprite.
    """
    return [o for o in bpy.context.scene.objects
            if o.parent is None and o.type in {'MESH', 'EMPTY'}]


def render_model(path, out_dir, tilt, yaws):
    """Renders one model at every yaw, and returns its manifest entry."""
    name = path.stem
    radians = math.radians(tilt)
    cos_t, sin_t = math.cos(radians), math.sin(radians)

    clear_scene()
    camera = setup_world(tilt)
    bpy.ops.import_scene.gltf(filepath=str(path))
    low, high = bounds()
    size = high - low

    spans = []
    anchors = []

    for step in range(yaws):
        angle = (step / yaws) * math.pi * 2
        clear_scene()
        camera = setup_world(tilt)
        bpy.ops.import_scene.gltf(filepath=str(path))
        turn = Matrix.Rotation(angle, 4, 'Z')
        for obj in roots():
            obj.matrix_world = turn @ obj.matrix_world
        bpy.context.view_layer.update()

        low_i, high_i = bounds()
        centre_i = (low_i + high_i) / 2
        size_i = high_i - low_i

        # Framed to this yaw, not to the model's diagonal.
        #
        # One framing shared by every yaw is the obvious way to keep the sprites
        # agreeing about scale, and it costs most of the image: a building framed
        # on its own diagonal fills 57% of the width and a third of the pixels,
        # so two thirds of every file is empty margin and the building is drawn
        # from a third of the resolution it was rendered at. Framing each yaw to
        # itself and carrying the span in the manifest gets both back — the game
        # scales by the number rather than by an assumption.
        span = max(size_i.x, size_i.y * cos_t + size_i.z * sin_t) * MARGIN
        camera.data.ortho_scale = span

        # Where the ground is in the finished sprite. The camera frames the
        # middle of the bounding box, but what has to land on the ground is the
        # middle of the footprint, and a tilt draws a point at height z further
        # up the frame by z*sin(tilt).
        spans.append(round(span, 4))
        anchors.append(round((centre_i.z - low_i.z) * sin_t / span, 4))

        # Back the camera off along its own view direction so nothing clips.
        view = Vector((0, sin_t, -cos_t))
        camera.location = centre_i - view * 60

        suffix = '' if yaws == 1 else f'-{step}'
        bpy.context.scene.render.filepath = str(Path(out_dir) / f'{name}{suffix}.png')
        bpy.ops.render.render(write_still=True)

    return {
        'name': name,
        # True size in model units. The game turns it into design units with one
        # shared constant.
        'width': round(size.x, 3),
        'depth': round(size.y, 3),
        'height': round(size.z, 3),
        'spans': spans,
        'anchors': anchors,
        'yaws': yaws
    }


def main():
    argv = sys.argv[sys.argv.index('--') + 1:]
    models = Path(argv[0])
    out_dir = Path(argv[1])
    tilt = float(argv[2]) if len(argv) > 2 else GAME_TILT_DEGREES
    default_yaws = int(argv[3]) if len(argv) > 3 else 1
    # Optional fourth argument: a comma-separated list of models to render, each
    # optionally with its own yaw count as name:yaws. A cylinder needs one.
    wanted = None
    if len(argv) > 4 and argv[4]:
        wanted = {}
        for item in argv[4].split(','):
            name, _, count = item.partition(':')
            wanted[name] = int(count) if count else default_yaws
    out_dir.mkdir(parents=True, exist_ok=True)

    manifest = []
    for path in sorted(models.glob('*.glb')):
        if wanted is not None and path.stem not in wanted:
            continue
        yaws = wanted[path.stem] if wanted is not None else default_yaws
        manifest.append(render_model(path, out_dir, tilt, yaws))
        print(f'rendered {path.stem} x{yaws}')

    (out_dir / 'manifest.json').write_text(json.dumps(manifest, indent=2))
    print(f'{len(manifest)} models at tilt {tilt:.1f} -> {out_dir}')


main()
