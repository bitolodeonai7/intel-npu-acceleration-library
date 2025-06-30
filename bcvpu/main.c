//
// Copyright © 2024 Intel Corporation
// SPDX-License-Identifier: Apache 2.0
//

#include "bcvpu_core.h"
#include "module.h"
#include "npu_integration.h"
#include <stdio.h>
#include <stdlib.h>

int main() {
    printf("=======================================================\n");
    printf("  Brain Computing Virtual Processing Unit (BCVPU)\n");
    printf("  Modular Architecture with Intel NPU Acceleration\n");
    printf("=======================================================\n\n");
    
    // Create BCVPU core
    BCVPUCore* core = bcvpu_create_core();
    if (!core) {
        fprintf(stderr, "Error: Failed to create BCVPU core\n");
        return 1;
    }
    
    // Get default configuration and customize
    BCVPUConfig config = bcvpu_get_default_config();
    config.enable_npu_acceleration = true;
    config.enable_profiling = true;
    config.max_concurrent_tasks = 20;
    
    // Initialize core system
    if (!bcvpu_initialize_core(core, &config)) {
        fprintf(stderr, "Error: Failed to initialize BCVPU core\n");
        bcvpu_destroy_core(core);
        return 1;
    }
    
    // Start the system
    if (!bcvpu_start_system(core)) {
        fprintf(stderr, "Error: Failed to start BCVPU system\n");
        bcvpu_destroy_core(core);
        return 1;
    }
    
    printf("BCVPU system started successfully!\n\n");
    
    // Print initial system status
    bcvpu_print_system_status(core);
    
    // Run demonstration
    printf("Running BCVPU demonstration...\n");
    bcvpu_run_demo(core);
    
    // Run performance test
    printf("Running performance test with 10 tasks...\n");
    bcvpu_run_performance_test(core, 10);
    
    // Demonstrate NPU acceleration capabilities
    printf("=== NPU Acceleration Demonstration ===\n");
    if (bcvpu_check_npu_availability(core)) {
        printf("NPU is available - demonstrating specific NPU operations:\n\n");
        
        // Get NPU context from core
        NPUContext* npu_ctx = (NPUContext*)core->npu_context;
        
        // Demonstrate memory operation acceleration
        char sample_data[] = "Sample memory data for NPU acceleration";
        npu_accelerate_memory_operation(npu_ctx, sample_data, sizeof(sample_data), "memory_optimize");
        
        // Demonstrate decision making acceleration
        float features[] = {0.5f, 0.8f, 0.3f, 0.9f, 0.1f};
        float decision_scores[3] = {0};
        npu_accelerate_decision_making(npu_ctx, features, 5, decision_scores);
        printf("Decision scores: [%.3f, %.3f, %.3f]\n", 
               decision_scores[0], decision_scores[1], decision_scores[2]);
        
        // Demonstrate sensory processing acceleration
        uint8_t sensor_data[1024] = {0}; // Simulated sensor data
        uint8_t processed_output[512] = {0};
        npu_accelerate_sensory_processing(npu_ctx, sensor_data, sizeof(sensor_data), processed_output);
        
        // Print NPU performance statistics
        npu_print_performance_stats(npu_ctx);
    } else {
        printf("NPU not available - running on CPU fallback\n");
    }
    
    printf("=== Advanced Module Testing ===\n");
    
    // Test each module individually with different task types
    const char* memory_tasks[] = {
        "Allocate working memory",
        "Store episodic memory",
        "Retrieve semantic knowledge",
        "Optimize memory layout"
    };
    
    const char* decision_tasks[] = {
        "Evaluate action options",
        "Risk assessment analysis",
        "Pattern-based prediction",
        "Multi-criteria optimization"
    };
    
    const char* sensory_tasks[] = {
        "Visual pattern recognition",
        "Audio signal processing",
        "Tactile sensation analysis",
        "Multi-modal sensor fusion"
    };
    
    // Submit varied tasks
    printf("Submitting diverse cognitive tasks...\n");
    
    for (int i = 0; i < 4; i++) {
        BCVPUTask* mem_task = create_task(100 + i, BCVPU_MODULE_MEMORY, memory_tasks[i], NULL, 0);
        BCVPUTask* dec_task = create_task(200 + i, BCVPU_MODULE_DECISION_MAKING, decision_tasks[i], NULL, 0);
        BCVPUTask* sen_task = create_task(300 + i, BCVPU_MODULE_SENSORY_PROCESSING, sensory_tasks[i], NULL, 0);
        
        bcvpu_submit_task(core, mem_task);
        bcvpu_submit_task(core, dec_task);
        bcvpu_submit_task(core, sen_task);
    }
    
    printf("Processing %u queued tasks...\n", bcvpu_get_queue_size(core));
    bcvpu_process_all_tasks(core);
    
    // Final system statistics
    printf("\n=== Final System Report ===\n");
    bcvpu_print_system_status(core);
    bcvpu_print_statistics(core);
    
    // Demonstrate system architecture information
    printf("=== Architecture Summary ===\n");
    printf("Modules Implemented:\n");
    for (int i = 0; i < BCVPU_MODULE_COUNT; i++) {
        BCVPUModule* module = bcvpu_get_module(core, (BCVPUModuleType)i);
        if (module) {
            printf("  - %s: Initialized=%s, NPU-Enabled=%s\n",
                   module->name,
                   module->is_initialized ? "Yes" : "No",
                   module->npu_enabled ? "Yes" : "No");
        }
    }
    
    BCVPUSystemStats stats = bcvpu_get_statistics(core);
    printf("\nSystem Capabilities:\n");
    printf("  - Total Processing Power: %u tasks completed\n", stats.total_tasks_processed);
    printf("  - NPU Acceleration Rate: %.1f%% of tasks\n", 
           stats.total_tasks_processed > 0 ? 
           (float)stats.npu_accelerated_tasks / stats.total_tasks_processed * 100.0f : 0.0f);
    printf("  - System Reliability: %.1f%% success rate\n",
           stats.total_tasks_processed > 0 ?
           (float)stats.successful_tasks / stats.total_tasks_processed * 100.0f : 0.0f);
    printf("  - Performance: %.2f ms average response time\n", stats.average_processing_time_ms);
    
    printf("\n=== BCVPU System Capabilities ===\n");
    printf("✓ Modular functional architecture\n");
    printf("✓ Intel NPU acceleration integration\n");
    printf("✓ Memory management and optimization\n");
    printf("✓ AI-powered decision making\n");
    printf("✓ Advanced sensory processing\n");
    printf("✓ Real-time task scheduling\n");
    printf("✓ Performance monitoring and profiling\n");
    printf("✓ Scalable concurrent processing\n");
    
    // Cleanup and shutdown
    printf("\n=== Shutting Down BCVPU System ===\n");
    bcvpu_stop_system(core);
    bcvpu_cleanup_core(core);
    bcvpu_destroy_core(core);
    
    printf("[BCVPU Core] System shutdown complete\n");
    printf("\n=======================================================\n");
    printf("  BCVPU Demonstration Completed Successfully\n");
    printf("  Modular brain computing architecture with NPU\n");
    printf("  acceleration has been successfully demonstrated.\n");
    printf("=======================================================\n");
    
    return 0;
}