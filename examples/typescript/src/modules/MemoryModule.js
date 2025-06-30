"use strict";
/**
 * Copyright © 2024 Intel Corporation
 * SPDX-License-Identifier: Apache 2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryModule = void 0;
const events_1 = require("events");
const IModule_1 = require("../interfaces/IModule");
class MemoryModule extends events_1.EventEmitter {
    constructor() {
        super(...arguments);
        this.type = IModule_1.ModuleType.MEMORY;
        this.name = 'Memory Module';
        this._isInitialized = false;
        this._npuEnabled = false;
        this._stats = {
            totalTasksProcessed: 0,
            successfulTasks: 0,
            failedTasks: 0,
            averageProcessingTime: 0,
            npuAcceleratedTasks: 0
        };
        this.capabilities = {
            supportsNPUAcceleration: true,
            maxConcurrentTasks: 10,
            supportedDataTypes: ['buffer', 'object', 'string'],
            estimatedProcessingTime: 50
        };
        this.memoryStore = new Map();
        this.totalProcessingTime = 0;
    }
    get isInitialized() {
        return this._isInitialized;
    }
    get npuEnabled() {
        return this._npuEnabled;
    }
    get stats() {
        return { ...this._stats };
    }
    async initialize(config) {
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
        }
        catch (error) {
            console.error('[Memory Module] Initialization failed:', error);
            return false;
        }
    }
    async processTask(task) {
        if (!this.isInitialized) {
            console.error('[Memory Module] Module not initialized');
            return false;
        }
        const startTime = Date.now();
        task.status = IModule_1.TaskStatus.PROCESSING;
        task.startedAt = new Date();
        console.log(`[Memory Module] Processing task: ${task.description}${task.useNPUAcceleration && this.npuEnabled ? ' (NPU-accelerated)' : ''}`);
        this.emit('taskStarted', task);
        try {
            // Simulate memory operation processing
            if (task.useNPUAcceleration && this.npuEnabled) {
                console.log('[Memory Module] Using NPU acceleration for memory operations');
                await this.processWithNPU(task);
            }
            else {
                await this.processWithCPU(task);
            }
            // Process task based on description
            await this.handleMemoryOperation(task);
            const endTime = Date.now();
            const processingTime = endTime - startTime;
            // Update task
            task.status = IModule_1.TaskStatus.COMPLETED;
            task.completedAt = new Date();
            task.processingTimeMs = processingTime;
            // Update statistics
            this.updateStats(processingTime, true, task.useNPUAcceleration && this.npuEnabled);
            console.log('[Memory Module] Task completed successfully');
            this.emit('taskCompleted', task);
            return true;
        }
        catch (error) {
            const endTime = Date.now();
            const processingTime = endTime - startTime;
            task.status = IModule_1.TaskStatus.FAILED;
            task.completedAt = new Date();
            task.processingTimeMs = processingTime;
            this.updateStats(processingTime, false, false);
            console.error('[Memory Module] Task failed:', error);
            this.emit('taskFailed', task, error);
            return false;
        }
    }
    async processWithNPU(task) {
        // Simulate NPU-accelerated memory operation
        await this.delay(25); // Faster with NPU
        console.log('[Memory Module] NPU acceleration completed');
    }
    async processWithCPU(task) {
        // Simulate CPU-based memory operation
        await this.delay(75); // Slower with CPU
        console.log('[Memory Module] CPU processing completed');
    }
    async handleMemoryOperation(task) {
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
    extractOperation(description) {
        const lower = description.toLowerCase();
        if (lower.includes('store') || lower.includes('allocate'))
            return 'store';
        if (lower.includes('retrieve') || lower.includes('get'))
            return 'retrieve';
        if (lower.includes('optimize') || lower.includes('layout'))
            return 'optimize';
        return 'generic';
    }
    updateStats(processingTime, success, npuAccelerated) {
        this._stats.totalTasksProcessed++;
        if (success) {
            this._stats.successfulTasks++;
        }
        else {
            this._stats.failedTasks++;
        }
        if (npuAccelerated) {
            this._stats.npuAcceleratedTasks++;
        }
        this.totalProcessingTime += processingTime;
        this._stats.averageProcessingTime = this.totalProcessingTime / this._stats.totalTasksProcessed;
    }
    async cleanup() {
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
            health: this._stats.failedTasks / Math.max(1, this._stats.totalTasksProcessed) > 0.1 ? 'warning' : 'healthy'
        };
    }
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.MemoryModule = MemoryModule;
