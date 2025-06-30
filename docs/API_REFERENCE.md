# BCVPU API Reference

This document provides comprehensive API reference for both C/C++ and TypeScript implementations of the BCVPU architecture.

## Table of Contents

- [C/C++ API](#cc-api)
  - [Core System](#core-system)
  - [Module Interface](#module-interface)
  - [NPU Integration](#npu-integration)
- [TypeScript API](#typescript-api)
  - [Core Interfaces](#core-interfaces)
  - [Module Implementations](#module-implementations)
  - [NPU Accelerator](#npu-accelerator)

---

## C/C++ API

### Core System

#### BCVPUCore

```cpp
typedef struct BCVPUCore BCVPUCore;

// Core management functions
BCVPUCore* bcvpu_create_core(void);
bool bcvpu_initialize_core(BCVPUCore* core, const BCVPUConfig* config);
bool bcvpu_start_system(BCVPUCore* core);
bool bcvpu_stop_system(BCVPUCore* core);
bool bcvpu_cleanup_core(BCVPUCore* core);
void bcvpu_destroy_core(BCVPUCore* core);
```

##### bcvpu_create_core()
Creates a new BCVPU core instance.

**Returns:** Pointer to BCVPUCore or NULL on failure

**Example:**
```cpp
BCVPUCore* core = bcvpu_create_core();
if (!core) {
    fprintf(stderr, "Failed to create BCVPU core\n");
    return 1;
}
```

##### bcvpu_initialize_core()
Initializes the BCVPU system with the provided configuration.

**Parameters:**
- `core`: BCVPU core instance
- `config`: System configuration

**Returns:** true on success, false on failure

**Example:**
```cpp
BCVPUConfig config = bcvpu_get_default_config();
config.enable_npu_acceleration = true;
config.max_concurrent_tasks = 20;

if (!bcvpu_initialize_core(core, &config)) {
    fprintf(stderr, "Failed to initialize BCVPU core\n");
}
```

#### Task Management

```cpp
// Task management functions
bool bcvpu_submit_task(BCVPUCore* core, BCVPUTask* task);
bool bcvpu_process_next_task(BCVPUCore* core);
bool bcvpu_process_all_tasks(BCVPUCore* core);
uint32_t bcvpu_get_queue_size(const BCVPUCore* core);
```

##### bcvpu_submit_task()
Submits a task to the processing queue.

**Parameters:**
- `core`: BCVPU core instance
- `task`: Task to submit

**Returns:** true if task was successfully queued

**Example:**
```cpp
BCVPUTask* task = create_task(1, BCVPU_MODULE_MEMORY, 
                             "Store data", data, data_size);
if (bcvpu_submit_task(core, task)) {
    printf("Task submitted successfully\n");
}
```

#### Configuration

```cpp
typedef struct {
    bool enable_npu_acceleration;
    bool enable_profiling;
    uint32_t max_concurrent_tasks;
    uint32_t memory_pool_size;
    char device_preference[32];
} BCVPUConfig;

BCVPUConfig bcvpu_get_default_config(void);
bool bcvpu_validate_config(const BCVPUConfig* config);
```

### Module Interface

#### BCVPUModule

```cpp
typedef struct BCVPUModule {
    BCVPUModuleType type;
    char name[64];
    bool is_initialized;
    bool npu_enabled;
    
    bool (*initialize)(BCVPUModule* module);
    bool (*process_task)(BCVPUModule* module, BCVPUTask* task);
    bool (*cleanup)(BCVPUModule* module);
    void (*print_status)(const BCVPUModule* module);
} BCVPUModule;
```

#### Task Structure

```cpp
typedef struct BCVPUTask {
    uint32_t id;
    BCVPUModuleType target_module;
    char description[256];
    void* data;
    size_t data_size;
    BCVPUTaskStatus status;
    bool use_npu_acceleration;
} BCVPUTask;
```

#### Module Types

```cpp
typedef enum {
    BCVPU_MODULE_MEMORY,
    BCVPU_MODULE_DECISION_MAKING,
    BCVPU_MODULE_SENSORY_PROCESSING,
    BCVPU_MODULE_COUNT
} BCVPUModuleType;
```

#### Task Status

```cpp
typedef enum {
    BCVPU_TASK_PENDING,
    BCVPU_TASK_PROCESSING,
    BCVPU_TASK_COMPLETED,
    BCVPU_TASK_FAILED
} BCVPUTaskStatus;
```

#### Module Factory Functions

```cpp
// Memory Module
BCVPUModule* create_memory_module(void);
bool memory_module_initialize(BCVPUModule* module);
bool memory_module_process_task(BCVPUModule* module, BCVPUTask* task);
bool memory_module_cleanup(BCVPUModule* module);

// Decision Making Module
BCVPUModule* create_decision_making_module(void);
bool decision_making_module_initialize(BCVPUModule* module);
bool decision_making_module_process_task(BCVPUModule* module, BCVPUTask* task);
bool decision_making_module_cleanup(BCVPUModule* module);

// Sensory Processing Module
BCVPUModule* create_sensory_processing_module(void);
bool sensory_processing_module_initialize(BCVPUModule* module);
bool sensory_processing_module_process_task(BCVPUModule* module, BCVPUTask* task);
bool sensory_processing_module_cleanup(BCVPUModule* module);
```

### NPU Integration

#### NPUContext

```cpp
typedef struct NPUContext NPUContext;

NPUContext* npu_create_context(void);
bool npu_initialize_context(NPUContext* context, const char* device_preference);
bool npu_is_available(NPUContext* context);
uint32_t npu_get_driver_version(NPUContext* context);
void npu_cleanup_context(NPUContext* context);
void npu_destroy_context(NPUContext* context);
```

#### NPU Tensor Operations

```cpp
typedef struct NPUTensor NPUTensor;

NPUTensor* npu_create_tensor(const size_t* shape, uint32_t num_dims, NPUDataType dtype);
bool npu_set_tensor_data(NPUTensor* tensor, const void* data, size_t data_size);
bool npu_get_tensor_data(const NPUTensor* tensor, void* data, size_t data_size);
void npu_destroy_tensor(NPUTensor* tensor);
```

#### NPU Operations

```cpp
// Matrix operations
bool npu_matrix_multiply(NPUContext* context, const NPUTensor* input, 
                        const NPUTensor* weights, NPUTensor* output);
bool npu_elementwise_add(NPUContext* context, const NPUTensor* a, 
                        const NPUTensor* b, NPUTensor* output);
bool npu_activation_relu(NPUContext* context, const NPUTensor* input, 
                        NPUTensor* output);

// BCVPU-specific operations
bool npu_accelerate_memory_operation(NPUContext* context, const void* data, 
                                     size_t data_size, const char* operation);
bool npu_accelerate_decision_making(NPUContext* context, const float* features, 
                                   size_t num_features, float* decision_scores);
bool npu_accelerate_sensory_processing(NPUContext* context, const void* sensor_data, 
                                      size_t data_size, void* processed_output);
```

---

## TypeScript API

### Core Interfaces

#### IBCVPUCore

```typescript
interface IBCVPUCore {
    readonly config: BCVPUConfig;
    readonly isInitialized: boolean;
    readonly isRunning: boolean;
    readonly stats: SystemStats;
    readonly queueInfo: TaskQueueInfo;

    initialize(config: BCVPUConfig): Promise<boolean>;
    start(): Promise<boolean>;
    stop(): Promise<boolean>;
    cleanup(): Promise<boolean>;
    
    registerModule(module: IModule): Promise<boolean>;
    getModule(type: ModuleType): IModule | null;
    
    submitTask(task: Task): Promise<boolean>;
    processNextTask(): Promise<boolean>;
    processAllTasks(): Promise<boolean>;
    
    getStatistics(): SystemStats;
    checkNPUAvailability(): Promise<boolean>;
    runDiagnostics(): Promise<DiagnosticsResult>;
}
```

#### IModule

```typescript
interface IModule {
    readonly type: ModuleType;
    readonly name: string;
    readonly isInitialized: boolean;
    readonly npuEnabled: boolean;
    readonly capabilities: ModuleCapabilities;
    readonly stats: ModuleStats;

    initialize(config?: Record<string, any>): Promise<boolean>;
    processTask(task: Task): Promise<boolean>;
    cleanup(): Promise<boolean>;
    getStatus(): ModuleStatus;
    
    on(event: string, listener: (...args: any[]) => void): void;
    off(event: string, listener: (...args: any[]) => void): void;
}
```

#### Configuration Types

```typescript
interface BCVPUConfig {
    enableNPUAcceleration: boolean;
    enableProfiling: boolean;
    maxConcurrentTasks: number;
    memoryPoolSize: number;
    devicePreference: 'NPU' | 'CPU' | 'AUTO';
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    performanceMode: 'throughput' | 'latency' | 'balanced';
}
```

#### Task Interface

```typescript
interface Task {
    id: string;
    targetModule: ModuleType;
    description: string;
    data?: any;
    status: TaskStatus;
    useNPUAcceleration: boolean;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    processingTimeMs?: number;
    metadata?: Record<string, any>;
}
```

### Module Implementations

#### MemoryModule

```typescript
class MemoryModule extends EventEmitter implements IModule {
    public readonly type = ModuleType.MEMORY;
    public readonly name = 'Memory Module';
    
    async initialize(config?: Record<string, any>): Promise<boolean>;
    async processTask(task: Task): Promise<boolean>;
    async cleanup(): Promise<boolean>;
    getStatus(): ModuleStatus;
}
```

#### DecisionMakingModule

```typescript
class DecisionMakingModule extends EventEmitter implements IModule {
    public readonly type = ModuleType.DECISION_MAKING;
    public readonly name = 'Decision-Making Module';
    
    async initialize(config?: Record<string, any>): Promise<boolean>;
    async processTask(task: Task): Promise<boolean>;
    async cleanup(): Promise<boolean>;
    getStatus(): ModuleStatus;
}
```

#### SensoryProcessingModule

```typescript
class SensoryProcessingModule extends EventEmitter implements IModule {
    public readonly type = ModuleType.SENSORY_PROCESSING;
    public readonly name = 'Sensory Processing Module';
    
    async initialize(config?: Record<string, any>): Promise<boolean>;
    async processTask(task: Task): Promise<boolean>;
    async cleanup(): Promise<boolean>;
    getStatus(): ModuleStatus;
}
```

### NPU Accelerator

#### INPUAccelerator

```typescript
interface INPUAccelerator {
    readonly isAvailable: boolean;
    readonly isInitialized: boolean;
    readonly device: string;
    readonly driverVersion?: string;
    readonly performanceStats: NPUPerformanceStats;

    initialize(devicePreference?: string): Promise<boolean>;
    checkAvailability(): Promise<boolean>;
    getDriverVersion(): Promise<string | null>;
    
    createTensor(shape: number[], dtype: NPUDataType): NPUTensor;
    setTensorData(tensor: NPUTensor, data: ArrayBuffer | TypedArray): boolean;
    getTensorData(tensor: NPUTensor): ArrayBuffer;
    
    matrixMultiply(input: NPUTensor, weights: NPUTensor): Promise<NPUTensor>;
    elementwiseAdd(a: NPUTensor, b: NPUTensor): Promise<NPUTensor>;
    activationRelu(input: NPUTensor): Promise<NPUTensor>;
    
    accelerateMemoryOperation(data: ArrayBuffer, operation: string): Promise<boolean>;
    accelerateDecisionMaking(features: Float32Array): Promise<Float32Array>;
    accelerateSensoryProcessing(sensorData: ArrayBuffer): Promise<ArrayBuffer>;
    
    cleanup(): Promise<boolean>;
}
```

#### NPU Data Types

```typescript
enum NPUDataType {
    FLOAT16 = 'float16',
    FLOAT32 = 'float32',
    INT8 = 'int8',
    INT4 = 'int4',
    INT32 = 'int32'
}
```

#### NPU Tensor

```typescript
interface NPUTensor {
    info: NPUTensorInfo;
    data: ArrayBuffer | Float32Array | Int32Array | Int8Array | Uint8Array;
}

interface NPUTensorInfo {
    shape: number[];
    dtype: NPUDataType;
    totalSize: number;
}
```

## Usage Examples

### C++ Example

```cpp
#include "bcvpu_core.h"

int main() {
    // Create and initialize core
    BCVPUCore* core = bcvpu_create_core();
    BCVPUConfig config = bcvpu_get_default_config();
    
    bcvpu_initialize_core(core, &config);
    bcvpu_start_system(core);
    
    // Create and submit task
    BCVPUTask* task = create_task(1, BCVPU_MODULE_MEMORY, 
                                 "Store data", NULL, 0);
    bcvpu_submit_task(core, task);
    
    // Process tasks
    bcvpu_process_all_tasks(core);
    
    // Cleanup
    bcvpu_stop_system(core);
    bcvpu_cleanup_core(core);
    bcvpu_destroy_core(core);
    
    return 0;
}
```

### TypeScript Example

```typescript
import { BCVPUCore } from './core/BCVPUCore';
import { ModuleType, TaskStatus } from './interfaces/IModule';

async function main() {
    const core = new BCVPUCore();
    
    // Initialize system
    const config = {
        enableNPUAcceleration: true,
        maxConcurrentTasks: 20,
        devicePreference: 'NPU' as const,
        // ... other config options
    };
    
    await core.initialize(config);
    await core.start();
    
    // Create and submit task
    const task = {
        id: 'task-001',
        targetModule: ModuleType.MEMORY,
        description: 'Store data',
        status: TaskStatus.PENDING,
        useNPUAcceleration: true,
        createdAt: new Date()
    };
    
    await core.submitTask(task);
    await core.processAllTasks();
    
    // Get statistics
    const stats = core.getStatistics();
    console.log('Tasks processed:', stats.totalTasksProcessed);
    
    // Cleanup
    await core.stop();
    await core.cleanup();
}
```

## Error Codes

### C++ Error Codes

| Code | Description |
|------|-------------|
| `BCVPU_SUCCESS` | Operation completed successfully |
| `BCVPU_ERROR_INVALID_PARAM` | Invalid parameter provided |
| `BCVPU_ERROR_NOT_INITIALIZED` | System not initialized |
| `BCVPU_ERROR_NPU_UNAVAILABLE` | NPU hardware not available |
| `BCVPU_ERROR_QUEUE_FULL` | Task queue is full |
| `BCVPU_ERROR_MODULE_FAILED` | Module operation failed |

### TypeScript Error Types

```typescript
class BCVPUError extends Error {
    constructor(message: string, public code: string) {
        super(message);
        this.name = 'BCVPUError';
    }
}

// Error codes
const ErrorCodes = {
    INVALID_CONFIG: 'INVALID_CONFIG',
    NOT_INITIALIZED: 'NOT_INITIALIZED',
    NPU_UNAVAILABLE: 'NPU_UNAVAILABLE',
    QUEUE_FULL: 'QUEUE_FULL',
    MODULE_FAILED: 'MODULE_FAILED'
} as const;
```

## Performance Guidelines

### Best Practices

1. **Initialization**: Initialize the system once and reuse
2. **Task Batching**: Submit multiple tasks at once when possible
3. **Memory Management**: Reuse task objects to reduce allocation
4. **NPU Optimization**: Use appropriate data types for NPU operations
5. **Error Handling**: Always check return values and handle errors

### Performance Monitoring

```cpp
// C++ Performance Monitoring
BCVPUSystemStats stats = bcvpu_get_statistics(core);
printf("Success rate: %.1f%%\n", 
       (float)stats.successful_tasks / stats.total_tasks_processed * 100);
```

```typescript
// TypeScript Performance Monitoring
const stats = core.getStatistics();
console.log(`NPU Utilization: ${stats.npuAcceleratedTasks / stats.totalTasksProcessed * 100}%`);
```