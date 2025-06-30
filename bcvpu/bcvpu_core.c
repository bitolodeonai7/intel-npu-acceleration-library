//
// Copyright © 2024 Intel Corporation
// SPDX-License-Identifier: Apache 2.0
//

#include "bcvpu_core.h"
#include "npu_integration.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Core status strings
const char* bcvpu_core_status_string(bcvpu_core_status_t status) {
    switch (status) {
        case BCVPU_CORE_STATUS_UNINITIALIZED: return "Uninitialized";
        case BCVPU_CORE_STATUS_INITIALIZING: return "Initializing";
        case BCVPU_CORE_STATUS_READY: return "Ready";
        case BCVPU_CORE_STATUS_PROCESSING: return "Processing";
        case BCVPU_CORE_STATUS_ERROR: return "Error";
        default: return "Unknown";
    }
}

void bcvpu_core_create_default_config(bcvpu_core_config_t* config) {
    if (!config) return;
    
    config->enable_npu = 1;
    config->enable_profiling = 0;
    config->max_concurrent_tasks = 4;
    strncpy(config->cache_dir, "cache", sizeof(config->cache_dir) - 1);
    config->cache_dir[sizeof(config->cache_dir) - 1] = '\0';
}

bcvpu_core_status_t bcvpu_core_init(bcvpu_core_t* core) {
    if (!core) return BCVPU_CORE_STATUS_ERROR;
    
    bcvpu_core_config_t default_config;
    bcvpu_core_create_default_config(&default_config);
    
    return bcvpu_core_init_with_config(core, &default_config);
}

bcvpu_core_status_t bcvpu_core_init_with_config(bcvpu_core_t* core, const bcvpu_core_config_t* config) {
    if (!core || !config) return BCVPU_CORE_STATUS_ERROR;
    
    core->status = BCVPU_CORE_STATUS_INITIALIZING;
    core->config = *config;
    core->module_count = 0;
    core->task_counter = 0;
    core->npu_context = NULL;
    
    // Initialize all module slots
    for (int i = 0; i < BCVPU_MAX_MODULES; i++) {
        memset(&core->modules[i], 0, sizeof(bcvpu_module_t));
    }
    
    printf("[BCVPU Core] Initializing Brain Computing Virtual Processing Unit...\n");
    
    if (config->enable_npu) {
        if (bcvpu_npu_is_available()) {
            printf("[BCVPU Core] Intel NPU detected and available\n");
        } else {
            printf("[BCVPU Core] Intel NPU not available, falling back to CPU\n");
        }
    }
    
    core->status = BCVPU_CORE_STATUS_READY;
    printf("[BCVPU Core] Initialization complete\n");
    
    return BCVPU_CORE_STATUS_READY;
}

bcvpu_core_status_t bcvpu_core_register_module(bcvpu_core_t* core, bcvpu_module_t* module) {
    if (!core || !module) return BCVPU_CORE_STATUS_ERROR;
    
    if (core->module_count >= BCVPU_MAX_MODULES) {
        printf("[BCVPU Core] Error: Maximum number of modules (%d) exceeded\n", BCVPU_MAX_MODULES);
        return BCVPU_CORE_STATUS_ERROR;
    }
    
    // Copy module to core's module array
    core->modules[core->module_count] = *module;
    core->module_count++;
    
    printf("[BCVPU Core] Registered module: %s (%s)\n", 
           module->name, bcvpu_module_type_string(module->type));
    
    return core->status;
}

bcvpu_core_status_t bcvpu_core_start(bcvpu_core_t* core) {
    if (!core) return BCVPU_CORE_STATUS_ERROR;
    
    if (core->status != BCVPU_CORE_STATUS_READY) {
        printf("[BCVPU Core] Error: Core not ready for start (status: %s)\n", 
               bcvpu_core_status_string(core->status));
        return BCVPU_CORE_STATUS_ERROR;
    }
    
    printf("[BCVPU Core] Starting BCVPU with %u registered modules\n", core->module_count);
    
    // Verify all modules are ready
    for (uint32_t i = 0; i < core->module_count; i++) {
        if (core->modules[i].status == BCVPU_MODULE_STATUS_ERROR) {
            printf("[BCVPU Core] Error: Module %s is in error state\n", core->modules[i].name);
            core->status = BCVPU_CORE_STATUS_ERROR;
            return BCVPU_CORE_STATUS_ERROR;
        }
    }
    
    printf("[BCVPU Core] All modules synchronized and operational\n");
    return BCVPU_CORE_STATUS_READY;
}

bcvpu_core_status_t bcvpu_core_process_task(bcvpu_core_t* core, bcvpu_task_t* task, 
                                           bcvpu_module_type_t target_module_type) {
    if (!core || !task) return BCVPU_CORE_STATUS_ERROR;
    
    if (core->status != BCVPU_CORE_STATUS_READY) {
        printf("[BCVPU Core] Error: Core not ready for processing\n");
        return BCVPU_CORE_STATUS_ERROR;
    }
    
    // Find the target module
    bcvpu_module_t* target_module = NULL;
    for (uint32_t i = 0; i < core->module_count; i++) {
        if (core->modules[i].type == target_module_type) {
            target_module = &core->modules[i];
            break;
        }
    }
    
    if (!target_module) {
        printf("[BCVPU Core] Error: Target module type %s not found\n", 
               bcvpu_module_type_string(target_module_type));
        return BCVPU_CORE_STATUS_ERROR;
    }
    
    core->status = BCVPU_CORE_STATUS_PROCESSING;
    task->task_id = ++core->task_counter;
    
    printf("[BCVPU Core] Processing task %u: %s -> %s module\n", 
           task->task_id, task->task_name, target_module->name);
    
    bcvpu_module_status_t module_result = bcvpu_module_process_task(target_module, task);
    
    if (module_result == BCVPU_MODULE_STATUS_COMPLETE) {
        printf("[BCVPU Core] Task %u completed successfully\n", task->task_id);
        core->status = BCVPU_CORE_STATUS_READY;
        return BCVPU_CORE_STATUS_READY;
    } else {
        printf("[BCVPU Core] Task %u failed with status: %s\n", 
               task->task_id, bcvpu_module_status_string(module_result));
        core->status = BCVPU_CORE_STATUS_ERROR;
        return BCVPU_CORE_STATUS_ERROR;
    }
}

bcvpu_core_status_t bcvpu_core_synchronize(bcvpu_core_t* core) {
    if (!core) return BCVPU_CORE_STATUS_ERROR;
    
    printf("[BCVPU Core] Synchronizing all modules...\n");
    
    uint32_t ready_modules = 0;
    for (uint32_t i = 0; i < core->module_count; i++) {
        if (core->modules[i].status == BCVPU_MODULE_STATUS_IDLE || 
            core->modules[i].status == BCVPU_MODULE_STATUS_COMPLETE) {
            ready_modules++;
        }
    }
    
    printf("[BCVPU Core] Synchronization complete: %u/%u modules ready\n", 
           ready_modules, core->module_count);
    
    if (ready_modules == core->module_count) {
        core->status = BCVPU_CORE_STATUS_READY;
        return BCVPU_CORE_STATUS_READY;
    } else {
        return BCVPU_CORE_STATUS_PROCESSING;
    }
}

bcvpu_core_status_t bcvpu_core_get_status(const bcvpu_core_t* core) {
    if (!core) return BCVPU_CORE_STATUS_ERROR;
    return core->status;
}

void bcvpu_core_print_info(const bcvpu_core_t* core) {
    if (!core) return;
    
    printf("\n=== BCVPU Core Information ===\n");
    printf("Status: %s\n", bcvpu_core_status_string(core->status));
    printf("Registered Modules: %u/%d\n", core->module_count, BCVPU_MAX_MODULES);
    printf("Tasks Processed: %u\n", core->task_counter);
    printf("NPU Enabled: %s\n", core->config.enable_npu ? "Yes" : "No");
    printf("Profiling Enabled: %s\n", core->config.enable_profiling ? "Yes" : "No");
    printf("Max Concurrent Tasks: %u\n", core->config.max_concurrent_tasks);
    printf("Cache Directory: %s\n", core->config.cache_dir);
    
    printf("\nRegistered Modules:\n");
    for (uint32_t i = 0; i < core->module_count; i++) {
        printf("  %u. %s (%s) - Status: %s, NPU: %s\n", 
               i + 1,
               core->modules[i].name,
               bcvpu_module_type_string(core->modules[i].type),
               bcvpu_module_status_string(core->modules[i].status),
               core->modules[i].npu_available ? "Available" : "Not Available");
    }
    printf("==============================\n\n");
}

bcvpu_core_status_t bcvpu_core_cleanup(bcvpu_core_t* core) {
    if (!core) return BCVPU_CORE_STATUS_ERROR;
    
    printf("[BCVPU Core] Cleaning up resources...\n");
    
    // Cleanup all modules
    for (uint32_t i = 0; i < core->module_count; i++) {
        if (core->modules[i].cleanup) {
            core->modules[i].cleanup(&core->modules[i]);
        }
    }
    
    // Cleanup NPU context if exists
    if (core->npu_context) {
        bcvpu_npu_cleanup_context((bcvpu_npu_context_t*)core->npu_context);
        core->npu_context = NULL;
    }
    
    core->module_count = 0;
    core->task_counter = 0;
    core->status = BCVPU_CORE_STATUS_UNINITIALIZED;
    
    printf("[BCVPU Core] Cleanup complete\n");
    return BCVPU_CORE_STATUS_UNINITIALIZED;
}