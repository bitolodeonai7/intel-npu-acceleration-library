//
// Copyright © 2024 Intel Corporation
// SPDX-License-Identifier: Apache 2.0
//

#pragma once

#include "module.h"
#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

/**
 * @brief Maximum number of modules in BCVPU core
 */
#define BCVPU_MAX_MODULES 8

/**
 * @brief BCVPU Core status enumeration
 */
typedef enum {
    BCVPU_CORE_STATUS_UNINITIALIZED = 0,
    BCVPU_CORE_STATUS_INITIALIZING = 1,
    BCVPU_CORE_STATUS_READY = 2,
    BCVPU_CORE_STATUS_PROCESSING = 3,
    BCVPU_CORE_STATUS_ERROR = 4
} bcvpu_core_status_t;

/**
 * @brief BCVPU Core configuration
 */
typedef struct {
    uint8_t enable_npu;
    uint8_t enable_profiling;
    uint32_t max_concurrent_tasks;
    char cache_dir[256];
} bcvpu_core_config_t;

/**
 * @brief BCVPU Core structure
 */
typedef struct {
    bcvpu_core_status_t status;
    bcvpu_core_config_t config;
    bcvpu_module_t modules[BCVPU_MAX_MODULES];
    uint32_t module_count;
    uint32_t task_counter;
    void* npu_context;
} bcvpu_core_t;

/**
 * @brief Initialize BCVPU Core with default configuration
 * 
 * @param core Pointer to BCVPU core structure
 * @return bcvpu_core_status_t Status of initialization
 */
bcvpu_core_status_t bcvpu_core_init(bcvpu_core_t* core);

/**
 * @brief Initialize BCVPU Core with custom configuration
 * 
 * @param core Pointer to BCVPU core structure
 * @param config Pointer to configuration structure
 * @return bcvpu_core_status_t Status of initialization
 */
bcvpu_core_status_t bcvpu_core_init_with_config(bcvpu_core_t* core, const bcvpu_core_config_t* config);

/**
 * @brief Register a module with the BCVPU core
 * 
 * @param core Pointer to BCVPU core structure
 * @param module Pointer to module structure
 * @return bcvpu_core_status_t Status of registration
 */
bcvpu_core_status_t bcvpu_core_register_module(bcvpu_core_t* core, bcvpu_module_t* module);

/**
 * @brief Start the BCVPU core processing
 * 
 * @param core Pointer to BCVPU core structure
 * @return bcvpu_core_status_t Status of start operation
 */
bcvpu_core_status_t bcvpu_core_start(bcvpu_core_t* core);

/**
 * @brief Process a task through the BCVPU pipeline
 * 
 * @param core Pointer to BCVPU core structure
 * @param task Pointer to task structure
 * @param target_module_type Target module type for processing
 * @return bcvpu_core_status_t Status of processing
 */
bcvpu_core_status_t bcvpu_core_process_task(bcvpu_core_t* core, bcvpu_task_t* task, 
                                           bcvpu_module_type_t target_module_type);

/**
 * @brief Synchronize all modules in the BCVPU core
 * 
 * @param core Pointer to BCVPU core structure
 * @return bcvpu_core_status_t Status of synchronization
 */
bcvpu_core_status_t bcvpu_core_synchronize(bcvpu_core_t* core);

/**
 * @brief Get BCVPU core status
 * 
 * @param core Pointer to BCVPU core structure
 * @return bcvpu_core_status_t Current status
 */
bcvpu_core_status_t bcvpu_core_get_status(const bcvpu_core_t* core);

/**
 * @brief Get core status string
 * 
 * @param status Core status
 * @return const char* Status string
 */
const char* bcvpu_core_status_string(bcvpu_core_status_t status);

/**
 * @brief Print BCVPU core information
 * 
 * @param core Pointer to BCVPU core structure
 */
void bcvpu_core_print_info(const bcvpu_core_t* core);

/**
 * @brief Cleanup BCVPU core resources
 * 
 * @param core Pointer to BCVPU core structure
 * @return bcvpu_core_status_t Status of cleanup
 */
bcvpu_core_status_t bcvpu_core_cleanup(bcvpu_core_t* core);

/**
 * @brief Create default BCVPU configuration
 * 
 * @param config Pointer to configuration structure to fill
 */
void bcvpu_core_create_default_config(bcvpu_core_config_t* config);

#ifdef __cplusplus
}
#endif