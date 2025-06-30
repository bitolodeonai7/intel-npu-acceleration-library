//
// Copyright © 2024 Intel Corporation
// SPDX-License-Identifier: Apache 2.0
//

#pragma once

#include <stddef.h>
#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

// Forward declarations
typedef struct BCVPUModule BCVPUModule;
typedef struct BCVPUTask BCVPUTask;

// Module types
typedef enum {
    BCVPU_MODULE_MEMORY,
    BCVPU_MODULE_DECISION_MAKING,
    BCVPU_MODULE_SENSORY_PROCESSING,
    BCVPU_MODULE_COUNT
} BCVPUModuleType;

// Task status
typedef enum {
    BCVPU_TASK_PENDING,
    BCVPU_TASK_PROCESSING,
    BCVPU_TASK_COMPLETED,
    BCVPU_TASK_FAILED
} BCVPUTaskStatus;

// Task structure
struct BCVPUTask {
    uint32_t id;
    BCVPUModuleType target_module;
    char description[256];
    void* data;
    size_t data_size;
    BCVPUTaskStatus status;
    bool use_npu_acceleration;
};

// Module interface
struct BCVPUModule {
    BCVPUModuleType type;
    char name[64];
    bool is_initialized;
    bool npu_enabled;
    
    // Function pointers for module operations
    bool (*initialize)(BCVPUModule* module);
    bool (*process_task)(BCVPUModule* module, BCVPUTask* task);
    bool (*cleanup)(BCVPUModule* module);
    void (*print_status)(const BCVPUModule* module);
};

// Memory Module Functions
BCVPUModule* create_memory_module(void);
bool memory_module_initialize(BCVPUModule* module);
bool memory_module_process_task(BCVPUModule* module, BCVPUTask* task);
bool memory_module_cleanup(BCVPUModule* module);
void memory_module_print_status(const BCVPUModule* module);

// Decision Making Module Functions
BCVPUModule* create_decision_making_module(void);
bool decision_making_module_initialize(BCVPUModule* module);
bool decision_making_module_process_task(BCVPUModule* module, BCVPUTask* task);
bool decision_making_module_cleanup(BCVPUModule* module);
void decision_making_module_print_status(const BCVPUModule* module);

// Sensory Processing Module Functions
BCVPUModule* create_sensory_processing_module(void);
bool sensory_processing_module_initialize(BCVPUModule* module);
bool sensory_processing_module_process_task(BCVPUModule* module, BCVPUTask* task);
bool sensory_processing_module_cleanup(BCVPUModule* module);
void sensory_processing_module_print_status(const BCVPUModule* module);

// Utility functions
BCVPUTask* create_task(uint32_t id, BCVPUModuleType target, const char* description, void* data, size_t data_size);
void destroy_task(BCVPUTask* task);
const char* module_type_to_string(BCVPUModuleType type);
const char* task_status_to_string(BCVPUTaskStatus status);

#ifdef __cplusplus
}
#endif