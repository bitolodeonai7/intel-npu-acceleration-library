/*
 * Copyright © 2024 Intel Corporation
 * SPDX-License-Identifier: Apache 2.0
 */

import { BCVPUCore } from './BCVPUCore';
import { MemoryModule } from '../modules/MemoryModule';
import { DecisionMakingModule } from '../modules/DecisionMakingModule';
import { SensoryProcessingModule } from '../modules/SensoryProcessingModule';
import { NPUAccelerator } from '../acceleration/NPUAccelerator';
import { BCVPUCoreConfig } from '../interfaces/IBCVPUCore';
import { IModule, ModuleType } from '../interfaces/IModule';

/**
 * Central Hub for managing BCVPU architecture
 * Provides high-level interface for creating and managing the entire system
 */
export class CentralHub {
    private bcvpuCore?: BCVPUCore;
    private npuAccelerator?: NPUAccelerator;
    private modules: Map<ModuleType, IModule> = new Map();

    /**
     * Initialize the BCVPU system with default configuration
     */
    public async initialize(customConfig?: Partial<BCVPUCoreConfig>): Promise<void> {
        console.log('[Central Hub] Initializing BCVPU system...');

        // Create default configuration
        const defaultConfig: BCVPUCoreConfig = {
            enableNPU: true,
            enableProfiling: false,
            maxConcurrentTasks: 4,
            cacheDirectory: 'cache',
            logLevel: 'info'
        };

        const config = { ...defaultConfig, ...customConfig };

        // Initialize NPU accelerator
        if (config.enableNPU) {
            this.npuAccelerator = new NPUAccelerator();
            await this.npuAccelerator.initialize();
        }

        // Initialize BCVPU Core
        this.bcvpuCore = await BCVPUCore.create(config);

        console.log('[Central Hub] BCVPU system initialized successfully');
    }

    /**
     * Register all cognitive modules
     */
    public async registerAllModules(): Promise<void> {
        if (!this.bcvpuCore) {
            throw new Error('BCVPU Core not initialized');
        }

        console.log('[Central Hub] Registering all cognitive modules...');

        // Create and register Memory Module
        const memoryModule = new MemoryModule(this.npuAccelerator);
        await this.bcvpuCore.registerModule(memoryModule);
        this.modules.set(ModuleType.MEMORY, memoryModule);

        // Create and register Decision-Making Module
        const decisionModule = new DecisionMakingModule(this.npuAccelerator);
        await this.bcvpuCore.registerModule(decisionModule);
        this.modules.set(ModuleType.DECISION_MAKING, decisionModule);

        // Create and register Sensory Processing Module
        const sensoryModule = new SensoryProcessingModule(this.npuAccelerator);
        await this.bcvpuCore.registerModule(sensoryModule);
        this.modules.set(ModuleType.SENSORY_PROCESSING, sensoryModule);

        console.log('[Central Hub] All cognitive modules registered successfully');
    }

    /**
     * Start the BCVPU system
     */
    public async start(): Promise<void> {
        if (!this.bcvpuCore) {
            throw new Error('BCVPU Core not initialized');
        }

        await this.bcvpuCore.start();
        console.log('[Central Hub] BCVPU system started and ready for cognitive processing');
    }

    /**
     * Get the BCVPU Core instance
     */
    public getCore(): BCVPUCore {
        if (!this.bcvpuCore) {
            throw new Error('BCVPU Core not initialized');
        }
        return this.bcvpuCore;
    }

    /**
     * Get a specific module by type
     */
    public getModule<T extends IModule>(moduleType: ModuleType): T {
        const module = this.modules.get(moduleType);
        if (!module) {
            throw new Error(`Module of type ${moduleType} not found`);
        }
        return module as T;
    }

    /**
     * Get all registered modules
     */
    public getAllModules(): ReadonlyMap<ModuleType, IModule> {
        return new Map(this.modules);
    }

    /**
     * Get NPU accelerator instance
     */
    public getNPUAccelerator(): NPUAccelerator | undefined {
        return this.npuAccelerator;
    }

    /**
     * Print system information
     */
    public printSystemInfo(): void {
        if (!this.bcvpuCore) {
            console.log('[Central Hub] BCVPU system not initialized');
            return;
        }

        this.bcvpuCore.printInfo();
    }

    /**
     * Synchronize all components
     */
    public async synchronize(): Promise<void> {
        if (!this.bcvpuCore) {
            throw new Error('BCVPU Core not initialized');
        }

        await this.bcvpuCore.synchronize();
    }

    /**
     * Shutdown the entire system
     */
    public async shutdown(): Promise<void> {
        console.log('[Central Hub] Shutting down BCVPU system...');

        if (this.bcvpuCore) {
            await this.bcvpuCore.shutdown();
        }

        if (this.npuAccelerator) {
            await this.npuAccelerator.cleanup();
        }

        this.modules.clear();
        console.log('[Central Hub] BCVPU system shutdown complete');
    }

    /**
     * Create a complete BCVPU system with all modules
     */
    public static async createCompleteSystem(config?: Partial<BCVPUCoreConfig>): Promise<CentralHub> {
        const hub = new CentralHub();
        await hub.initialize(config);
        await hub.registerAllModules();
        await hub.start();
        return hub;
    }

    /**
     * Get system health status
     */
    public getSystemHealth(): {
        core: any;
        modules: { [key: string]: any };
        npu: any;
    } {
        if (!this.bcvpuCore) {
            throw new Error('BCVPU Core not initialized');
        }

        const coreHealth = this.bcvpuCore.getHealthStatus();
        const moduleHealth: { [key: string]: any } = {};

        for (const [type, module] of this.modules) {
            moduleHealth[type] = module.getHealthStatus();
        }

        const npuHealth = this.npuAccelerator ? {
            available: this.npuAccelerator.isAvailable(),
            initialized: this.npuAccelerator.isInitialized,
            deviceInfo: this.npuAccelerator.getDeviceInfo()
        } : null;

        return {
            core: coreHealth,
            modules: moduleHealth,
            npu: npuHealth
        };
    }

    /**
     * Process a task through the system
     */
    public async processTask(taskName: string, moduleType: ModuleType, inputData?: any): Promise<any> {
        if (!this.bcvpuCore) {
            throw new Error('BCVPU Core not initialized');
        }

        const task = {
            taskId: '', // Will be set by core
            taskName,
            inputData,
            timestamp: new Date()
        };

        return await this.bcvpuCore.processTask(task, moduleType);
    }

    /**
     * Process a task through multiple modules (pipeline)
     */
    public async processTaskPipeline(taskName: string, moduleTypes: ModuleType[], inputData?: any): Promise<any> {
        if (!this.bcvpuCore) {
            throw new Error('BCVPU Core not initialized');
        }

        const task = {
            taskId: '', // Will be set by core
            taskName,
            inputData,
            timestamp: new Date()
        };

        return await this.bcvpuCore.processTaskPipeline(task, moduleTypes);
    }
}