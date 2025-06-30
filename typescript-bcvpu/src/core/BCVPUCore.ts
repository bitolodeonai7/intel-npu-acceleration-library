/*
 * Copyright © 2024 Intel Corporation
 * SPDX-License-Identifier: Apache 2.0
 */

import { v4 as uuidv4 } from 'uuid';
import { 
    IBCVPUCore, 
    BCVPUCoreStatus, 
    BCVPUCoreConfig, 
    ProcessingResult, 
    SystemMetrics, 
    BCVPUCoreHealthStatus 
} from '../interfaces/IBCVPUCore';
import { IModule, ModuleType, Task } from '../interfaces/IModule';
import { INPUAccelerator } from '../interfaces/INPUAccelerator';

/**
 * BCVPU Core implementation
 * Central orchestrator for the Brain Computing Virtual Processing Unit
 */
export class BCVPUCore implements IBCVPUCore {
    private _status: BCVPUCoreStatus = BCVPUCoreStatus.UNINITIALIZED;
    private _config!: BCVPUCoreConfig;
    private _registeredModules: Map<string, IModule> = new Map();
    private _npuAccelerator?: INPUAccelerator | undefined;
    private _taskCounter: number = 0;
    private _tasksProcessed: number = 0;
    private _startTime: Date = new Date();
    private _errors: string[] = [];

    public get status(): BCVPUCoreStatus {
        return this._status;
    }

    public get config(): BCVPUCoreConfig {
        return { ...this._config };
    }

    public get registeredModules(): ReadonlyMap<string, IModule> {
        return new Map(this._registeredModules);
    }

    public async initialize(config: BCVPUCoreConfig): Promise<void> {
        try {
            this._status = BCVPUCoreStatus.INITIALIZING;
            this._config = { ...config };
            this._startTime = new Date();
            this._errors = [];

            console.log('[BCVPU Core] Initializing Brain Computing Virtual Processing Unit...');

            // Initialize NPU if enabled
            if (config.enableNPU) {
                try {
                    const { NPUAccelerator } = await import('../acceleration/NPUAccelerator');
                    this._npuAccelerator = new NPUAccelerator();
                    const npuStatus = await this._npuAccelerator.initialize();
                    
                    if (npuStatus === 'success' || npuStatus === 'not-available') {
                        if (this._npuAccelerator.isAvailable()) {
                            console.log('[BCVPU Core] Intel NPU detected and available');
                        } else {
                            console.log('[BCVPU Core] Intel NPU not available, falling back to CPU');
                        }
                    } else {
                        console.warn('[BCVPU Core] NPU initialization failed, using CPU fallback');
                    }
                } catch (error) {
                    console.warn(`[BCVPU Core] NPU initialization error: ${error}`);
                }
            }

            this._status = BCVPUCoreStatus.READY;
            console.log('[BCVPU Core] Initialization complete');

        } catch (error) {
            this._status = BCVPUCoreStatus.ERROR;
            const errorMsg = `Core initialization failed: ${error}`;
            this._errors.push(errorMsg);
            console.error(`[BCVPU Core] ${errorMsg}`);
            throw error;
        }
    }

    public async registerModule(module: IModule): Promise<void> {
        try {
            if (this._status === BCVPUCoreStatus.UNINITIALIZED) {
                throw new Error('Core not initialized');
            }

            if (this._registeredModules.has(module.id)) {
                throw new Error(`Module with ID ${module.id} already registered`);
            }

            // Initialize the module if it's not already initialized
            if (module.status === 'idle' || module.status === 'error') {
                await module.initialize();
            }

            this._registeredModules.set(module.id, module);
            console.log(`[BCVPU Core] Registered module: ${module.name} (${module.type})`);

        } catch (error) {
            const errorMsg = `Module registration failed: ${error}`;
            this._errors.push(errorMsg);
            console.error(`[BCVPU Core] ${errorMsg}`);
            throw error;
        }
    }

    public async unregisterModule(moduleId: string): Promise<void> {
        try {
            const module = this._registeredModules.get(moduleId);
            if (!module) {
                throw new Error(`Module with ID ${moduleId} not found`);
            }

            await module.cleanup();
            this._registeredModules.delete(moduleId);
            console.log(`[BCVPU Core] Unregistered module: ${module.name}`);

        } catch (error) {
            const errorMsg = `Module unregistration failed: ${error}`;
            this._errors.push(errorMsg);
            console.error(`[BCVPU Core] ${errorMsg}`);
            throw error;
        }
    }

    public async start(): Promise<void> {
        try {
            if (this._status !== BCVPUCoreStatus.READY) {
                throw new Error(`Core not ready for start (status: ${this._status})`);
            }

            console.log(`[BCVPU Core] Starting BCVPU with ${this._registeredModules.size} registered modules`);

            // Verify all modules are ready
            for (const module of this._registeredModules.values()) {
                if (module.status === 'error') {
                    throw new Error(`Module ${module.name} is in error state`);
                }
            }

            console.log('[BCVPU Core] All modules synchronized and operational');

        } catch (error) {
            this._status = BCVPUCoreStatus.ERROR;
            const errorMsg = `Core start failed: ${error}`;
            this._errors.push(errorMsg);
            console.error(`[BCVPU Core] ${errorMsg}`);
            throw error;
        }
    }

    public async processTask(task: Task, targetModuleType: ModuleType): Promise<ProcessingResult> {
        const startTime = Date.now();
        const executionId = uuidv4();

        try {
            if (this._status !== BCVPUCoreStatus.READY) {
                throw new Error('Core not ready for processing');
            }

            // Find target module
            const targetModule = this.findModuleByType(targetModuleType);
            if (!targetModule) {
                throw new Error(`No module found for type: ${targetModuleType}`);
            }

            this._status = BCVPUCoreStatus.PROCESSING;
            this._taskCounter++;

            const taskWithId: Task = {
                ...task,
                taskId: executionId
            };

            console.log(`[BCVPU Core] Processing task ${this._taskCounter}: ${task.taskName} -> ${targetModule.name}`);

            const result = await targetModule.processTask(taskWithId);
            
            this._tasksProcessed++;
            this._status = BCVPUCoreStatus.READY;

            const executionTime = Date.now() - startTime;
            console.log(`[BCVPU Core] Task ${this._taskCounter} completed successfully in ${executionTime}ms`);

            return {
                success: true,
                result,
                executionTime,
                modulesUsed: [targetModule.name]
            };

        } catch (error) {
            const executionTime = Date.now() - startTime;
            const errorMsg = `Task processing failed: ${error}`;
            this._errors.push(errorMsg);
            console.error(`[BCVPU Core] ${errorMsg}`);

            // Reset status to ready to allow subsequent tasks
            this._status = BCVPUCoreStatus.READY;

            return {
                success: false,
                error: errorMsg,
                executionTime,
                modulesUsed: []
            };
        }
    }

    public async processTaskPipeline(task: Task, moduleTypes: ModuleType[]): Promise<ProcessingResult> {
        const startTime = Date.now();
        const modulesUsed: string[] = [];

        try {
            if (this._status !== BCVPUCoreStatus.READY) {
                throw new Error('Core not ready for processing');
            }

            console.log(`[BCVPU Core] Processing task pipeline: ${task.taskName} through ${moduleTypes.length} modules`);

            let currentResult = task.inputData;
            
            for (const moduleType of moduleTypes) {
                const module = this.findModuleByType(moduleType);
                if (!module) {
                    throw new Error(`No module found for type: ${moduleType}`);
                }

                const pipelineTask: Task = {
                    ...task,
                    taskId: uuidv4(),
                    inputData: currentResult
                };

                console.log(`[BCVPU Core] Pipeline step: ${module.name}`);
                currentResult = await module.processTask(pipelineTask);
                modulesUsed.push(module.name);
            }

            this._tasksProcessed++;
            const executionTime = Date.now() - startTime;

            console.log(`[BCVPU Core] Pipeline completed successfully in ${executionTime}ms`);

            return {
                success: true,
                result: currentResult,
                executionTime,
                modulesUsed
            };

        } catch (error) {
            const executionTime = Date.now() - startTime;
            const errorMsg = `Pipeline processing failed: ${error}`;
            this._errors.push(errorMsg);
            console.error(`[BCVPU Core] ${errorMsg}`);

            return {
                success: false,
                error: errorMsg,
                executionTime,
                modulesUsed
            };
        }
    }

    public async synchronize(): Promise<void> {
        try {
            console.log('[BCVPU Core] Synchronizing all modules...');

            let readyModules = 0;
            for (const module of this._registeredModules.values()) {
                if (module.status === 'idle' || module.status === 'complete') {
                    readyModules++;
                }
            }

            console.log(`[BCVPU Core] Synchronization complete: ${readyModules}/${this._registeredModules.size} modules ready`);

            if (readyModules === this._registeredModules.size) {
                this._status = BCVPUCoreStatus.READY;
            }

        } catch (error) {
            const errorMsg = `Synchronization failed: ${error}`;
            this._errors.push(errorMsg);
            console.error(`[BCVPU Core] ${errorMsg}`);
            throw error;
        }
    }

    public getSystemMetrics(): SystemMetrics {
        const now = new Date();
        const uptime = (now.getTime() - this._startTime.getTime()) / 1000; // seconds

        // Get memory usage
        const memoryUsage = process.memoryUsage();
        const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

        // Calculate task throughput (tasks per minute)
        const taskThroughput = uptime > 0 ? (this._tasksProcessed / uptime) * 60 : 0;

        const npuUsage = this._npuAccelerator?.isAvailable() ? this.calculateNPUUsage() : undefined;

        return {
            cpuUsage: this.calculateCPUUsage(),
            memoryUsage: memoryUsagePercent,
            npuUsage,
            taskThroughput,
            uptime
        };
    }

    public getHealthStatus(): BCVPUCoreHealthStatus {
        const systemMetrics = this.getSystemMetrics();
        const activeModules = Array.from(this._registeredModules.values())
            .filter(module => module.status !== 'error').length;

        return {
            healthy: this._status !== BCVPUCoreStatus.ERROR && this._errors.length < 10,
            status: this._status,
            uptime: systemMetrics.uptime,
            tasksProcessed: this._tasksProcessed,
            activeModules,
            systemMetrics,
            errors: [...this._errors.slice(-10)] // Last 10 errors
        };
    }

    public async shutdown(): Promise<void> {
        try {
            console.log('[BCVPU Core] Shutting down...');
            this._status = BCVPUCoreStatus.SHUTDOWN;

            // Cleanup all modules
            for (const module of this._registeredModules.values()) {
                try {
                    await module.cleanup();
                } catch (error) {
                    console.warn(`[BCVPU Core] Error cleaning up module ${module.name}: ${error}`);
                }
            }

            // Cleanup NPU accelerator
            if (this._npuAccelerator) {
                await this._npuAccelerator.cleanup();
            }

            this._registeredModules.clear();
            console.log('[BCVPU Core] Shutdown complete');

        } catch (error) {
            const errorMsg = `Shutdown failed: ${error}`;
            this._errors.push(errorMsg);
            console.error(`[BCVPU Core] ${errorMsg}`);
            throw error;
        }
    }

    public printInfo(): void {
        console.log('\n=== BCVPU Core Information ===');
        console.log(`Status: ${this._status}`);
        console.log(`Registered Modules: ${this._registeredModules.size}/8`);
        console.log(`Tasks Processed: ${this._tasksProcessed}`);
        console.log(`NPU Enabled: ${this._config.enableNPU ? 'Yes' : 'No'}`);
        console.log(`NPU Available: ${this._npuAccelerator?.isAvailable() ? 'Yes' : 'No'}`);
        console.log(`Profiling Enabled: ${this._config.enableProfiling ? 'Yes' : 'No'}`);
        console.log(`Max Concurrent Tasks: ${this._config.maxConcurrentTasks}`);
        console.log(`Cache Directory: ${this._config.cacheDirectory}`);

        console.log('\nRegistered Modules:');
        let index = 1;
        for (const module of this._registeredModules.values()) {
            console.log(`  ${index}. ${module.name} (${module.type}) - Status: ${module.status}, NPU: ${module.npuAvailable ? 'Available' : 'Not Available'}`);
            index++;
        }

        const metrics = this.getSystemMetrics();
        console.log('\nSystem Metrics:');
        console.log(`  CPU Usage: ${metrics.cpuUsage.toFixed(1)}%`);
        console.log(`  Memory Usage: ${metrics.memoryUsage.toFixed(1)}%`);
        if (metrics.npuUsage !== undefined) {
            console.log(`  NPU Usage: ${metrics.npuUsage.toFixed(1)}%`);
        }
        console.log(`  Task Throughput: ${metrics.taskThroughput.toFixed(2)} tasks/min`);
        console.log(`  Uptime: ${metrics.uptime.toFixed(1)}s`);
        console.log('==============================\n');
    }

    // Private helper methods

    private findModuleByType(moduleType: ModuleType): IModule | undefined {
        for (const module of this._registeredModules.values()) {
            if (module.type === moduleType) {
                return module;
            }
        }
        return undefined;
    }

    private calculateCPUUsage(): number {
        // Simplified CPU usage calculation
        // In a real implementation, this would use system monitoring
        return 15 + Math.random() * 20; // Simulated 15-35% usage
    }

    private calculateNPUUsage(): number {
        // Simplified NPU usage calculation
        // In a real implementation, this would query NPU metrics
        return this._status === BCVPUCoreStatus.PROCESSING ? 
            60 + Math.random() * 30 : // 60-90% when processing
            5 + Math.random() * 10;   // 5-15% when idle
    }

    // Public factory method
    public static async create(config: BCVPUCoreConfig): Promise<BCVPUCore> {
        const core = new BCVPUCore();
        await core.initialize(config);
        return core;
    }
}