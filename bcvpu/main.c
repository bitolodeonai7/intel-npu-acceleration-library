//
// Copyright © 2024 Intel Corporation
// SPDX-License-Identifier: Apache 2.0
//

#include "bcvpu_core.h"
#include "module.h"
#include "npu_integration.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <math.h>

// Helper function to create and process a task
void create_and_process_task(bcvpu_core_t* core, const char* task_name, 
                           bcvpu_module_type_t module_type, void* input_data, 
                           size_t input_size, void* output_data, size_t output_size) {
    bcvpu_task_t task;
    strncpy(task.task_name, task_name, sizeof(task.task_name) - 1);
    task.task_name[sizeof(task.task_name) - 1] = '\0';
    task.input_data = input_data;
    task.input_size = input_size;
    task.output_data = output_data;
    task.output_size = output_size;
    task.task_id = 0;
    
    bcvpu_core_process_task(core, &task, module_type);
    printf("\n");
}

int main() {
    printf("=== BCVPU (Brain Computing Virtual Processing Unit) Demo ===\n\n");
    
    // Initialize BCVPU Core
    bcvpu_core_t core;
    bcvpu_core_status_t status = bcvpu_core_init(&core);
    
    if (status != BCVPU_CORE_STATUS_READY) {
        printf("Failed to initialize BCVPU Core\n");
        return 1;
    }
    
    // Create and register modules
    printf("Creating cognitive modules...\n");
    
    // Memory Module
    bcvpu_module_t memory_module;
    bcvpu_module_init(&memory_module, BCVPU_MODULE_MEMORY, "Memory Module", 1);
    bcvpu_create_memory_module(&memory_module);
    bcvpu_core_register_module(&core, &memory_module);
    
    // Decision-Making Module
    bcvpu_module_t decision_module;
    bcvpu_module_init(&decision_module, BCVPU_MODULE_DECISION_MAKING, "Decision-Making Module", 1);
    bcvpu_create_decision_making_module(&decision_module);
    bcvpu_core_register_module(&core, &decision_module);
    
    // Sensory Processing Module
    bcvpu_module_t sensory_module;
    bcvpu_module_init(&sensory_module, BCVPU_MODULE_SENSORY_PROCESSING, "Sensory Processing Module", 1);
    bcvpu_create_sensory_processing_module(&sensory_module);
    bcvpu_core_register_module(&core, &sensory_module);
    
    // Start the BCVPU core
    status = bcvpu_core_start(&core);
    if (status != BCVPU_CORE_STATUS_READY) {
        printf("Failed to start BCVPU Core\n");
        bcvpu_core_cleanup(&core);
        return 1;
    }
    
    // Print core information
    bcvpu_core_print_info(&core);
    
    printf("=== Demonstration of BCVPU Modular Architecture ===\n\n");
    
    // Demonstrate Memory Module
    printf("--- Memory Module Demonstration ---\n");
    char memory_input[] = "Sample data to store in memory bank";
    char memory_output[256] = {0};
    
    create_and_process_task(&core, "Store new information", BCVPU_MODULE_MEMORY,
                           memory_input, strlen(memory_input) + 1,
                           NULL, 0);
    
    create_and_process_task(&core, "Retrieve stored information", BCVPU_MODULE_MEMORY,
                           NULL, 0, memory_output, sizeof(memory_output));
    
    // Demonstrate Decision-Making Module
    printf("--- Decision-Making Module Demonstration ---\n");
    float decision_input[] = {0.8f, 0.3f, 0.9f, 0.2f}; // Sample input features
    int decision_output = 0;
    
    create_and_process_task(&core, "Make a choice", BCVPU_MODULE_DECISION_MAKING,
                           decision_input, sizeof(decision_input),
                           &decision_output, sizeof(decision_output));
    
    printf("Decision result: %s\n\n", decision_output ? "POSITIVE" : "NEGATIVE");
    
    // Demonstrate Sensory Processing Module
    printf("--- Sensory Processing Module Demonstration ---\n");
    float visual_input[224 * 224 * 3]; // Simulated image data
    float pattern_confidence = 0.0f;
    
    // Initialize with dummy data
    for (int i = 0; i < 224 * 224 * 3; i++) {
        visual_input[i] = (float)(i % 256) / 255.0f;
    }
    
    create_and_process_task(&core, "Process visual input", BCVPU_MODULE_SENSORY_PROCESSING,
                           visual_input, sizeof(visual_input),
                           &pattern_confidence, sizeof(pattern_confidence));
    
    printf("Pattern recognition confidence: %.2f\n\n", pattern_confidence);
    
    // Additional audio processing demonstration
    float audio_input[1024]; // Simulated audio features
    float audio_confidence = 0.0f;
    
    for (int i = 0; i < 1024; i++) {
        audio_input[i] = (float)sin(i * 0.01);
    }
    
    create_and_process_task(&core, "Process audio input", BCVPU_MODULE_SENSORY_PROCESSING,
                           audio_input, sizeof(audio_input),
                           &audio_confidence, sizeof(audio_confidence));
    
    printf("Audio feature confidence: %.2f\n\n", audio_confidence);
    
    // Demonstrate NPU Integration directly
    printf("--- NPU Integration Demonstration ---\n");
    
    if (bcvpu_npu_is_available()) {
        bcvpu_npu_context_t* npu_context;
        bcvpu_npu_status_t npu_status = bcvpu_npu_init_context(&npu_context);
        
        if (npu_status == BCVPU_NPU_STATUS_SUCCESS || npu_status == BCVPU_NPU_STATUS_NOT_AVAILABLE) {
            // Create test tensors for matrix multiplication
            bcvpu_npu_tensor_t tensor_a, tensor_b, tensor_result;
            
            size_t shape_a[] = {128, 256};
            size_t shape_b[] = {256, 512};
            size_t shape_result[] = {128, 512};
            
            if (bcvpu_npu_create_tensor(&tensor_a, shape_a, 2, "float16") == BCVPU_NPU_STATUS_SUCCESS &&
                bcvpu_npu_create_tensor(&tensor_b, shape_b, 2, "float16") == BCVPU_NPU_STATUS_SUCCESS &&
                bcvpu_npu_create_tensor(&tensor_result, shape_result, 2, "float16") == BCVPU_NPU_STATUS_SUCCESS) {
                
                bcvpu_npu_matrix_multiply(npu_context, &tensor_a, &tensor_b, &tensor_result);
                
                // Cleanup tensors
                bcvpu_npu_free_tensor(&tensor_a);
                bcvpu_npu_free_tensor(&tensor_b);
                bcvpu_npu_free_tensor(&tensor_result);
            }
            
            bcvpu_npu_cleanup_context(npu_context);
        }
    } else {
        printf("NPU not available for direct testing\n");
    }
    
    // Synchronize all modules
    printf("--- Final Synchronization ---\n");
    bcvpu_core_synchronize(&core);
    
    // Final status
    bcvpu_core_print_info(&core);
    
    printf("=== BCVPU Demo Completed Successfully ===\n");
    printf("\nKey Features Demonstrated:\n");
    printf("✓ Modular cognitive architecture with Memory, Decision-Making, and Sensory Processing modules\n");
    printf("✓ NPU integration with fallback to CPU when NPU is not available\n");
    printf("✓ Task-based processing pipeline\n");
    printf("✓ Module synchronization and status management\n");
    printf("✓ Extensible architecture for adding new cognitive modules\n");
    
    // Cleanup
    bcvpu_core_cleanup(&core);
    
    return 0;
}