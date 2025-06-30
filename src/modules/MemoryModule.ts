/**
 * Copyright © 2024 Intel Corporation
 * SPDX-License-Identifier: Apache 2.0
 */

import { EventEmitter } from 'events';
import { IModule, ModuleType, Task, TaskStatus, ModuleCapabilities, ModuleStats } from '../interfaces/IModule';

export class MemoryModule extends EventEmitter implements IModule {
    public readonly type = ModuleType.MEMORY;
    public readonly name = 'Memory Module';

    private _isInitialized = false;
    private _npuEnabled = false;
    private _stats: ModuleStats = {
        totalTasksProcessed: 0,
        successfulTasks: 0,
        failedTasks: 0,
        averageProcessingTime: 0,
        npuAcceleratedTasks: 0
    };

    public readonly capabilities: ModuleCapabilities = {
        supportsNPUAcceleration: true,
        maxConcurrentTasks: 10,
        supportedDataTypes: ['buffer', 'object', 'string'],
        estimatedProcessingTime: 50
    };

    private memoryStore: Map<string, any> = new Map();
    private totalProcessingTime = 0;

    get isInitialized(): boolean {
        return this._isInitialized;
    }

    get npuEnabled(): boolean {
        return this._npuEnabled;
    }

    get stats(): ModuleStats {
        return { ...this._stats };
    }

    async initialize(config?: Record<string, any>): Promise<boolean> {
        console.log('[Memory Module] Initializing memory management system...');
        
        try {
            // Simulate memory system initialization
            await this.delay(100);
            
            this._isInitialized = true;
            this._npuEnabled = config?.enableNPU !== false;
            
            // Initialize memory store
            this.memoryStore.clear();
            
            console.log('[Memory Module] Memory system initialized successfully');
            this.emit('initialized');
            
            return true;
        } catch (error) {
            console.error('[Memory Module] Initialization failed:', error);
            return false;
        }
    }

    async processTask(task: Task): Promise<boolean> {
        if (!this.isInitialized) {
            console.error('[Memory Module] Module not initialized');
            return false;
        }

        const startTime = Date.now();
        task.status = TaskStatus.PROCESSING;
        task.startedAt = new Date();

        console.log(`[Memory Module] Processing task: ${task.description}${
            task.useNPUAcceleration && this.npuEnabled ? ' (NPU-accelerated)' : ''
        }`);

        this.emit('taskStarted', task);

        try {
            // Simulate memory operation processing
            if (task.useNPUAcceleration && this.npuEnabled) {
                console.log('[Memory Module] Using NPU acceleration for memory operations');
                await this.processWithNPU(task);
            } else {
                await this.processWithCPU(task);
            }

            // Process task based on description
            await this.handleMemoryOperation(task);

            const endTime = Date.now();
            const processingTime = endTime - startTime;

            // Update task
            task.status = TaskStatus.COMPLETED;
            task.completedAt = new Date();
            task.processingTimeMs = processingTime;

            // Update statistics
            this.updateStats(processingTime, true, task.useNPUAcceleration && this.npuEnabled);

            console.log('[Memory Module] Task completed successfully');
            this.emit('taskCompleted', task);

            return true;
        } catch (error) {
            const endTime = Date.now();
            const processingTime = endTime - startTime;

            task.status = TaskStatus.FAILED;
            task.completedAt = new Date();
            task.processingTimeMs = processingTime;

            this.updateStats(processingTime, false, false);

            console.error('[Memory Module] Task failed:', error);
            this.emit('taskFailed', task, error);

            return false;
        }
    }

    private async processWithNPU(task: Task): Promise<void> {
        // Simulate NPU-accelerated memory operation
        await this.delay(25); // Faster with NPU
        console.log('[Memory Module] NPU acceleration completed');
    }

    private async processWithCPU(task: Task): Promise<void> {
        // Simulate CPU-based memory operation
        await this.delay(75); // Slower with CPU
        console.log('[Memory Module] CPU processing completed');
    }

    private async handleMemoryOperation(task: Task): Promise<void> {
        const operation = this.extractOperation(task.description);
        
        switch (operation) {
            case 'store':
                if (task.data) {
                    this.memoryStore.set(task.id, task.data);
                    console.log(`[Memory Module] Stored data for task ${task.id}`);
                }
                break;
            
            case 'retrieve':
                const data = this.memoryStore.get(task.id);
                task.metadata = { retrievedData: data };
                console.log(`[Memory Module] Retrieved data for task ${task.id}`);
                break;
            
            case 'optimize':
                // Simulate memory optimization
                console.log('[Memory Module] Memory layout optimized');
                break;
            
            default:
                console.log('[Memory Module] Generic memory operation completed');
        }
    }

    private extractOperation(description: string): string {
        const lower = description.toLowerCase();
        if (lower.includes('store') || lower.includes('allocate')) return 'store';
        if (lower.includes('retrieve') || lower.includes('get')) return 'retrieve';
        if (lower.includes('optimize') || lower.includes('layout')) return 'optimize';
        return 'generic';
    }

    private updateStats(processingTime: number, success: boolean, npuAccelerated: boolean): void {
        this._stats.totalTasksProcessed++;
        
        if (success) {
            this._stats.successfulTasks++;
        } else {
            this._stats.failedTasks++;
        }

        if (npuAccelerated) {
            this._stats.npuAcceleratedTasks++;
        }

        this.totalProcessingTime += processingTime;
        this._stats.averageProcessingTime = this.totalProcessingTime / this._stats.totalTasksProcessed;
    }

    async cleanup(): Promise<boolean> {
        console.log('[Memory Module] Cleaning up memory management system...');
        
        this.memoryStore.clear();
        this._isInitialized = false;
        this._npuEnabled = false;
        
        this.emit('cleanup');
        return true;
    }

    getStatus() {
        return {
            initialized: this.isInitialized,
            npuEnabled: this.npuEnabled,
            currentLoad: Math.min(100, (this._stats.totalTasksProcessed % 10) * 10),
            health: this._stats.failedTasks / Math.max(1, this._stats.totalTasksProcessed) > 0.1 ? 'warning' as const : 'healthy' as const
        };
    }

    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}