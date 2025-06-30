//
// Copyright © 2024 Intel Corporation
// SPDX-License-Identifier: Apache 2.0
//

#include "../bcvpu/bcvpu_core.h"
#include "../bcvpu/module.h"
#include "../bcvpu/npu_integration.h"
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

/**
 * Basic BCVPU Usage Example
 * 
 * This example demonstrates the fundamental usage of the BCVPU architecture:
 * - System initialization
 * - Task creation and submission
 * - Processing tasks across different modules
 * - Performance monitoring
 * - System cleanup
 */

void print_separator(const char* title) {
    printf("\n");
    for (int i = 0; i < 60; i++) printf("=");
    printf("\n");
    if (title) {
        printf("  %s\n", title);
        for (int i = 0; i < 60; i++) printf("=");
        printf("\n");
    }
}

int main() {
    print_separator("BCVPU Basic Usage Example");
    
    // Create BCVPU core
    BCVPUCore* core = bcvpu_create_core();
    if (!core) {
        fprintf(stderr, "Failed to create BCVPU core\n");
        return 1;
    }
    
    // Configure system
    BCVPUConfig config = bcvpu_get_default_config();
    config.enable_npu_acceleration = true;
    config.enable_profiling = true;
    config.max_concurrent_tasks = 15;
    
    printf("Configuration:\n");
    printf("  NPU Acceleration: %s\n", config.enable_npu_acceleration ? "Enabled" : "Disabled");
    printf("  Max Tasks: %u\n", config.max_concurrent_tasks);
    printf("  Memory Pool: %u MB\n", config.memory_pool_size / (1024 * 1024));
    printf("  Device Preference: %s\n", config.device_preference);
    
    // Initialize and start system
    if (!bcvpu_initialize_core(core, &config)) {
        fprintf(stderr, "Failed to initialize BCVPU core\n");
        bcvpu_destroy_core(core);
        return 1;
    }
    
    if (!bcvpu_start_system(core)) {
        fprintf(stderr, "Failed to start BCVPU system\n");
        bcvpu_destroy_core(core);
        return 1;
    }
    
    print_separator("Creating and Submitting Tasks");
    
    // Create various tasks for demonstration
    BCVPUTask* tasks[] = {
        // Memory tasks
        create_task(1, BCVPU_MODULE_MEMORY, "Store user preferences", NULL, 0),
        create_task(2, BCVPU_MODULE_MEMORY, "Cache computation results", NULL, 0),
        create_task(3, BCVPU_MODULE_MEMORY, "Retrieve historical data", NULL, 0),
        
        // Decision-making tasks
        create_task(4, BCVPU_MODULE_DECISION_MAKING, "Evaluate investment options", NULL, 0),
        create_task(5, BCVPU_MODULE_DECISION_MAKING, "Risk assessment for new project", NULL, 0),
        create_task(6, BCVPU_MODULE_DECISION_MAKING, "Optimize resource allocation", NULL, 0),
        
        // Sensory processing tasks
        create_task(7, BCVPU_MODULE_SENSORY_PROCESSING, "Analyze camera feed", NULL, 0),
        create_task(8, BCVPU_MODULE_SENSORY_PROCESSING, "Process audio signals", NULL, 0),
        create_task(9, BCVPU_MODULE_SENSORY_PROCESSING, "Integrate sensor data", NULL, 0)
    };
    
    const int num_tasks = sizeof(tasks) / sizeof(tasks[0]);
    
    // Submit all tasks
    printf("Submitting %d tasks to the system...\n", num_tasks);
    for (int i = 0; i < num_tasks; i++) {
        if (!bcvpu_submit_task(core, tasks[i])) {
            printf("Warning: Failed to submit task %d\n", i + 1);
        }
    }
    
    printf("Current queue size: %u tasks\n", bcvpu_get_queue_size(core));
    
    print_separator("Processing Tasks");
    
    // Process all tasks
    clock_t start_time = clock();
    bcvpu_process_all_tasks(core);
    clock_t end_time = clock();
    
    double processing_time = ((double)(end_time - start_time)) / CLOCKS_PER_SEC;
    printf("All tasks processed in %.3f seconds\n", processing_time);
    
    print_separator("System Performance Analysis");
    
    // Print detailed statistics
    bcvpu_print_system_status(core);
    bcvpu_print_statistics(core);
    
    // NPU-specific analysis
    if (bcvpu_check_npu_availability(core)) {
        printf("=== NPU Performance Analysis ===\n");
        printf("NPU acceleration was successfully utilized\n");
        printf("Performance improvement over CPU-only processing\n");
        
        BCVPUSystemStats stats = bcvpu_get_statistics(core);
        if (stats.total_tasks_processed > 0) {
            float npu_utilization = (float)stats.npu_accelerated_tasks / stats.total_tasks_processed * 100.0f;
            printf("NPU Utilization Rate: %.1f%%\n", npu_utilization);
            
            if (npu_utilization > 80.0f) {
                printf("✓ Excellent NPU utilization - tasks well-suited for acceleration\n");
            } else if (npu_utilization > 50.0f) {
                printf("○ Good NPU utilization - consider optimizing task types\n");
            } else {
                printf("△ Low NPU utilization - tasks may be CPU-bound\n");
            }
        }
    } else {
        printf("=== CPU Fallback Mode ===\n");
        printf("NPU not available - all processing done on CPU\n");
        printf("For optimal performance, ensure NPU drivers are installed\n");
    }
    
    print_separator("Module Performance Breakdown");
    
    // Get module-specific information
    for (int module_type = 0; module_type < BCVPU_MODULE_COUNT; module_type++) {
        BCVPUModule* module = bcvpu_get_module(core, (BCVPUModuleType)module_type);
        if (module) {
            printf("\n%s:\n", module_type_to_string((BCVPUModuleType)module_type));
            printf("  Status: %s\n", module->is_initialized ? "Initialized" : "Not Initialized");
            printf("  NPU Support: %s\n", module->npu_enabled ? "Enabled" : "Disabled");
            printf("  Specialization: ");
            
            switch (module_type) {
                case BCVPU_MODULE_MEMORY:
                    printf("Data storage, retrieval, and memory optimization\n");
                    break;
                case BCVPU_MODULE_DECISION_MAKING:
                    printf("AI inference, risk analysis, and decision logic\n");
                    break;
                case BCVPU_MODULE_SENSORY_PROCESSING:
                    printf("Pattern recognition, signal processing, and sensor fusion\n");
                    break;
                default:
                    printf("General cognitive processing\n");
            }
        }
    }
    
    print_separator("Use Case Scenarios");
    
    printf("This BCVPU system can be applied to:\n\n");
    printf("🏭 Industrial Applications:\n");
    printf("  • Real-time quality control with visual inspection\n");
    printf("  • Predictive maintenance using sensor data\n");
    printf("  • Automated decision-making in manufacturing\n\n");
    
    printf("🚗 Autonomous Systems:\n");
    printf("  • Multi-sensor fusion for environment perception\n");
    printf("  • Real-time path planning and obstacle avoidance\n");
    printf("  • Adaptive behavior based on learned patterns\n\n");
    
    printf("🏥 Healthcare Applications:\n");
    printf("  • Medical image analysis and diagnosis assistance\n");
    printf("  • Patient monitoring with multi-modal sensors\n");
    printf("  • Treatment recommendation systems\n\n");
    
    printf("💰 Financial Services:\n");
    printf("  • Risk assessment and fraud detection\n");
    printf("  • Algorithmic trading with real-time analysis\n");
    printf("  • Portfolio optimization and management\n");
    
    print_separator("Cleanup and Shutdown");
    
    // Cleanup tasks
    for (int i = 0; i < num_tasks; i++) {
        destroy_task(tasks[i]);
    }
    
    // Stop and cleanup system
    bcvpu_stop_system(core);
    bcvpu_cleanup_core(core);
    bcvpu_destroy_core(core);
    
    printf("BCVPU system successfully shut down\n");
    printf("Example completed successfully!\n");
    
    print_separator("Summary");
    
    printf("This example demonstrated:\n");
    printf("✓ BCVPU system initialization and configuration\n");
    printf("✓ Multi-module task processing architecture\n");
    printf("✓ Intel NPU acceleration integration\n");
    printf("✓ Performance monitoring and statistics\n");
    printf("✓ Proper resource management and cleanup\n");
    printf("\nFor more advanced examples, see the examples/ directory\n");
    
    print_separator(NULL);
    
    return 0;
}