"use strict";
/**
 * Copyright © 2024 Intel Corporation
 * SPDX-License-Identifier: Apache 2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BCVPUCore = void 0;
const events_1 = require("events");
const IModule_1 = require("../interfaces/IModule");
const CentralHub_1 = require("./CentralHub");
const NPUAccelerator_1 = require("../acceleration/NPUAccelerator");
const MemoryModule_1 = require("../modules/MemoryModule");
const DecisionMakingModule_1 = require("../modules/DecisionMakingModule");
const SensoryProcessingModule_1 = require("../modules/SensoryProcessingModule");
class BCVPUCore extends events_1.EventEmitter {
    constructor() {
        super();
        this._isInitialized = false;
        this._isRunning = false;
        this._stats = {
            totalTasksProcessed: 0,
            successfulTasks: 0,
            failedTasks: 0,
            npuAcceleratedTasks: 0,
            averageProcessingTimeMs: 0,
            systemUptimeMs: 0,
            npuAvailable: false,
            npuDriverVersion: undefined,
            memoryUsageMB: 0,
            cpuUsagePercent: 0
        };
        this.taskQueue = [];
        this.processingTasks = [];
        this.startTime = 0;
        this.totalProcessingTime = 0;
        this._config = this.getDefaultConfig();
        this.centralHub = new CentralHub_1.CentralHub();
        this.npuAccelerator = new NPUAccelerator_1.NPUAccelerator();
        this.setupEventListeners();
    }
    get config() {
        return { ...this._config };
    }
    get isInitialized() {
        return this._isInitialized;
    }
    get isRunning() {
        return this._isRunning;
    }
    get stats() {
        const currentTime = Date.now();
        return {
            ...this._stats,
            systemUptimeMs: this.startTime > 0 ? currentTime - this.startTime : 0,
            memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            cpuUsagePercent: Math.random() * 20 + 10 // Simulated CPU usage
        };
    }
    get queueInfo() {
        return {
            size: this.taskQueue.length,
            capacity: this._config.maxConcurrentTasks,
            pendingTasks: this.taskQueue.filter(task => task.status === IModule_1.TaskStatus.PENDING),
            processingTasks: [...this.processingTasks]
        };
    }
    async initialize(config) {
        console.log('[BCVPU Core] Initializing Brain Computing Virtual Processing Unit...');
        try {
            // Validate and set configuration
            if (!this.validateConfig(config)) {
                console.error('[BCVPU Core] Invalid configuration provided');
                return false;
            }
            this._config = { ...config };
            this.startTime = Date.now();
            // Initialize NPU accelerator
            if (config.enableNPUAcceleration) {
                const npuInitialized = await this.npuAccelerator.initialize(config.devicePreference);
                if (npuInitialized) {
                    this._stats.npuAvailable = this.npuAccelerator.isAvailable;
                    this._stats.npuDriverVersion = this.npuAccelerator.driverVersion;
                    console.log('[BCVPU Core] NPU accelerator initialized successfully');
                }
                else {
                    console.warn('[BCVPU Core] NPU initialization failed, continuing with CPU');
                    this._stats.npuAvailable = false;
                }
            }
            // Initialize central hub
            await this.centralHub.initialize();
            // Create and register modules
            await this.createAndRegisterModules();
            // Initialize all modules
            const moduleConfig = {
                enableNPU: this._stats.npuAvailable,
                performanceMode: config.performanceMode,
                logLevel: config.logLevel
            };
            await this.centralHub.initializeAllModules(moduleConfig);
            this._isInitialized = true;
            console.log('[BCVPU Core] Core system initialized successfully');
            this.emit('initialized');
            return true;
        }
        catch (error) {
            console.error('[BCVPU Core] Initialization failed:', error);
            this.emit('initializationFailed', error);
            return false;
        }
    }
    async start() {
        if (!this._isInitialized) {
            console.error('[BCVPU Core] Cannot start - system not initialized');
            return false;
        }
        console.log('[BCVPU Core] Starting BCVPU system...');
        try {
            this._isRunning = true;
            this.startTime = Date.now();
            console.log('[BCVPU Core] System started successfully');
            this.emit('started');
            return true;
        }
        catch (error) {
            console.error('[BCVPU Core] Failed to start system:', error);
            this.emit('startFailed', error);
            return false;
        }
    }
    async stop() {
        if (!this._isRunning) {
            console.warn('[BCVPU Core] System is not running');
            return true;
        }
        console.log('[BCVPU Core] Stopping BCVPU system...');
        try {
            // Process any remaining tasks
            await this.processAllTasks();
            this._isRunning = false;
            console.log('[BCVPU Core] System stopped successfully');
            this.emit('stopped');
            return true;
        }
        catch (error) {
            console.error('[BCVPU Core] Error stopping system:', error);
            this.emit('stopFailed', error);
            return false;
        }
    }
    async cleanup() {
        console.log('[BCVPU Core] Cleaning up BCVPU system...');
        try {
            // Stop if running
            if (this._isRunning) {
                await this.stop();
            }
            // Cleanup central hub and modules
            await this.centralHub.cleanup();
            // Cleanup NPU accelerator
            await this.npuAccelerator.cleanup();
            // Clear task queues
            this.taskQueue = [];
            this.processingTasks = [];
            // Reset state
            this._isInitialized = false;
            this._stats = {
                totalTasksProcessed: 0,
                successfulTasks: 0,
                failedTasks: 0,
                npuAcceleratedTasks: 0,
                averageProcessingTimeMs: 0,
                systemUptimeMs: 0,
                npuAvailable: false,
                npuDriverVersion: undefined,
                memoryUsageMB: 0,
                cpuUsagePercent: 0
            };
            console.log('[BCVPU Core] Cleanup completed');
            this.emit('cleanup');
            return true;
        }
        catch (error) {
            console.error('[BCVPU Core] Cleanup failed:', error);
            this.emit('cleanupFailed', error);
            return false;
        }
    }
    async registerModule(module) {
        return this.centralHub.registerModule(module);
    }
    getModule(type) {
        return this.centralHub.getModule(type);
    }
    async submitTask(task) {
        if (!this._isRunning) {
            console.error('[BCVPU Core] Cannot submit task - system not running');
            return false;
        }
        if (this.taskQueue.length >= this._config.maxConcurrentTasks) {
            console.warn('[BCVPU Core] Task queue is full');
            return false;
        }
        task.status = IModule_1.TaskStatus.PENDING;
        task.createdAt = new Date();
        this.taskQueue.push(task);
        console.log(`[BCVPU Core] Task ${task.id} submitted to queue (queue size: ${this.taskQueue.length})`);
        this.emit('taskSubmitted', task);
        return true;
    }
    async processNextTask() {
        if (this.taskQueue.length === 0) {
            return false;
        }
        const task = this.taskQueue.shift();
        this.processingTasks.push(task);
        const startTime = Date.now();
        try {
            const success = await this.centralHub.routeTask(task);
            const endTime = Date.now();
            const processingTime = endTime - startTime;
            // Update statistics
            this.updateStats(processingTime, success, task.useNPUAcceleration && this._stats.npuAvailable);
            // Remove from processing tasks
            const index = this.processingTasks.indexOf(task);
            if (index > -1) {
                this.processingTasks.splice(index, 1);
            }
            if (success) {
                this.emit('taskCompleted', task);
            }
            else {
                this.emit('taskFailed', task);
            }
            return success;
        }
        catch (error) {
            const endTime = Date.now();
            const processingTime = endTime - startTime;
            this.updateStats(processingTime, false, false);
            // Remove from processing tasks
            const index = this.processingTasks.indexOf(task);
            if (index > -1) {
                this.processingTasks.splice(index, 1);
            }
            console.error('[BCVPU Core] Task processing error:', error);
            this.emit('taskFailed', task, error);
            return false;
        }
    }
    async processAllTasks() {
        console.log('[BCVPU Core] Processing all queued tasks...');
        while (this.taskQueue.length > 0) {
            await this.processNextTask();
        }
        console.log('[BCVPU Core] All tasks processed');
        this.emit('allTasksProcessed');
        return true;
    }
    getStatistics() {
        return this.stats;
    }
    async checkNPUAvailability() {
        return this.npuAccelerator.checkAvailability();
    }
    async runDiagnostics() {
        console.log('[BCVPU Core] Running system diagnostics...');
        const hubStatus = this.centralHub.getSystemStatus();
        const npuStatus = {
            available: this._stats.npuAvailable,
            initialized: this.npuAccelerator.isInitialized,
            performanceStats: this.npuAccelerator.getPerformanceStats()
        };
        const memoryUsage = process.memoryUsage();
        const systemHealth = {
            memoryUsage: {
                heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
                external: Math.round(memoryUsage.external / 1024 / 1024)
            },
            taskQueue: this.queueInfo,
            uptime: this.stats.systemUptimeMs
        };
        const overall = hubStatus.overallHealth === 'error' ? 'error' :
            hubStatus.overallHealth === 'warning' ? 'warning' : 'healthy';
        return {
            overall,
            details: {
                hub: hubStatus,
                npu: npuStatus,
                system: systemHealth,
                statistics: this.stats
            }
        };
    }
    async createAndRegisterModules() {
        console.log('[BCVPU Core] Creating and registering modules...');
        // Create modules
        const memoryModule = new MemoryModule_1.MemoryModule();
        const decisionModule = new DecisionMakingModule_1.DecisionMakingModule();
        const sensoryModule = new SensoryProcessingModule_1.SensoryProcessingModule();
        // Register modules
        await this.centralHub.registerModule(memoryModule);
        await this.centralHub.registerModule(decisionModule);
        await this.centralHub.registerModule(sensoryModule);
        console.log('[BCVPU Core] All modules registered');
    }
    setupEventListeners() {
        // Central hub events
        this.centralHub.on('taskRouted', (task, module) => {
            this.emit('moduleTaskStarted', module, task);
        });
        this.centralHub.on('taskRoutingFailed', (task, error) => {
            this.emit('taskRoutingFailed', task, error);
        });
        this.centralHub.on('moduleTaskCompleted', (module, task) => {
            this.emit('moduleTaskCompleted', module, task);
        });
        this.centralHub.on('moduleTaskFailed', (module, task, error) => {
            this.emit('moduleTaskFailed', module, task, error);
        });
    }
    validateConfig(config) {
        if (!config)
            return false;
        if (config.maxConcurrentTasks <= 0 || config.maxConcurrentTasks > 1000) {
            console.error('[BCVPU Core] Invalid maxConcurrentTasks value');
            return false;
        }
        if (config.memoryPoolSize <= 0) {
            console.error('[BCVPU Core] Invalid memoryPoolSize value');
            return false;
        }
        return true;
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
        this._stats.averageProcessingTimeMs = this.totalProcessingTime / this._stats.totalTasksProcessed;
    }
    getDefaultConfig() {
        return {
            enableNPUAcceleration: true,
            enableProfiling: false,
            maxConcurrentTasks: 20,
            memoryPoolSize: 1024 * 1024,
            devicePreference: 'NPU',
            logLevel: 'info',
            performanceMode: 'balanced'
        };
    }
}
exports.BCVPUCore = BCVPUCore;
