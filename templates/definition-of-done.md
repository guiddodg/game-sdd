# AGENT DEFINITION OF DONE (DoD) v1.0
# Target: C# Production Code Verification for Unity

Before delivering any codebase changes, refactors, or new scripts, you must verify compliance with this strict quality checklist. Do not mark a task as completed if it violates any of these rules.

---

## 🚫 1. NO PLACEHOLDERS & COMPLETENESS
- **Zero Mocking:** Leaving `// TODO: Implement later`, `// Insert logic here`, or `throw new NotImplementedException()` is strictly forbidden. 
- All methods must be fully implemented with production-ready logic before delivery.

## 🔒 2. ENCAPSULATION & NAMING CONVENTIONS
- **Fields:** All inspector-exposed fields must be private with the `[SerializeField]` attribute. Never use public variables for fields.
- **Properties:** External access must be restricted using properties with private setters: `public T PropertyName { get; get; private set; }`.
- **Casing:** 
  - Private fields must use camelCase (e.g., `private float growthTime;`).
  - Public properties and methods must use PascalCase (e.g., `public float GrowthTime { get; }`).

## 🛡️ 3. DEFENSIVE PROGRAMMING & RUNTIME SAFETY
- **Null Checking:** You must implement defensive guards in the `Awake()` or `Start()` methods to validate all critical references (such as `ElementData`).
- **Fail Fast:** If a reference is missing, throw an explicit exception or log a `Debug.LogError` with the exact context:
```csharp
  if (data == null) {
      Debug.LogError($"[{GetType().Name}] ElementData is missing on GameObject '{gameObject.name}'.", this);
      enabled = false;
      return;
  }
```
## ⚡ 4. PERFORMANCE & MEMORY INVARIANTS
Update Avoidance: The Update() loop must be kept empty unless strictly necessary for a continuous frame-by-frame operation (like a smooth slider UI update). Timers must use standalone coroutines or basic delta-time ticks inside controlled states.

No Garbage Collection (GC) Spikes: Avoid allocations inside frequently called methods. Do not use string concatenation inside loops (use StringBuilder or pass IDs) and avoid FindObjectsOfType or GetComponent inside runtime execution loops.

## 📝 5. COMPILATION & WARNINGS CLEANUP
Every code block must compile cleanly without warnings regarding unassigned variables or obsolete Unity API methods.

If an old API method must be used, you must explicitly document why.