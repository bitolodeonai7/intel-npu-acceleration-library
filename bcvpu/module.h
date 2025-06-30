//
// Copyright © 2024 Intel Corporation
// SPDX-License-Identifier: Apache 2.0
//

#pragma once

#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

/**
 * @brief Module types for BCVPU architecture
 */
typedef enum {
    BCVPU_MODULE_MEMORY = 0,
    BCVPU_MODULE_DECISION_MAKING = 1,
    BCVPU_MODULE_SENSORY_PROCESSING = 2,
    BCVPU_MODULE_COUNT = 3
} bcvpu_module_type_t;

/**
 * @brief Module status enumeration
 */
typedef enum {
    BCVPU_MODULE_STATUS_IDLE = 0,
    BCVPU_MODULE_STATUS_PROCESSING = 1,
    BCVPU_MODULE_STATUS_COMPLETE = 2,
    BCVPU_MODULE_STATUS_ERROR = 3
} bcvpu_module_status_t;

/**
 * @brief Task structure for module communication
 */
typedef struct {
    char task_name[256];
    void* input_data;
    size_t input_size;
    void* output_data;
    size_t output_size;
    uint32_t task_id;
} bcvpu_task_t;

/**
 * @brief Forward declaration of module structure
 */
typedef struct bcvpu_module bcvpu_module_t;

/**
 * @brief Module function pointer types
 */
typedef bcvpu_module_status_t (*bcvpu_module_init_fn)(bcvpu_module_t* module);
typedef bcvpu_module_status_t (*bcvpu_module_process_fn)(bcvpu_module_t* module, bcvpu_task_t* task);
typedef bcvpu_module_status_t (*bcvpu_module_cleanup_fn)(bcvpu_module_t* module);

/**
 * @brief BCVPU Module structure
 */
struct bcvpu_module {
    bcvpu_module_type_t type;
    char name[64];
    bcvpu_module_status_t status;
    void* private_data;
    
    // Function pointers for module operations
    bcvpu_module_init_fn init;
    bcvpu_module_process_fn process;
    bcvpu_module_cleanup_fn cleanup;
    
    // NPU acceleration flags
    uint8_t npu_enabled;
    uint8_t npu_available;
};

/**
 * @brief Initialize a BCVPU module
 * 
 * @param module Pointer to module structure
 * @param type Module type
 * @param name Module name
 * @param npu_enabled Whether NPU acceleration is enabled
 * @return bcvpu_module_status_t Status of initialization
 */
bcvpu_module_status_t bcvpu_module_init(bcvpu_module_t* module, bcvpu_module_type_t type, 
                                       const char* name, uint8_t npu_enabled);

/**
 * @brief Create a memory module
 * 
 * @param module Pointer to module structure
 * @return bcvpu_module_status_t Status of creation
 */
bcvpu_module_status_t bcvpu_create_memory_module(bcvpu_module_t* module);

/**
 * @brief Create a decision-making module
 * 
 * @param module Pointer to module structure
 * @return bcvpu_module_status_t Status of creation
 */
bcvpu_module_status_t bcvpu_create_decision_making_module(bcvpu_module_t* module);

/**
 * @brief Create a sensory processing module
 * 
 * @param module Pointer to module structure
 * @return bcvpu_module_status_t Status of creation
 */
bcvpu_module_status_t bcvpu_create_sensory_processing_module(bcvpu_module_t* module);

/**
 * @brief Process a task with the module
 * 
 * @param module Pointer to module structure
 * @param task Pointer to task structure
 * @return bcvpu_module_status_t Status of processing
 */
bcvpu_module_status_t bcvpu_module_process_task(bcvpu_module_t* module, bcvpu_task_t* task);

/**
 * @brief Get module status string
 * 
 * @param status Module status
 * @return const char* Status string
 */
const char* bcvpu_module_status_string(bcvpu_module_status_t status);

/**
 * @brief Get module type string
 * 
 * @param type Module type
 * @return const char* Type string
 */
const char* bcvpu_module_type_string(bcvpu_module_type_t type);

/**
 * @brief Cleanup module resources
 * 
 * @param module Pointer to module structure
 * @return bcvpu_module_status_t Status of cleanup
 */
bcvpu_module_status_t bcvpu_module_cleanup(bcvpu_module_t* module);

#ifdef __cplusplus
}
#endif