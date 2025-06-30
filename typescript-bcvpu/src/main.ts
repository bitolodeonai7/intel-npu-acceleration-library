/*
 * Copyright © 2024 Intel Corporation
 * SPDX-License-Identifier: Apache 2.0
 */

import { CentralHub } from './core/CentralHub';
import { ModuleType } from './interfaces/IModule';

/**
 * Helper function to create and process a task
 */
async function createAndProcessTask(
    hub: CentralHub, 
    taskName: string, 
    moduleType: ModuleType, 
    inputData?: any
): Promise<void> {
    try {
        const result = await hub.processTask(taskName, moduleType, inputData);
        console.log(`Task Result: ${JSON.stringify(result.result, null, 2)}\n`);
    } catch (error) {
        console.error(`Task Failed: ${error}\n`);
    }
}

/**
 * Main demonstration program
 */
async function main(): Promise<void> {
    console.log('=== BCVPU (Brain Computing Virtual Processing Unit) TypeScript Demo ===\n');

    let hub: CentralHub | undefined;

    try {
        // Initialize BCVPU system
        console.log('Initializing BCVPU system...');
        hub = await CentralHub.createCompleteSystem({
            enableNPU: true,
            enableProfiling: false,
            maxConcurrentTasks: 4,
            cacheDirectory: 'cache',
            logLevel: 'info'
        });

        // Print system information
        hub.printSystemInfo();

        console.log('=== Demonstration of BCVPU Modular Architecture ===\n');

        // Memory Module Demonstration
        console.log('--- Memory Module Demonstration ---');
        
        await createAndProcessTask(hub, 'Store new information', ModuleType.MEMORY, {
            key: 'user_data',
            data: {
                name: 'John Doe',
                age: 30,
                preferences: ['AI', 'Technology', 'Innovation'],
                timestamp: new Date().toISOString()
            }
        });

        await createAndProcessTask(hub, 'Retrieve stored information', ModuleType.MEMORY, {
            key: 'user_data'
        });

        await createAndProcessTask(hub, 'Search data', ModuleType.MEMORY, {
            query: 'user'
        });

        // Decision-Making Module Demonstration
        console.log('--- Decision-Making Module Demonstration ---');
        
        await createAndProcessTask(hub, 'Make a choice', ModuleType.DECISION_MAKING, {
            features: [0.8, 0.3, 0.9, 0.2, 0.7],
            threshold: 0.5
        });

        await createAndProcessTask(hub, 'Classify input', ModuleType.DECISION_MAKING, {
            data: {
                temperature: 25.5,
                humidity: 60,
                pressure: 1013.25,
                wind_speed: 5.2
            }
        });

        await createAndProcessTask(hub, 'Make prediction', ModuleType.DECISION_MAKING, {
            sequence: [10, 12, 15, 18, 22, 25, 28, 30, 32, 35]
        });

        // Sensory Processing Module Demonstration
        console.log('--- Sensory Processing Module Demonstration ---');

        // Visual processing
        const imageData = Array.from({ length: 224 * 224 * 3 }, (_, i) => (i % 256) / 255.0);
        await createAndProcessTask(hub, 'Process visual input', ModuleType.SENSORY_PROCESSING, {
            imageData
        });

        // Audio processing
        const audioData = Array.from({ length: 1024 }, (_, i) => Math.sin(i * 0.01));
        await createAndProcessTask(hub, 'Process audio input', ModuleType.SENSORY_PROCESSING, {
            audioData
        });

        // Text processing
        await createAndProcessTask(hub, 'Process text input', ModuleType.SENSORY_PROCESSING, {
            text: 'The Brain Computing Virtual Processing Unit (BCVPU) represents a revolutionary approach to artificial intelligence architecture.'
        });

        // Feature extraction
        await createAndProcessTask(hub, 'Extract features', ModuleType.SENSORY_PROCESSING, {
            data: [1.5, 2.3, 0.8, 4.1, 3.2, 1.9, 2.7, 3.8, 1.1, 2.9]
        });

        // Demonstrate task pipeline
        console.log('--- Task Pipeline Demonstration ---');
        console.log('Processing a complex cognitive task through multiple modules...');

        const pipelineResult = await hub.processTaskPipeline(
            'Complex cognitive processing',
            [ModuleType.SENSORY_PROCESSING, ModuleType.DECISION_MAKING, ModuleType.MEMORY],
            {
                sensoryInput: {
                    text: 'Analyze this important information and make a decision',
                    metadata: { priority: 'high', source: 'user_input' }
                }
            }
        );

        console.log(`Pipeline Result: ${JSON.stringify(pipelineResult, null, 2)}\n`);

        // NPU Integration Demonstration
        console.log('--- NPU Integration Demonstration ---');
        const npuAccelerator = hub.getNPUAccelerator();
        
        if (npuAccelerator && npuAccelerator.isAvailable()) {
            console.log('Demonstrating direct NPU operations...');

            // Create test tensors for matrix multiplication
            const tensorA = await npuAccelerator.createTensor([128, 256], 'float32');
            const tensorB = await npuAccelerator.createTensor([256, 512], 'float32');

            // Initialize with random data
            for (let i = 0; i < tensorA.data.length; i++) {
                tensorA.data[i] = Math.random();
            }
            for (let i = 0; i < tensorB.data.length; i++) {
                tensorB.data[i] = Math.random();
            }

            const matmulResult = await npuAccelerator.matrixMultiply(tensorA, tensorB);
            console.log(`Matrix multiplication result: Success=${matmulResult.success}, Time=${matmulResult.executionTime}ms`);

            if (matmulResult.profileData) {
                console.log(`Profiling Data:`, matmulResult.profileData);
            }
        } else {
            console.log('NPU not available for direct testing');
        }

        // Final synchronization
        console.log('--- Final Synchronization ---');
        await hub.synchronize();

        // System health check
        console.log('--- System Health Check ---');
        const health = hub.getSystemHealth();
        console.log('System Health Status:');
        console.log(`Core: ${health.core.healthy ? 'Healthy' : 'Unhealthy'} - ${health.core.status}`);
        console.log(`Tasks Processed: ${health.core.tasksProcessed}`);
        console.log(`Active Modules: ${health.core.activeModules}`);
        
        for (const [moduleType, moduleHealth] of Object.entries(health.modules)) {
            console.log(`${moduleType}: ${moduleHealth.healthy ? 'Healthy' : 'Unhealthy'} - ${moduleHealth.tasksProcessed} tasks processed`);
        }

        if (health.npu) {
            console.log(`NPU: ${health.npu.available ? 'Available' : 'Not Available'} - ${health.npu.deviceInfo.deviceName}`);
        }

        // Final system info
        hub.printSystemInfo();

        console.log('=== BCVPU Demo Completed Successfully ===');
        console.log('\nKey Features Demonstrated:');
        console.log('✓ Modular cognitive architecture with Memory, Decision-Making, and Sensory Processing modules');
        console.log('✓ NPU integration with fallback to CPU when NPU is not available');
        console.log('✓ Task-based processing pipeline with multiple module coordination');
        console.log('✓ Advanced module capabilities (compression, search, AI inference, pattern recognition)');
        console.log('✓ System health monitoring and performance metrics');
        console.log('✓ Extensible architecture for adding new cognitive modules');
        console.log('✓ TypeScript implementation with strong typing and modern async/await patterns');

    } catch (error) {
        console.error(`Demo failed: ${error}`);
        console.error(error);
        process.exit(1);
    } finally {
        // Cleanup
        if (hub) {
            await hub.shutdown();
        }
    }
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Run the demo
if (require.main === module) {
    main().then(() => {
        console.log('\nDemo completed successfully');
        process.exit(0);
    }).catch((error) => {
        console.error('\nDemo failed:', error);
        process.exit(1);
    });
}

export { main };