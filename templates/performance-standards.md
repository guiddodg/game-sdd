# UNITY PERFORMANCE STANDARDS v1.0
Target: Unity (C#) Development & Asset Pipeline

To guarantee a stable framerate (60 FPS / 16.67ms frame budget) and eliminate Garbage Collection (GC) spikes, all C# code generated for this project must strictly comply with these performance rules.

---

## 🚫 1. ZERO RUNTIME ALLOCATIONS (Avoiding GC Spikes)
Garbage Collection causes micro-stutters that ruin player immersion. Code in update loops, coroutines, or frequently called events must not allocate memory.

### 🔴 Do Not Allocate in Hot Loops
- **No String Concatenation:** Avoid joining strings with `+` in loops or UI updates. Use `System.Text.StringBuilder` or pass integer IDs instead.
- **No Closures:** Avoid passing anonymous methods/lambdas `() => { ... }` that capture variables, as they allocate memory. Use static methods or cache delegates.
- **No LINQ:** Never use LINQ queries (`.Where`, `.Select`, `.Any`) in hot loops. Use simple `for` or `foreach` loops over raw arrays or `List<T>`.
- **No Raw Coroutine Yields:** Do not use `yield return new WaitForSeconds(x)` in updates. Pre-allocate and cache the Yield Instruction, or use custom timer loops:
```csharp
  // ❌ BAD: Allocates memory on every iteration
  yield return new WaitForSeconds(1.0f);

  // class-level caching
  private readonly WaitForSeconds delay = new WaitForSeconds(1.0f);
  // ...
  yield return delay; //  GOOD: Cached
```

---

## ⚡ 2. CACHING & LOOKUP AVOIDANCE
Unity APIs that look up objects or components are extremely slow and must be cached.

### 🔴 Search Operations Rules
- **No Search in Update:** Never call `GameObject.Find`, `GameObject.FindWithTag`, `GetComponent`, or `GetComponentInChildren` inside `Update()`, `FixedUpdate()`, or loops. Fetch and store references during `Awake()` or `Start()`.
- **Cache `Camera.main`:** The `Camera.main` call executes a hidden `FindObjectWithTag` under the hood. Cache it in `Awake()`.
- **Avoid Raycast Allocations:** Use non-allocating physics APIs (e.g., `Physics.RaycastNonAlloc`, `Physics.OverlapSphereNonAlloc`) instead of their allocating counterparts.

---

## 🏗️ 3. OBJECT POOLING STANDARD
Any object that is spawned and destroyed frequently (e.g., projectiles, particles, floating text, damage indicators) must use an Object Pool instead of `Instantiate()` and `Destroy()`.

- **Implementation:** Use Unity's built-in `UnityEngine.Pool.ObjectPool<T>` (available in 2021+) or write a simple static/singleton class-based Object Pool.
- **Cleanup:** Polled objects must implement an interface (e.g., `IPoolable`) to cleanly reset their state, velocities, and timers before being returned to the pool.

---

## ⚙️ 4. CPU & UPDATE AVOIDANCE
- **Disable Unused Update Loops:** Empty Unity lifecycle methods (`Update()`, `LateUpdate()`, `FixedUpdate()`) still incur an overhead call from C++ to C#. Remove them if they contain no code.
- **Distance Culling:** Pause AI, animations, and non-critical logic for objects that are far away from the main camera.
- **Fixed Timestep:** Use `FixedUpdate()` ONLY for physics calculations. Do not run general timers or AI logic inside `FixedUpdate()`.

---

## 🛠️ Verification Checklist for Agent
- [ ] No `new` allocations inside `Update()` or frequently triggered events.
- [ ] All `GetComponent` calls are cached in `Awake()` or `Start()`.
- [ ] No LINQ queries are used in gameplay loops.
- [ ] No empty `Update()` methods are left in scripts.
- [ ] Frequently spawned prefabs implement an Object Pool system.
