# Unity ECS Patterns - Detailed Reference & Worked Examples

This reference document provides concrete C# implementations and templates for Unity ECS (DOTS) patterns.

---

## 1. Defining Pure Component Data

Components in ECS must be lightweight structs implementing `IComponentData`. To compile with Burst and avoid Garbage Collection (GC) spikes, they must not contain managed types (like `GameObject`, `Transform`, `string`, or `List<T>`).

```csharp
using Unity.Entities;
using Unity.Mathematics;

// Pure data component (unmanaged, Burst-compatible)
public struct MoveSpeed : IComponentData
{
    public float Value;
}

public struct MovementDirection : IComponentData
{
    public float3 Value;
}
```

---

## 2. The Burst-Compiled ISystem Pattern

`ISystem` is preferred over `SystemBase` as it is a struct-based system that can be fully Burst compiled, leading to maximum execution speed.

```csharp
using Unity.Burst;
using Unity.Entities;
using Unity.Transforms;

[BurstCompile]
public partial struct ObjectMovementSystem : ISystem
{
    [BurstCompile]
    public void OnCreate(ref SystemState state)
    {
        // Require specific components before updating this system
        state.RequireForUpdate<MoveSpeed>();
    }

    [BurstCompile]
    public void OnDestroy(ref SystemState state)
    {
    }

    [BurstCompile]
    public void OnUpdate(ref SystemState state)
    {
        var deltaTime = SystemAPI.Time.DeltaTime;

        // Schedule parallel job
        var movementJob = new MovementJob
        {
            DeltaTime = deltaTime
        };

        state.Dependency = movementJob.ScheduleParallel(state.Dependency);
    }
}

// Parallel job processing elements with local transform, speed, and direction
[BurstCompile]
public partial struct MovementJob : IJobEntity
{
    public float DeltaTime;

    // RefRW (Read/Write) for TransformAspect or LocalTransform, RefRO (Read-Only) for speed/direction
    private void Execute(ref LocalTransform transform, in MoveSpeed speed, in MovementDirection direction)
    {
        transform.Position += direction.Value * speed.Value * DeltaTime;
    }
}
```

---

## 3. Entity Command Buffer (ECB) Pattern

Structural changes (like creating or destroying entities, adding or removing components) cannot be done inside parallel jobs because it would cause race conditions and invalidate memory. Instead, record these changes in an `EntityCommandBuffer` (ECB) and play them back on the main thread when the job completes.

```csharp
using Unity.Burst;
using Unity.Entities;

[BurstCompile]
public partial struct LifeSpanSystem : ISystem
{
    [BurstCompile]
    public void OnCreate(ref SystemState state)
    {
        state.RequireForUpdate<LifeTime>();
    }

    [BurstCompile]
    public void OnUpdate(ref SystemState state)
    {
        // Get the EntityCommandBuffer System to handle deferred execution
        var ecbSingleton = SystemAPI.GetSingleton<EndSimulationEntityCommandBufferSystem.Singleton>();
        var ecb = ecbSingleton.CreateCommandBuffer(state.WorldUnmanaged).AsParallelWriter();

        var deltaTime = SystemAPI.Time.DeltaTime;

        // Schedule Job
        var lifeTimeJob = new LifeTimeJob
        {
            DeltaTime = deltaTime,
            Ecb = ecb
        };

        state.Dependency = lifeTimeJob.ScheduleParallel(state.Dependency);
    }
}

public struct LifeTime : IComponentData
{
    public float Value;
}

[BurstCompile]
public partial struct LifeTimeJob : IJobEntity
{
    public float DeltaTime;
    public EntityCommandBuffer.ParallelWriter Ecb;

    // Use [EntityIndexInQuery] to write safely in parallel
    private void Execute(Entity entity, [EntityIndexInQuery] int sortKey, ref LifeTime lifeTime)
    {
        lifeTime.Value -= DeltaTime;

        if (lifeTime.Value <= 0f)
        {
            // Record entity destruction safely in a parallel thread
            Ecb.DestroyEntity(sortKey, entity);
        }
    }
}
```
