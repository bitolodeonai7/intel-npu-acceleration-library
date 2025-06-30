//
// Copyright © 2024 Intel Corporation
// SPDX-License-Identifier: Apache 2.0
//

#pragma once

#include "module.h"
#include <stddef.h>
#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

// Forward declarations
typedef struct BCVPUCore BCVPUCore;
typedef struct BCVPUSystemStats BCVPUSystemStats;

// System configuration
typedef struct {
    bool enable_npu_acceleration;
    bool enable_profiling;
    uint32_t max_concurrent_tasks;
    uint32_t memory_pool_size;
    char device_preference[32]; // "NPU", "CPU", "AUTO"
} BCVPUConfig;

// System statistics
struct BCVPUSystemStats {
    uint32_t total_tasks_processed;
    uint32_t successful_tasks;
    uint32_t failed_tasks;
    uint32_t npu_accelerated_tasks;
    double average_processing_time_ms;
    bool npu_available;
    uint32_t npu_driver_version;
};

// Core BCVPU system
struct BCVPUCore {
    BCVPUConfig config;
    BCVPUModule* modules[BCVPU_MODULE_COUNT];
    BCVPUSystemStats stats;
    bool is_initialized;
    bool is_running;
    
    // Task management
    BCVPUTask** task_queue;
    uint32_t queue_size;
    uint32_t queue_capacity;
    
    // NPU integration handle
    void* npu_context;
};

// Core system functions
BCVPUCore* bcvpu_create_core(void);
bool bcvpu_initialize_core(BCVPUCore* core, const BCVPUConfig* config);
bool bcvpu_start_system(BCVPUCore* core);
bool bcvpu_stop_system(BCVPUCore* core);
bool bcvpu_cleanup_core(BCVPUCore* core);
void bcvpu_destroy_core(BCVPUCore* core);

// Task management
bool bcvpu_submit_task(BCVPUCore* core, BCVPUTask* task);
bool bcvpu_process_next_task(BCVPUCore* core);
bool bcvpu_process_all_tasks(BCVPUCore* core);
uint32_t bcvpu_get_queue_size(const BCVPUCore* core);

// Module management
bool bcvpu_register_module(BCVPUCore* core, BCVPUModule* module);
BCVPUModule* bcvpu_get_module(BCVPUCore* core, BCVPUModuleType type);
bool bcvpu_initialize_all_modules(BCVPUCore* core);

// System information and diagnostics
void bcvpu_print_system_status(const BCVPUCore* core);
void bcvpu_print_statistics(const BCVPUCore* core);
bool bcvpu_check_npu_availability(BCVPUCore* core);
BCVPUSystemStats bcvpu_get_statistics(const BCVPUCore* core);

// Configuration helpers
BCVPUConfig bcvpu_get_default_config(void);
bool bcvpu_validate_config(const BCVPUConfig* config);

// Demonstration functions
void bcvpu_run_demo(BCVPUCore* core);
void bcvpu_run_performance_test(BCVPUCore* core, uint32_t num_tasks);

#ifdef __cplusplus
}
#endif