# DECOUPLED UI ARCHITECTURE (MVP PATTERN)
Target: Unity (C#) & UI Canvas / UI Toolkit

To keep codebase systems independent, scalable, and easy to maintain, all User Interfaces (UI) must strictly follow the **Model-View-Presenter (MVP)** design pattern. Direct connections between UI components and gameplay states are forbidden.

---

## 📐 The MVP Architecture for Unity

```text
  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  ▼                                                         │
[ MODEL ] ◄────────────── [ PRESENTER ] ──────────────► [ VIEW ]
(Pure Data/State)      (Mediator / Controller)      (UI Canvas/Elements)
  │                                                         ▲
  └─────────────────────────────────────────────────────────┘
```

### 1. 📄 THE MODEL (The State)
- **Role:** Holds raw data, values, and inventory/economy states (e.g., Level, Experience, CoinCount).
- **Rules:**
  - Has **zero knowledge** of UI components, canvases, or presentations.
  - Exposes properties and fires standard C# events when values change (e.g., `public event Action<int> OnCoinsChanged;`).

### 2. 🎨 THE VIEW (The Visual Elements)
- **Role:** Handles canvas elements, layout groups, animations, and gathers user input events (clicks, input fields).
- **Rules:**
  - Contains references to Unity UI components (`TextMeshProUGUI`, `Button`, `Slider`, `Image`).
  - **No Gameplay/Logic Calculations:** Never calculate price reductions, inventory limits, or math inside the View.
  - Exposes interactions via events (e.g., `public event Action OnUpgradeClicked;`) or registers button listeners.

### 3. ⚙️ THE PRESENTER (The Mediator)
- **Role:** Acts as the middleman that glues the Model and the View together.
- **Rules:**
  - Subscribes to events on the **Model** and updates the **View** when changes occur.
  - Subscribes to input events on the **View** and updates/mutates the **Model** in response.
  - Handles the lifecycles of both elements.

---

## 💻 Concrete Code Template

### 1. The Model
```csharp
using System;

public class EconomyModel
{
    private int coins = 100;
    
    public event Action<int> OnCoinsChanged;
    public int Coins => coins;

    public void AddCoins(int amount)
    {
        if (amount < 0) return;
        coins += amount;
        OnCoinsChanged?.Invoke(coins);
    }

    public bool SpendCoins(int amount)
    {
        if (amount <= 0 || coins < amount) return false;
        coins -= amount;
        OnCoinsChanged?.Invoke(coins);
        return true;
    }
}
```

### 2. The View
```csharp
using System;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

public class EconomyView : MonoBehaviour
{
    [SerializeField] private TextMeshProUGUI coinsText;
    [SerializeField] private Button addCoinsButton;
    
    public event Action OnAddCoinsRequest;

    private void Awake()
    {
        // Bind UI input event and forward it
        addCoinsButton.onClick.AddListener(() => OnAddCoinsRequest?.Invoke());
    }

    public void UpdateCoinsDisplay(int coinCount)
    {
        // Safe UI formatting without runtime string allocations if cached
        coinsText.text = coinCount.ToString();
    }
}
```

### 3. The Presenter
```csharp
using UnityEngine;

public class EconomyPresenter : MonoBehaviour
{
    [SerializeField] private EconomyView view;
    
    private EconomyModel model;

    private void Start()
    {
        // In a real project, this might be injected or retrieved from a Service Locator
        model = new EconomyModel();

        // 1. Initial view setup
        view.UpdateCoinsDisplay(model.Coins);

        // 2. Bind Model changes -> Update View
        model.OnCoinsChanged += HandleCoinsChanged;

        // 3. Bind View Inputs -> Mutate Model
        view.OnAddCoinsRequest += HandleAddCoinsRequest;
    }

    private void OnDestroy()
    {
        if (model != null)
        {
            model.OnCoinsChanged -= HandleCoinsChanged;
        }

        if (view != null)
        {
            view.OnAddCoinsRequest -= HandleAddCoinsRequest;
        }
    }

    private void HandleCoinsChanged(int currentCoins)
    {
        view.UpdateCoinsDisplay(currentCoins);
    }

    private void HandleAddCoinsRequest()
    {
        // Mutate model
        model.AddCoins(10);
    }
}
```

---

## ⚡ Canvas Optimization Guidelines
To avoid rendering bottlenecks and canvas rebuilds:
- **Canvas Splitting:** Divide UI into multiple Canvases. Never put dynamic UI (frequently changing elements like health bars, floating text) on the same Canvas as static UI (menus, backgrounds).
- **Disable Raycasts:** Turn off `Raycast Target` on all text elements and images that do not receive clicks.
- **Deactivate GameObjects:** To hide a UI window, deactivate the GameObject. Do not set alpha to `0` or scale to `0` as Unity still processes canvas batches for hidden items.
