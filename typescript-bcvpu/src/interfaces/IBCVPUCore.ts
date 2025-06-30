/*
 * Copyright © 2024 Intel Corporation
 * SPDX-License-Identifier: Apache 2.0
 */

import { IModule, ModuleType, Task } from './IModule';

/**
 * BCVPU Core status enumeration
 */
export enum BCVPUCoreStatus {
    UNINITIALIZED = 'uninitialized',
    INITIALIZING = 'initializing',
    READY = 'ready',
    PROCESSING = 'processing',
    ERROR = 'error',
    SHUTDOWN = 'shutdown'
}

/**
 * BCVPU Core configuration
 */
export interface BCVPUCoreConfig {
    readonly enableNPU: boolean;
    readonly enableProfiling: boolean;
    readonly maxConcurrentTasks: number;
    readonly cacheDirectory: string;
    readonly logLevel: 'debug' | 'info' | 'warn' | 'error';
    readonly moduleConfigs?: Record<string, any>;
}

/**
 * System metrics
 */
export interface SystemMetrics {
    readonly cpuUsage: number;
    readonly memoryUsage: number;
    readonly npuUsage?: number | undefined;
    readonly taskThroughput: number;
    readonly uptime: number;
}

/**
 * Processing pipeline result
 */
export interface ProcessingResult {
    readonly success: boolean;
    readonly result?: any;
    readonly error?: string;
    readonly executionTime: number;
    readonly modulesUsed: string[];
}

/**
 * BCVPU Core interface
 */
export interface IBCVPUCore {
    readonly status: BCVPUCoreStatus;
    readonly config: BCVPUCoreConfig;
    readonly registeredModules: ReadonlyMap<string, IModule>;

    /**
     * Initialize the BCVPU core with configuration
     */
    initialize(config: BCVPUCoreConfig): Promise<void>;

    /**
     * Register a module with the core
     */
    registerModule(module: IModule): Promise<void>;

    /**
     * Unregister a module from the core
     */
    unregisterModule(moduleId: string): Promise<void>;

    /**
     * Start the BCVPU core processing
     */
    start(): Promise<void>;

    /**
     * Process a task through the specified module
     */
    processTask(task: Task, targetModuleType: ModuleType): Promise<ProcessingResult>;

    /**
     * Process a task through the processing pipeline
     */
    processTaskPipeline(task: Task, moduleTypes: ModuleType[]): Promise<ProcessingResult>;

    /**
     * Synchronize all modules
     */
    synchronize(): Promise<void>;

    /**
     * Get system metrics
     */
    getSystemMetrics(): SystemMetrics;

    /**
     * Get core health status
     */
    getHealthStatus(): BCVPUCoreHealthStatus;

    /**
     * Shutdown the core and cleanup resources
     */
    shutdown(): Promise<void>;
}

/**
 * BCVPU Core health status
 */
export interface BCVPUCoreHealthStatus {
    readonly healthy: boolean;
    readonly status: BCVPUCoreStatus;
    readonly uptime: number;
    readonly tasksProcessed: number;
    readonly activeModules: number;
    readonly systemMetrics: SystemMetrics;
    readonly errors: string[];
}