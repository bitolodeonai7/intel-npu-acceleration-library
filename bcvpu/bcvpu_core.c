//
// Copyright © 2024 Intel Corporation
// SPDX-License-Identifier: Apache 2.0
//

#include "bcvpu_core.h"
#include "npu_integration.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

// ======================== Configuration Helpers ========================

BCVPUConfig bcvpu_get_default_config(void) {
    BCVPUConfig config;
    config.enable_npu_acceleration = true;
    config.enable_profiling = false;
    config.max_concurrent_tasks = 10;
    config.memory_pool_size = 1024 * 1024; // 1MB
    strcpy(config.device_preference, "NPU");
    return config;
}

bool bcvpu_validate_config(const BCVPUConfig* config) {
    if (!config) return false;
    
    if (config->max_concurrent_tasks == 0 || config->max_concurrent_tasks > 1000) {
        printf("[BCVPU Core] Error: Invalid max_concurrent_tasks value\n");
        return false;
    }
    
    if (config->memory_pool_size == 0) {
        printf("[BCVPU Core] Error: Invalid memory_pool_size value\n");
        return false;
    }
    
    return true;
}

// ======================== Core System Functions ========================

BCVPUCore* bcvpu_create_core(void) {
    BCVPUCore* core = (BCVPUCore*)malloc(sizeof(BCVPUCore));
    if (!core) return NULL;
    
    // Initialize core structure
    memset(core, 0, sizeof(BCVPUCore));
    core->is_initialized = false;
    core->is_running = false;
    core->npu_context = NULL;
    
    // Initialize modules array
    for (int i = 0; i < BCVPU_MODULE_COUNT; i++) {
        core->modules[i] = NULL;
    }
    
    // Initialize task queue
    core->task_queue = NULL;
    core->queue_size = 0;
    core->queue_capacity = 0;
    
    // Initialize statistics
    memset(&core->stats, 0, sizeof(BCVPUSystemStats));
    
    return core;
}

bool bcvpu_initialize_core(BCVPUCore* core, const BCVPUConfig* config) {
    if (!core || !config) return false;
    
    printf("[BCVPU Core] Initializing Brain Computing Virtual Processing Unit...\n");
    
    // Validate configuration
    if (!bcvpu_validate_config(config)) {
        printf("[BCVPU Core] Configuration validation failed\n");
        return false;
    }
    
    // Copy configuration
    core->config = *config;
    
    // Initialize NPU context if enabled
    if (config->enable_npu_acceleration) {
        core->npu_context = npu_create_context();
        if (core->npu_context) {
            if (npu_initialize_context((NPUContext*)core->npu_context, config->device_preference)) {
                core->stats.npu_available = npu_is_available((NPUContext*)core->npu_context);
                core->stats.npu_driver_version = npu_get_driver_version((NPUContext*)core->npu_context);
                printf("[BCVPU Core] NPU accelerator initialized successfully\n");
            } else {
                printf("[BCVPU Core] Warning: NPU initialization failed, falling back to CPU\n");
                core->stats.npu_available = false;
            }
        }
    }
    
    // Initialize task queue
    core->queue_capacity = config->max_concurrent_tasks;
    core->task_queue = (BCVPUTask**)malloc(core->queue_capacity * sizeof(BCVPUTask*));
    if (!core->task_queue) {
        printf("[BCVPU Core] Error: Failed to allocate task queue\n");
        return false;
    }
    
    // Create and register modules
    core->modules[BCVPU_MODULE_MEMORY] = create_memory_module();
    core->modules[BCVPU_MODULE_DECISION_MAKING] = create_decision_making_module();
    core->modules[BCVPU_MODULE_SENSORY_PROCESSING] = create_sensory_processing_module();
    
    // Verify all modules were created
    for (int i = 0; i < BCVPU_MODULE_COUNT; i++) {
        if (!core->modules[i]) {
            printf("[BCVPU Core] Error: Failed to create module %d\n", i);
            return false;
        }
    }
    
    core->is_initialized = true;
    printf("[BCVPU Core] Core system initialized successfully\n");
    return true;
}

bool bcvpu_start_system(BCVPUCore* core) {
    if (!core || !core->is_initialized) return false;
    
    printf("[BCVPU Core] Starting BCVPU system...\n");
    
    // Initialize all modules
    if (!bcvpu_initialize_all_modules(core)) {
        printf("[BCVPU Core] Error: Failed to initialize modules\n");
        return false;
    }
    
    core->is_running = true;
    printf("[BCVPU Core] System started successfully\n");
    return true;
}

bool bcvpu_stop_system(BCVPUCore* core) {
    if (!core || !core->is_running) return false;
    
    printf("[BCVPU Core] Stopping BCVPU system...\n");
    
    // Process remaining tasks
    bcvpu_process_all_tasks(core);
    
    // Cleanup all modules
    for (int i = 0; i < BCVPU_MODULE_COUNT; i++) {
        if (core->modules[i] && core->modules[i]->cleanup) {
            core->modules[i]->cleanup(core->modules[i]);
        }
    }
    
    core->is_running = false;
    printf("[BCVPU Core] System stopped\n");
    return true;
}

bool bcvpu_cleanup_core(BCVPUCore* core) {
    if (!core) return false;
    
    printf("[BCVPU Core] Cleaning up core system...\n");
    
    // Stop system if running
    if (core->is_running) {
        bcvpu_stop_system(core);
    }
    
    // Cleanup NPU context
    if (core->npu_context) {
        npu_cleanup_context((NPUContext*)core->npu_context);
        npu_destroy_context((NPUContext*)core->npu_context);
        core->npu_context = NULL;
    }
    
    // Free modules
    for (int i = 0; i < BCVPU_MODULE_COUNT; i++) {
        if (core->modules[i]) {
            free(core->modules[i]);
            core->modules[i] = NULL;
        }
    }
    
    // Free task queue
    if (core->task_queue) {
        // Free any remaining tasks
        for (uint32_t i = 0; i < core->queue_size; i++) {
            if (core->task_queue[i]) {
                destroy_task(core->task_queue[i]);
            }
        }
        free(core->task_queue);
        core->task_queue = NULL;
    }
    
    core->is_initialized = false;
    printf("[BCVPU Core] Core cleanup completed\n");
    return true;
}

void bcvpu_destroy_core(BCVPUCore* core) {
    if (!core) return;
    
    bcvpu_cleanup_core(core);
    free(core);
}

// ======================== Task Management ========================

bool bcvpu_submit_task(BCVPUCore* core, BCVPUTask* task) {
    if (!core || !task || !core->is_running) return false;
    
    if (core->queue_size >= core->queue_capacity) {
        printf("[BCVPU Core] Warning: Task queue is full\n");
        return false;
    }
    
    core->task_queue[core->queue_size] = task;
    core->queue_size++;
    
    printf("[BCVPU Core] Task %u submitted to queue (queue size: %u)\n", 
           task->id, core->queue_size);
    return true;
}

bool bcvpu_process_next_task(BCVPUCore* core) {
    if (!core || !core->is_running || core->queue_size == 0) return false;
    
    BCVPUTask* task = core->task_queue[0];
    
    // Get the appropriate module
    BCVPUModule* module = bcvpu_get_module(core, task->target_module);
    if (!module) {
        printf("[BCVPU Core] Error: Module not found for task %u\n", task->id);
        task->status = BCVPU_TASK_FAILED;
        core->stats.failed_tasks++;
        return false;
    }
    
    // Record processing start time
    clock_t start_time = clock();
    
    // Process the task
    bool success = module->process_task(module, task);
    
    // Record processing time
    clock_t end_time = clock();
    double processing_time = ((double)(end_time - start_time)) / CLOCKS_PER_SEC * 1000.0;
    
    // Update statistics
    core->stats.total_tasks_processed++;
    if (success) {
        core->stats.successful_tasks++;
        if (task->use_npu_acceleration && core->stats.npu_available) {
            core->stats.npu_accelerated_tasks++;
        }
    } else {
        core->stats.failed_tasks++;
    }
    
    // Update average processing time
    core->stats.average_processing_time_ms = 
        (core->stats.average_processing_time_ms * (core->stats.total_tasks_processed - 1) + processing_time) / 
        core->stats.total_tasks_processed;
    
    // Remove task from queue
    for (uint32_t i = 1; i < core->queue_size; i++) {
        core->task_queue[i - 1] = core->task_queue[i];
    }
    core->queue_size--;
    
    return success;
}

bool bcvpu_process_all_tasks(BCVPUCore* core) {
    if (!core || !core->is_running) return false;
    
    printf("[BCVPU Core] Processing all queued tasks...\n");
    
    while (core->queue_size > 0) {
        if (!bcvpu_process_next_task(core)) {
            printf("[BCVPU Core] Warning: Task processing failed\n");
        }
    }
    
    printf("[BCVPU Core] All tasks processed\n");
    return true;
}

uint32_t bcvpu_get_queue_size(const BCVPUCore* core) {
    return core ? core->queue_size : 0;
}

// ======================== Module Management ========================

bool bcvpu_register_module(BCVPUCore* core, BCVPUModule* module) {
    if (!core || !module || module->type >= BCVPU_MODULE_COUNT) return false;
    
    core->modules[module->type] = module;
    printf("[BCVPU Core] Module registered: %s\n", module->name);
    return true;
}

BCVPUModule* bcvpu_get_module(BCVPUCore* core, BCVPUModuleType type) {
    if (!core || type >= BCVPU_MODULE_COUNT) return NULL;
    return core->modules[type];
}

bool bcvpu_initialize_all_modules(BCVPUCore* core) {
    if (!core) return false;
    
    printf("[BCVPU Core] Initializing all modules...\n");
    
    for (int i = 0; i < BCVPU_MODULE_COUNT; i++) {
        if (core->modules[i] && core->modules[i]->initialize) {
            if (!core->modules[i]->initialize(core->modules[i])) {
                printf("[BCVPU Core] Error: Failed to initialize module %s\n", 
                       core->modules[i]->name);
                return false;
            }
        }
    }
    
    printf("[BCVPU Core] All modules initialized successfully\n");
    return true;
}

// ======================== System Information ========================

void bcvpu_print_system_status(const BCVPUCore* core) {
    if (!core) return;
    
    printf("\n=== BCVPU System Status ===\n");
    printf("System State: %s\n", core->is_running ? "Running" : "Stopped");
    printf("NPU Available: %s\n", core->stats.npu_available ? "Yes" : "No");
    
    if (core->stats.npu_available) {
        printf("NPU Driver Version: %u\n", core->stats.npu_driver_version);
    }
    
    printf("Task Queue Size: %u/%u\n", core->queue_size, core->queue_capacity);
    printf("NPU Acceleration: %s\n", core->config.enable_npu_acceleration ? "Enabled" : "Disabled");
    
    printf("\nModule Status:\n");
    for (int i = 0; i < BCVPU_MODULE_COUNT; i++) {
        if (core->modules[i] && core->modules[i]->print_status) {
            printf("  ");
            core->modules[i]->print_status(core->modules[i]);
        }
    }
    printf("==========================\n\n");
}

void bcvpu_print_statistics(const BCVPUCore* core) {
    if (!core) return;
    
    printf("\n=== BCVPU Performance Statistics ===\n");
    printf("Total Tasks Processed: %u\n", core->stats.total_tasks_processed);
    printf("Successful Tasks: %u\n", core->stats.successful_tasks);
    printf("Failed Tasks: %u\n", core->stats.failed_tasks);
    printf("NPU Accelerated Tasks: %u\n", core->stats.npu_accelerated_tasks);
    printf("Average Processing Time: %.2f ms\n", core->stats.average_processing_time_ms);
    
    if (core->stats.total_tasks_processed > 0) {
        printf("Success Rate: %.1f%%\n", 
               (float)core->stats.successful_tasks / core->stats.total_tasks_processed * 100.0f);
        printf("NPU Utilization: %.1f%%\n",
               (float)core->stats.npu_accelerated_tasks / core->stats.total_tasks_processed * 100.0f);
    }
    printf("====================================\n\n");
}

bool bcvpu_check_npu_availability(BCVPUCore* core) {
    if (!core || !core->npu_context) return false;
    return npu_is_available((NPUContext*)core->npu_context);
}

BCVPUSystemStats bcvpu_get_statistics(const BCVPUCore* core) {
    BCVPUSystemStats stats = {0};
    if (core) {
        stats = core->stats;
    }
    return stats;
}

// ======================== Demonstration Functions ========================

void bcvpu_run_demo(BCVPUCore* core) {
    if (!core || !core->is_running) {
        printf("[BCVPU Core] Error: System not running\n");
        return;
    }
    
    printf("\n=== BCVPU Demonstration ===\n");
    
    // Create sample tasks for each module
    BCVPUTask* memory_task = create_task(1, BCVPU_MODULE_MEMORY, 
                                         "Store new information", NULL, 0);
    BCVPUTask* decision_task = create_task(2, BCVPU_MODULE_DECISION_MAKING, 
                                           "Make a choice", NULL, 0);
    BCVPUTask* sensory_task = create_task(3, BCVPU_MODULE_SENSORY_PROCESSING, 
                                          "Process visual input", NULL, 0);
    
    // Submit tasks
    bcvpu_submit_task(core, memory_task);
    bcvpu_submit_task(core, decision_task);
    bcvpu_submit_task(core, sensory_task);
    
    // Process all tasks
    bcvpu_process_all_tasks(core);
    
    // Print system status
    bcvpu_print_system_status(core);
    bcvpu_print_statistics(core);
    
    printf("=== Demo Complete ===\n\n");
}

void bcvpu_run_performance_test(BCVPUCore* core, uint32_t num_tasks) {
    if (!core || !core->is_running) {
        printf("[BCVPU Core] Error: System not running\n");
        return;
    }
    
    printf("\n=== BCVPU Performance Test (%u tasks) ===\n", num_tasks);
    
    clock_t start_time = clock();
    
    // Create and submit tasks
    for (uint32_t i = 0; i < num_tasks; i++) {
        BCVPUModuleType module_type = (BCVPUModuleType)(i % BCVPU_MODULE_COUNT);
        char description[256];
        snprintf(description, sizeof(description), "Performance test task %u", i + 1);
        
        BCVPUTask* task = create_task(i + 1, module_type, description, NULL, 0);
        if (!bcvpu_submit_task(core, task)) {
            printf("[BCVPU Core] Warning: Failed to submit task %u\n", i + 1);
            destroy_task(task);
            break;
        }
    }
    
    // Process all tasks
    bcvpu_process_all_tasks(core);
    
    clock_t end_time = clock();
    double total_time = ((double)(end_time - start_time)) / CLOCKS_PER_SEC;
    
    printf("Performance test completed in %.2f seconds\n", total_time);
    printf("Throughput: %.1f tasks/second\n", num_tasks / total_time);
    
    bcvpu_print_statistics(core);
    
    printf("=== Performance Test Complete ===\n\n");
}