"use strict";
/**
 * Copyright © 2024 Intel Corporation
 * SPDX-License-Identifier: Apache 2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
const BCVPUCore_1 = require("../../src/core/BCVPUCore");
const IModule_1 = require("../../src/interfaces/IModule");
/**
 * Basic BCVPU Usage Example (TypeScript)
 *
 * This example demonstrates the fundamental usage of the BCVPU architecture:
 * - System initialization with configuration
 * - Task creation and submission across modules
 * - Event-driven processing and monitoring
 * - Performance analysis and NPU utilization
 * - Proper cleanup and resource management
 */
// Utility functions
function printSeparator(title) {
    console.log('\n' + '='.repeat(60));
    if (title) {
        console.log(`  ${title}`);
        console.log('='.repeat(60));
    }
}
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
// Task creation helper
function createTask(id, targetModule, description, data, useNPUAcceleration = true) {
    return {
        id,
        targetModule,
        description,
        data,
        status: IModule_1.TaskStatus.PENDING,
        useNPUAcceleration,
        createdAt: new Date(),
        metadata: {}
    };
}
async function main() {
    printSeparator('BCVPU Basic Usage Example (TypeScript)');
    try {
        // Create BCVPU core
        const core = new BCVPUCore_1.BCVPUCore();
        // Configure system
        const config = {
            enableNPUAcceleration: true,
            enableProfiling: true,
            maxConcurrentTasks: 20,
            memoryPoolSize: 2 * 1024 * 1024,
            devicePreference: 'NPU',
            logLevel: 'info',
            performanceMode: 'balanced'
        };
        console.log('Configuration:');
        console.log(`  NPU Acceleration: ${config.enableNPUAcceleration ? 'Enabled' : 'Disabled'}`);
        console.log(`  Max Tasks: ${config.maxConcurrentTasks}`);
        console.log(`  Memory Pool: ${config.memoryPoolSize / (1024 * 1024)} MB`);
        console.log(`  Device Preference: ${config.devicePreference}`);
        console.log(`  Performance Mode: ${config.performanceMode}`);
        // Set up event listeners for monitoring
        setupEventListeners(core);
        // Initialize and start system
        console.log('\nInitializing BCVPU system...');
        const initialized = await core.initialize(config);
        if (!initialized) {
            throw new Error('Failed to initialize BCVPU core');
        }
        const started = await core.start();
        if (!started) {
            throw new Error('Failed to start BCVPU system');
        }
        printSeparator('Creating and Submitting Tasks');
        // Create various tasks for demonstration
        const tasks = [
            // Memory tasks
            createTask('mem-001', IModule_1.ModuleType.MEMORY, 'Store user preferences', { userId: 123, preferences: { theme: 'dark' } }),
            createTask('mem-002', IModule_1.ModuleType.MEMORY, 'Cache computation results', { computation: 'fibonacci', result: [1, 1, 2, 3, 5, 8] }),
            createTask('mem-003', IModule_1.ModuleType.MEMORY, 'Retrieve historical data', { timeRange: '2024-01-01:2024-12-31' }),
            // Decision-making tasks
            createTask('dec-001', IModule_1.ModuleType.DECISION_MAKING, 'Evaluate investment options', {
                options: ['stocks', 'bonds', 'crypto'],
                riskTolerance: 0.7,
                timeHorizon: '5 years'
            }),
            createTask('dec-002', IModule_1.ModuleType.DECISION_MAKING, 'Risk assessment for new project', {
                project: 'AI Implementation',
                budget: 100000,
                timeline: 6
            }),
            createTask('dec-003', IModule_1.ModuleType.DECISION_MAKING, 'Optimize resource allocation', {
                resources: ['CPU', 'Memory', 'Storage'],
                constraints: { budget: 50000, performance: 'high' }
            }),
            // Sensory processing tasks
            createTask('sen-001', IModule_1.ModuleType.SENSORY_PROCESSING, 'Analyze camera feed', {
                source: 'camera_1',
                resolution: '1080p',
                fps: 30
            }),
            createTask('sen-002', IModule_1.ModuleType.SENSORY_PROCESSING, 'Process audio signals', {
                channels: 2,
                sampleRate: 44100,
                format: 'WAV'
            }),
            createTask('sen-003', IModule_1.ModuleType.SENSORY_PROCESSING, 'Integrate sensor data', {
                sensors: ['temperature', 'humidity', 'pressure'],
                interval: 1000
            })
        ];
        // Submit all tasks
        console.log(`Submitting ${tasks.length} tasks to the system...`);
        for (const task of tasks) {
            await core.submitTask(task);
            await delay(10); // Small delay for demonstration
        }
        console.log(`Current queue size: ${core.queueInfo.size} tasks`);
        printSeparator('Processing Tasks');
        // Process all tasks with timing
        const startTime = Date.now();
        await core.processAllTasks();
        const endTime = Date.now();
        const processingTime = (endTime - startTime) / 1000;
        console.log(`All tasks processed in ${processingTime.toFixed(3)} seconds`);
        printSeparator('System Performance Analysis');
        // Get and display detailed statistics
        const stats = core.getStatistics();
        const diagnostics = await core.runDiagnostics();
        console.log('=== Performance Metrics ===');
        console.log(`Total Tasks Processed: ${stats.totalTasksProcessed}`);
        console.log(`Successful Tasks: ${stats.successfulTasks}`);
        console.log(`Failed Tasks: ${stats.failedTasks}`);
        console.log(`NPU Accelerated Tasks: ${stats.npuAcceleratedTasks}`);
        console.log(`Average Processing Time: ${stats.averageProcessingTimeMs.toFixed(2)} ms`);
        console.log(`System Uptime: ${(stats.systemUptimeMs / 1000).toFixed(1)} seconds`);
        console.log(`Memory Usage: ${stats.memoryUsageMB} MB`);
        if (stats.totalTasksProcessed > 0) {
            const successRate = (stats.successfulTasks / stats.totalTasksProcessed) * 100;
            const npuUtilization = (stats.npuAcceleratedTasks / stats.totalTasksProcessed) * 100;
            console.log(`Success Rate: ${successRate.toFixed(1)}%`);
            console.log(`NPU Utilization: ${npuUtilization.toFixed(1)}%`);
            // NPU-specific analysis
            if (stats.npuAvailable) {
                console.log('\n=== NPU Performance Analysis ===');
                console.log('NPU acceleration was successfully utilized');
                console.log(`Driver Version: ${stats.npuDriverVersion}`);
                if (npuUtilization > 80) {
                    console.log('✓ Excellent NPU utilization - tasks well-suited for acceleration');
                }
                else if (npuUtilization > 50) {
                    console.log('○ Good NPU utilization - consider optimizing task types');
                }
                else {
                    console.log('△ Low NPU utilization - tasks may be CPU-bound');
                }
            }
            else {
                console.log('\n=== CPU Fallback Mode ===');
                console.log('NPU not available - all processing done on CPU');
                console.log('For optimal performance, ensure NPU drivers are installed');
            }
        }
        printSeparator('Module Performance Breakdown');
        // Display module-specific information
        if (diagnostics.details.hub.modules) {
            diagnostics.details.hub.modules.forEach((moduleInfo) => {
                console.log(`\n${moduleInfo.name}:`);
                console.log(`  Status: ${moduleInfo.status.initialized ? 'Initialized' : 'Not Initialized'}`);
                console.log(`  NPU Support: ${moduleInfo.status.npuEnabled ? 'Enabled' : 'Disabled'}`);
                console.log(`  Health: ${moduleInfo.status.health}`);
                console.log(`  Tasks Processed: ${moduleInfo.stats.totalTasksProcessed}`);
                console.log(`  Success Rate: ${moduleInfo.stats.totalTasksProcessed > 0 ?
                    ((moduleInfo.stats.successfulTasks / moduleInfo.stats.totalTasksProcessed) * 100).toFixed(1) : '0'}%`);
                console.log(`  Avg Processing Time: ${moduleInfo.stats.averageProcessingTime.toFixed(2)} ms`);
                // Module specialization description
                console.log('  Specialization: ');
                switch (moduleInfo.type) {
                    case IModule_1.ModuleType.MEMORY:
                        console.log('Data storage, retrieval, and memory optimization');
                        break;
                    case IModule_1.ModuleType.DECISION_MAKING:
                        console.log('AI inference, risk analysis, and decision logic');
                        break;
                    case IModule_1.ModuleType.SENSORY_PROCESSING:
                        console.log('Pattern recognition, signal processing, and sensor fusion');
                        break;
                    default:
                        console.log('General cognitive processing');
                }
            });
        }
        printSeparator('Use Case Scenarios');
        console.log('This BCVPU system can be applied to:\n');
        console.log('🏭 Industrial Applications:');
        console.log('  • Real-time quality control with visual inspection');
        console.log('  • Predictive maintenance using sensor data');
        console.log('  • Automated decision-making in manufacturing\n');
        console.log('🚗 Autonomous Systems:');
        console.log('  • Multi-sensor fusion for environment perception');
        console.log('  • Real-time path planning and obstacle avoidance');
        console.log('  • Adaptive behavior based on learned patterns\n');
        console.log('🏥 Healthcare Applications:');
        console.log('  • Medical image analysis and diagnosis assistance');
        console.log('  • Patient monitoring with multi-modal sensors');
        console.log('  • Treatment recommendation systems\n');
        console.log('💰 Financial Services:');
        console.log('  • Risk assessment and fraud detection');
        console.log('  • Algorithmic trading with real-time analysis');
        console.log('  • Portfolio optimization and management');
        printSeparator('Advanced Features Demo');
        // Demonstrate advanced features
        await demonstrateAdvancedFeatures(core);
        printSeparator('Cleanup and Shutdown');
        // Stop and cleanup system
        await core.stop();
        await core.cleanup();
        console.log('BCVPU system successfully shut down');
        console.log('Example completed successfully!');
        printSeparator('Summary');
        console.log('This example demonstrated:');
        console.log('✓ BCVPU system initialization and configuration');
        console.log('✓ Event-driven architecture with TypeScript');
        console.log('✓ Multi-module task processing');
        console.log('✓ Intel NPU acceleration integration');
        console.log('✓ Real-time performance monitoring');
        console.log('✓ Comprehensive diagnostics and health checking');
        console.log('✓ Proper resource management and cleanup');
        console.log('\nFor more advanced examples, see the examples/ directory');
        printSeparator();
    }
    catch (error) {
        console.error('Error in BCVPU example:', error);
        process.exit(1);
    }
}
function setupEventListeners(core) {
    // System events
    core.on('initialized', () => {
        console.log('🚀 BCVPU system initialized successfully');
    });
    core.on('started', () => {
        console.log('▶️  BCVPU system started and ready for tasks');
    });
    core.on('taskSubmitted', (task) => {
        console.log(`📝 Task submitted: ${task.id} -> ${task.targetModule}`);
    });
    core.on('taskCompleted', (task) => {
        console.log(`✅ Task completed: ${task.id} (${task.processingTimeMs}ms)`);
    });
    core.on('taskFailed', (task, error) => {
        console.log(`❌ Task failed: ${task.id} - ${error}`);
    });
    core.on('allTasksProcessed', () => {
        console.log('🎯 All tasks in queue have been processed');
    });
    // Module events
    core.on('moduleTaskStarted', (module, task) => {
        console.log(`🔄 Module ${module.name} started processing task ${task.id}`);
    });
    core.on('moduleTaskCompleted', (module, task) => {
        console.log(`✨ Module ${module.name} completed task ${task.id}`);
    });
}
async function demonstrateAdvancedFeatures(core) {
    console.log('Demonstrating advanced BCVPU features...\n');
    // 1. Real-time diagnostics
    console.log('🔍 Running real-time system diagnostics...');
    const diagnostics = await core.runDiagnostics();
    console.log(`Overall System Health: ${diagnostics.overall}`);
    console.log(`Active Modules: ${diagnostics.details.hub.totalModules}`);
    console.log(`Memory Usage: ${diagnostics.details.system.memoryUsage.heapUsed} MB`);
    // 2. NPU availability check
    console.log('\n⚡ Checking NPU availability...');
    const npuAvailable = await core.checkNPUAvailability();
    console.log(`NPU Status: ${npuAvailable ? 'Available and Ready' : 'Not Available'}`);
    // 3. Dynamic task submission with different priorities
    console.log('\n🎯 Submitting priority tasks...');
    const priorityTasks = [
        createTask('priority-001', IModule_1.ModuleType.DECISION_MAKING, 'Emergency decision required', { priority: 'high' }),
        createTask('priority-002', IModule_1.ModuleType.SENSORY_PROCESSING, 'Critical sensor analysis', { priority: 'urgent' })
    ];
    for (const task of priorityTasks) {
        await core.submitTask(task);
    }
    await core.processAllTasks();
    // 4. Performance monitoring
    console.log('\n📊 Final performance summary:');
    const finalStats = core.getStatistics();
    console.log(`Total throughput: ${(finalStats.totalTasksProcessed / (finalStats.systemUptimeMs / 1000)).toFixed(2)} tasks/second`);
    console.log('\nAdvanced features demonstration complete!');
}
// Run the example
if (require.main === module) {
    main().catch(error => {
        console.error('Unhandled error:', error);
        process.exit(1);
    });
}
