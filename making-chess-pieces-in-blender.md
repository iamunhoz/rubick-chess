# Making Chess Pieces in Blender via MCP

## Context

The project had a `Chess.glb` sourced online that caused persistent rendering issues: ghostly/translucent white pieces, vertex colors fighting runtime materials, and extensive workarounds in `src/render/pieces.ts`. The user wanted pieces designed from scratch in Blender using the Blender MCP.

**Art style chosen:** Smooth classic Staunton (32-sided revolution, tournament chess set look).

## What Was Built

6 chess pieces exported as a single `assets/Chess.glb` (no materials, no vertex colors) — a drop-in replacement requiring zero TypeScript changes.

| Piece | Technique | Key Features |
|-------|-----------|--------------|
| **Pawn** | Pure lathe (32 segments) | Ball top, collar ring, narrow stem, wide base |
| **Knight** | Lathe base + rounded extruded profile | Semicircular Y cross-section for continuous neck-to-head, horse silhouette with ears/snout |
| **Bishop** | Lathe + boolean slash | Pointed mitre body, diagonal slash, ball finial |
| **Rook** | Lathe + bmesh merlons | Straight-walled tower, 5 prominent battlement blocks on rim |
| **Queen** | Lathe + bmesh crown points + bmesh sphere | 8 tall arching crown prongs, ball finial — tallest piece |
| **King** | Lathe + bmesh cross | Smooth dome top, big cross (0.24 wide, 0.30 tall) |

## What Went Right

1. **Lathe helper function** — The `create_lathe_piece(name, profile_points, segments)` pattern worked great for all rotationally symmetric pieces. Defining pieces as `(radius, height)` profile arrays is intuitive and easy to tune.

2. **No materials in export** — Using `export_materials='NONE'` eliminated the root cause of all previous rendering issues. The runtime material replacement in `pieces.ts` works perfectly on clean geometry.

3. **File size** — New GLB is ~220KB vs 864KB original (75% smaller).

4. **All geometry in single bmesh** — After learning the hard way (Queen/King offset bug), building crown points, finials, and crosses directly in the same bmesh as the body avoids all join/origin issues.

5. **Iterative visual feedback** — Using `mcp__blender__get_viewport_screenshot` between pieces to verify shapes was essential.

6. **Knight rounded extrusion** — Using a semicircular Y cross-section (variable thickness) for the horse head profile made it rounded and smooth, matching the cylindrical collar of the lathe base.

## What Went Wrong

### 1. Coordinate System Confusion (biggest time sink)

**The mistake:** Built all pieces with Y as height axis (common in game dev) but Blender uses **Z-up**. The glTF exporter with `export_yup=True` converts Z-up to Y-up, so our Y-height became -Z in the exported file. Pieces appeared as flat discs (base facing camera) in Three.js.

**The fix attempts (3 rounds!):**
- First: Rotated all pieces -90deg X via `obj.rotation_euler` + `transform_apply` — but `transform_apply` silently failed to bake into some meshes.
- Second: Rotated 180deg on top — left residual `rotation_euler=(180,0,0)` on objects that the exporter applied, flipping pieces upside down.
- Third (correct): Directly rotated mesh vertices via `bmesh.ops.transform()` and verified with vertex coordinate inspection. Also discovered and cleared residual object-level rotations.

**Lesson:** Always build geometry with **Z as up** in Blender. Never trust `bpy.ops.object.transform_apply()` blindly — always verify the actual vertex coordinates after applying. Check for residual `obj.rotation_euler` before export.

### 2. Object Join Offset Bug

**The mistake:** Created Queen body at `location=(3,0,0)` and finial sphere at `location=(3,0,1.54)`, then joined them. Later, `transform_apply(location=True)` baked the location offset into mesh vertices, resulting in Queen width=3.53 and King width=5.06.

**The fix:** Rebuilt Queen and King with ALL geometry (body, crown points, finial, cross) in a single bmesh at origin. No separate objects, no joins needed.

**Lesson:** Never join objects that are at non-zero world positions. Either create everything at origin in one bmesh, or move objects to origin BEFORE joining.

### 3. Knight Head Evolution (4 iterations)

- **v1:** Spheres + cones for horse head — looked like a blob, not a horse.
- **v2:** Flat extruded 2D profile — recognizable but too tiny relative to base.
- **v3:** Bigger flat extruded profile — head was right size but didn't connect to cylindrical neck (flat slab on round tube).
- **v4 (final):** Rounded extrusion with semicircular Y cross-section matching collar diameter — smooth continuous transition.

**Lesson:** The knight is the hardest chess piece to model procedurally. A flat extrusion will never look right on a round base. The semicircular cross-section approach (varying thickness around a profile) bridges the gap between 2D profile definition and 3D roundness.

### 4. Normals Flipped After Vertex Rotation

**The mistake:** Rotating mesh vertices via bmesh flipped some face normals, causing non-uniform coloring (some faces lit from behind with `THREE.FrontSide` material).

**The fix:** `bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])` after any vertex manipulation, plus re-applying smooth shading.

**Lesson:** Always recalculate normals after any bmesh vertex transformation.

### 5. Rook v1 — Dome Instead of Tower

**The mistake:** First Rook had a rounded top profile with tiny boolean cuts — looked like a bishop, not a castle.

**The fix:** Rebuilt with straight-walled cylindrical top and 5 prominent merlons as bmesh box geometry directly on the rim.

**Lesson:** Boolean operations in Blender Python are fragile and produce subtle results. Direct bmesh geometry construction (manually placing merlon box vertices) is more reliable and produces cleaner results.

## Key Blender MCP Patterns

### Reliable lathe creation (Z-up)
```python
# Profile as (radius, z_height) pairs, Z is UP
profile = [(0.00, 0.00), (0.44, 0.00), ..., (0.00, 1.50)]
# Use 32 segments for smooth, or 10 for low-poly
```

### Adding detail geometry in same bmesh
```python
mesh, bm = make_lathe_zup("Name", profile, 32)
# Add crown points, cross, etc. directly in bm
# ...
bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
bm.to_mesh(mesh)
bm.free()
obj = bpy.data.objects.new("Name", mesh)
```

### Clean export checklist
```python
# Before export, verify for EACH piece:
# 1. obj.rotation_euler == (0,0,0)
# 2. obj.location == (0,0,0)
# 3. Height axis is Z (max Z extent > max X/Y extent)
# 4. Base at Z >= 0
# 5. Width is reasonable (< 1.5 for chess pieces)

bpy.ops.export_scene.gltf(
    filepath=path,
    export_format='GLB',
    export_apply=True,
    export_materials='NONE',  # critical for this project
    export_cameras=False,
    export_lights=False,
    export_yup=True,          # converts Z-up to Y-up for Three.js
)
```

## Compatibility with pieces.ts

The loading code requires:
- **Naming:** Top-level objects named with piece keywords ("Pawn", "Knight", "Bishop", "Rook", "Queen", "King") — matched via case-insensitive substring in `nameToKind()`.
- **No materials needed:** Runtime creates `MeshStandardMaterial` (ivory for white, charcoal for black).
- **Any proportions OK:** `normalizePrototypeMesh()` centers each piece, scales XZ footprint to 0.72, and applies per-kind Y height scaling (Q=1.0, K=0.97, R=0.88, B=0.88, N=0.8, P=0.7).
- **Single or multi-mesh:** Both supported via `traverse()`.

## Files

- `assets/Chess.glb` — New pieces (~220KB)
- `assets/Chess.glb.bak` — Original backup (864KB)
- `src/render/pieces.ts` — Loading code (unchanged)
