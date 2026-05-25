# UNITY HIERARCHY STANDARD (PREFABS & BLENDER PIPELINE)

To guarantee modularity and allow visual asset replacement (e.g., Blender FBX exports) without breaking C# scripts, all interactive GameObjects must strictly follow this exact hierarchy structure:

```text
▼ 📦 [ElementName]__Root                    -> Component: [ElementName]State (FSM Logic)
    ├── ⚙️ [ElementName]__Interaction         -> Component: Collider / Trigger (Layer: Interaction)
    └── ▼ 🎨 [ElementName]__Visuals         -> Component: [ElementName]View (Listens to State)
          ├── 🛑 Node__State_0              -> Static Mesh (Initial State / e.g., Empty)
          ├── ⏳ Node__State_1              -> Static Mesh (In-Progress State / e.g., Growing)
          └── ✅ Node__State_2              -> Static Mesh (Completed State / e.g., Ready)
```

## RULES FOR THE AGENT:
The script in the Root (ElementState) NEVER knows the GameObjects or MeshRenderers under 🎨 Visuals. It only communicates with the ElementView component on the root of that layer.

Ensure the interaction layer uses specialized Colliders independent of the visual meshes to guarantee clean input detection.
