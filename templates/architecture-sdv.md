# STATE-DATA-VIEW (SDV) ARCHITECTURAL PATTERN
Target: Unity (C#) Development

To prevent spaghetti code, decouple UI/Visual feedback from core gameplay rules, and ensure maximum testability, all interactive elements must strictly implement the State-Data-View (SDV) pattern.

---

## 📐 The Three Pillars

### 1. ⚙️ STATE (The Brain)
- **Role:** Controls game logic, finite state machines (FSM), timers, and rules of interaction.
- **Rules:**
  - Must be a MonoBehaviour attached to the `__Root` of the GameObject.
  - **Zero Visual References:** Never reference `Renderer`, `Animator`, `ParticleSystem`, `AudioSource`, or `TextMeshPro`.
  - **State Changes:** Updates internal states and triggers public C# events (e.g., `public event Action<CropState> OnStateChanged;`).
  - **Inputs:** Receives interaction calls from the interaction layer (e.g., `public void ApplyTool(ToolType tool)`).
  - **References:** Knows the **Data** (ScriptableObject configuration) and can reference the **View** ONLY to register events or initialize it.

### 2. 📄 DATA (The Configuration)
- **Role:** Holds static, immutable parameters.
- **Rules:**
  - Must inherit from `ScriptableObject` (or be unmanaged structs for ECS).
  - Contains constants (e.g., `GrowthDuration`, `HarvestYield`, `XpReward`, `PurchasePrice`).
  - Does not contain runtime mutable values or state tracking.

### 3. 🎨 VIEW (The Body / Feedback)
- **Role:** Listens to the State and updates visual, auditory, and physical feedback.
- **Rules:**
  - Must be a MonoBehaviour attached to the `__Visuals` child of the GameObject.
  - Has references to `MeshRenderer`, `MeshFilter`, `Animator`, `ParticleSystem`, `AudioSource`, etc.
  - **No Gameplay Logic:** Does not calculate timers, inventory changes, or XP.
  - **Lifecycle:** Subscribes to the **State**'s events on `Awake`/`Start` and unsubscribes on `OnDestroy`.
  - **Visual Swap:** Swaps active visual models or triggers animations when state transitions occur.

---

## 💻 Code Example: Farming Plot (Crops)

### 1. Data Definition
```csharp
using UnityEngine;

[CreateAssetMenu(fileName = "CropData", menuName = "Farming/CropData")]
public class CropData : ScriptableObject
{
    [SerializeField] private string cropName;
    [SerializeField] private float growthTime = 10f;
    [SerializeField] private int xpReward = 5;
    [SerializeField] private Sprite cropIcon;

    public string CropName => cropName;
    public float GrowthTime => growthTime;
    public int XpReward => xpReward;
    public Sprite CropIcon => cropIcon;
}
```

### 2. State Controller
```csharp
using System;
using UnityEngine;

public enum PlotState
{
    Empty,
    Growing,
    Ready
}

public class PlotStateController : MonoBehaviour
{
    [SerializeField] private CropData activeCropData;
    
    private PlotState currentState = PlotState.Empty;
    private float growthTimer = 0f;

    public event Action<PlotState> OnStateChanged;
    public event Action<float> OnGrowthProgressChanged; // 0.0f to 1.0f

    public PlotState CurrentState => currentState;
    public CropData ActiveCropData => activeCropData;

    private void Update()
    {
        if (currentState == PlotState.Growing && activeCropData != null)
        {
            growthTimer += Time.deltaTime;
            float progress = Mathf.Clamp01(growthTimer / activeCropData.GrowthTime);
            OnGrowthProgressChanged?.Invoke(progress);

            if (growthTimer >= activeCropData.GrowthTime)
            {
                TransitionTo(PlotState.Ready);
            }
        }
    }

    public void Plant(CropData data)
    {
        if (currentState != PlotState.Empty) return;

        activeCropData = data;
        growthTimer = 0f;
        TransitionTo(PlotState.Growing);
    }

    public void Harvest()
    {
        if (currentState != PlotState.Ready) return;

        activeCropData = null;
        TransitionTo(PlotState.Empty);
    }

    private void TransitionTo(PlotState newState)
    {
        currentState = newState;
        OnStateChanged?.Invoke(currentState);
    }
}
```

### 3. View Observer
```csharp
using UnityEngine;

public class PlotView : MonoBehaviour
{
    [Header("Dependencies")]
    [SerializeField] private PlotStateController stateController;

    [Header("Visual Nodes")]
    [SerializeField] private GameObject emptyVisual;
    [SerializeField] private GameObject growingVisual;
    [SerializeField] private GameObject readyVisual;

    [Header("Effects")]
    [SerializeField] private ParticleSystem plantParticles;
    [SerializeField] private ParticleSystem harvestParticles;
    [SerializeField] private AudioSource audioSource;

    private void Awake()
    {
        if (stateController == null)
        {
            stateController = GetComponentInParent<PlotStateController>();
        }
    }

    private void OnEnable()
    {
        if (stateController != null)
        {
            stateController.OnStateChanged += HandleStateChanged;
            stateController.OnGrowthProgressChanged += HandleGrowthProgress;
        }
    }

    private void OnDisable()
    {
        if (stateController != null)
        {
            stateController.OnStateChanged -= HandleStateChanged;
            stateController.OnGrowthProgressChanged -= HandleGrowthProgress;
        }
    }

    private void Start()
    {
        // Initial setup
        if (stateController != null)
        {
            HandleStateChanged(stateController.CurrentState);
        }
    }

    private void HandleStateChanged(PlotState state)
    {
        // Toggle gameobjects for each state
        emptyVisual.SetActive(state == PlotState.Empty);
        growingVisual.SetActive(state == Growing);
        readyVisual.SetActive(state == PlotState.Ready);

        // Play feedback
        switch (state)
        {
            case PlotState.Growing:
                if (plantParticles != null) plantParticles.Play();
                break;
            case PlotState.Empty:
                if (harvestParticles != null) harvestParticles.Play();
                break;
        }
    }

    private void HandleGrowthProgress(float progress)
    {
        // Example: Scale growing model based on progress
        if (growingVisual != null && stateController.CurrentState == PlotState.Growing)
        {
            growingVisual.transform.localScale = Vector3.one * Mathf.Lerp(0.2f, 1.0f, progress);
        }
    }
}
```
