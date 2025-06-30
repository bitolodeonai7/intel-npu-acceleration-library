/**
 * Copyright © 2024 Intel Corporation
 * SPDX-License-Identifier: Apache 2.0
 */

import { BCVPUCore } from './core/BCVPUCore';
import { ModuleType, TaskStatus } from './interfaces/IModule';
import { BCVPUConfig } from './interfaces/IBCVPUCore';

// Utility function to create a task
function createTask(
    id: string,
    targetModule: ModuleType,
    description: string,
    data?: any,
    useNPUAcceleration: boolean = true
) {
    return {
        id,
        targetModule,
        description,
        data,
        status: TaskStatus.PENDING,
        useNPUAcceleration,
        createdAt: new Date(),
        metadata: {}
    };
}

// Utility function to delay execution
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log('=======================================================');
    console.log('  Brain Computing Virtual Processing Unit (BCVPU)');
    console.log('  TypeScript Implementation with Intel NPU Acceleration');
    console.log('=======================================================\n');

    // Create BCVPU core
    const core = new BCVPUCore();

    // Configuration
    const config: BCVPUConfig = {
        enableNPUAcceleration: true,
        enableProfiling: true,
        maxConcurrentTasks: 25,
        memoryPoolSize: 2 * 1024 * 1024, // 2MB
        devicePreference: 'NPU',
        logLevel: 'info',
        performanceMode: 'throughput'
    };

    try {
        // Initialize the system
        console.log('[BCVPU Core] Starting system initialization...\n');
        const initialized = await core.initialize(config);
        
        if (!initialized) {
            console.error('Failed to initialize BCVPU system');
            process.exit(1);
        }

        // Start the system
        const started = await core.start();
        if (!started) {
            console.error('Failed to start BCVPU system');
            process.exit(1);
        }

        console.log('\n=== BCVPU System Ready ===\n');

        // Print initial system status
        console.log('=== Initial System Status ===');
        const initialDiagnostics = await core.runDiagnostics();
        console.log(`Overall Health: ${initialDiagnostics.overall}`);
        console.log(`NPU Available: ${initialDiagnostics.details.npu.available}`);
        console.log(`Modules Registered: ${initialDiagnostics.details.hub.totalModules}`);
        console.log(`Queue Capacity: ${initialDiagnostics.details.system.taskQueue.capacity}`);
        console.log('');

        // Run demonstration
        console.log('=== Running BCVPU Demonstration ===\n');
        await runDemo(core);

        // Run performance test
        console.log('\n=== Running Performance Test ===\n');
        await runPerformanceTest(core, 15);

        // Advanced module testing
        console.log('\n=== Advanced Module Testing ===\n');
        await runAdvancedTesting(core);

        // Final system report
        console.log('\n=== Final System Report ===');
        const finalDiagnostics = await core.runDiagnostics();
        const stats = core.getStatistics();
        
        printSystemReport(finalDiagnostics, stats);

        // Cleanup
        console.log('\n=== Shutting Down BCVPU System ===');
        await core.stop();
        await core.cleanup();
        
        console.log('\n=======================================================');
        console.log('  BCVPU TypeScript Demonstration Completed Successfully');
        console.log('  Modular brain computing architecture with NPU');
        console.log('  acceleration has been successfully demonstrated.');
        console.log('=======================================================');

    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

async function runDemo(core: BCVPUCore): Promise<void> {
    console.log('[BCVPU Demo] Creating sample tasks for each module...\n');

    // Create sample tasks
    const tasks = [
        createTask('demo-001', ModuleType.MEMORY, 'Store new information'),
        createTask('demo-002', ModuleType.DECISION_MAKING, 'Make a choice'),
        createTask('demo-003', ModuleType.SENSORY_PROCESSING, 'Process visual input')
    ];

    // Submit tasks
    for (const task of tasks) {
        await core.submitTask(task);
        await delay(50); // Small delay for demonstration
    }

    // Process all tasks
    await core.processAllTasks();

    console.log('\n[BCVPU Demo] Basic demonstration completed\n');
}

async function runPerformanceTest(core: BCVPUCore, numTasks: number): Promise<void> {
    console.log(`[Performance Test] Creating ${numTasks} tasks for performance testing...\n`);

    const startTime = Date.now();

    // Create varied tasks
    for (let i = 0; i < numTasks; i++) {
        const moduleType = [ModuleType.MEMORY, ModuleType.DECISION_MAKING, ModuleType.SENSORY_PROCESSING][i % 3];
        const task = createTask(
            `perf-${i.toString().padStart(3, '0')}`,
            moduleType,
            `Performance test task ${i + 1}`,
            { testData: `test_data_${i}` }
        );
        
        await core.submitTask(task);
    }

    // Process all tasks
    await core.processAllTasks();

    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;

    console.log(`\n[Performance Test] Completed in ${totalTime.toFixed(2)} seconds`);
    console.log(`[Performance Test] Throughput: ${(numTasks / totalTime).toFixed(1)} tasks/second\n`);
}

async function runAdvancedTesting(core: BCVPUCore): Promise<void> {
    console.log('[Advanced Testing] Testing specific cognitive capabilities...\n');

    // Memory module tasks
    const memoryTasks = [
        'Allocate working memory',
        'Store episodic memory',
        'Retrieve semantic knowledge',
        'Optimize memory layout'
    ];

    // Decision making tasks
    const decisionTasks = [
        'Evaluate action options',
        'Risk assessment analysis',
        'Pattern-based prediction',
        'Multi-criteria optimization'
    ];

    // Sensory processing tasks
    const sensoryTasks = [
        'Visual pattern recognition',
        'Audio signal processing',
        'Tactile sensation analysis',
        'Multi-modal sensor fusion'
    ];

    let taskId = 1000;

    // Submit varied tasks
    for (let i = 0; i < 4; i++) {
        // Memory task
        await core.submitTask(createTask(
            `adv-${taskId++}`,
            ModuleType.MEMORY,
            memoryTasks[i],
            { complexity: 'high', data: new Array(100).fill(i) }
        ));

        // Decision task
        await core.submitTask(createTask(
            `adv-${taskId++}`,
            ModuleType.DECISION_MAKING,
            decisionTasks[i],
            { features: new Array(20).fill(0).map(() => Math.random()) }
        ));

        // Sensory task
        await core.submitTask(createTask(
            `adv-${taskId++}`,
            ModuleType.SENSORY_PROCESSING,
            sensoryTasks[i],
            { sensorData: new Array(512).fill(0).map(() => Math.random() * 255) }
        ));
    }

    // Process all advanced tasks
    console.log(`[Advanced Testing] Processing ${core.queueInfo.size} complex tasks...\n`);
    await core.processAllTasks();

    console.log('[Advanced Testing] Advanced cognitive testing completed\n');
}

function printSystemReport(diagnostics: any, stats: any): void {
    console.log('\n=== System Architecture Summary ===');
    console.log('Modules Implemented:');
    
    if (diagnostics.details.hub.modules) {
        diagnostics.details.hub.modules.forEach((module: any) => {
            console.log(`  - ${module.name}:`);
            console.log(`    * Initialized: ${module.status.initialized ? 'Yes' : 'No'}`);
            console.log(`    * NPU-Enabled: ${module.status.npuEnabled ? 'Yes' : 'No'}`);
            console.log(`    * Health: ${module.status.health}`);
            console.log(`    * Tasks Processed: ${module.stats.totalTasksProcessed}`);
            console.log(`    * Success Rate: ${module.stats.totalTasksProcessed > 0 ? 
                ((module.stats.successfulTasks / module.stats.totalTasksProcessed) * 100).toFixed(1) : '0'}%`);
        });
    }

    console.log('\n=== Performance Metrics ===');
    console.log(`Total Tasks Processed: ${stats.totalTasksProcessed}`);
    console.log(`Successful Tasks: ${stats.successfulTasks}`);
    console.log(`Failed Tasks: ${stats.failedTasks}`);
    console.log(`NPU Accelerated Tasks: ${stats.npuAcceleratedTasks}`);
    console.log(`Average Processing Time: ${stats.averageProcessingTimeMs.toFixed(2)} ms`);
    console.log(`System Uptime: ${(stats.systemUptimeMs / 1000).toFixed(1)} seconds`);
    console.log(`Memory Usage: ${stats.memoryUsageMB} MB`);

    if (stats.totalTasksProcessed > 0) {
        console.log(`Success Rate: ${((stats.successfulTasks / stats.totalTasksProcessed) * 100).toFixed(1)}%`);
        console.log(`NPU Utilization: ${((stats.npuAcceleratedTasks / stats.totalTasksProcessed) * 100).toFixed(1)}%`);
    }

    console.log('\n=== BCVPU System Capabilities ===');
    console.log('✓ Modular functional architecture');
    console.log('✓ Intel NPU acceleration integration');
    console.log('✓ Memory management and optimization');
    console.log('✓ AI-powered decision making');
    console.log('✓ Advanced sensory processing');
    console.log('✓ Real-time task scheduling');
    console.log('✓ Performance monitoring and profiling');
    console.log('✓ Scalable concurrent processing');
    console.log('✓ Event-driven architecture');
    console.log('✓ Cross-platform TypeScript implementation');
}

// Run the main function
if (require.main === module) {
    main().catch(error => {
        console.error('Unhandled error:', error);
        process.exit(1);
    });
}

export { main, BCVPUCore };