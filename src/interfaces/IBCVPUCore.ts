/**
 * Copyright © 2024 Intel Corporation
 * SPDX-License-Identifier: Apache 2.0
 */

import { IModule, ModuleType, Task } from './IModule';

export interface BCVPUConfig {
    enableNPUAcceleration: boolean;
    enableProfiling: boolean;
    maxConcurrentTasks: number;
    memoryPoolSize: number;
    devicePreference: 'NPU' | 'CPU' | 'AUTO';
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    performanceMode: 'throughput' | 'latency' | 'balanced';
}

export interface SystemStats {
    totalTasksProcessed: number;
    successfulTasks: number;
    failedTasks: number;
    npuAcceleratedTasks: number;
    averageProcessingTimeMs: number;
    systemUptimeMs: number;
    npuAvailable: boolean;
    npuDriverVersion?: string;
    memoryUsageMB: number;
    cpuUsagePercent: number;
}

export interface TaskQueueInfo {
    size: number;
    capacity: number;
    pendingTasks: Task[];
    processingTasks: Task[];
}

export interface IBCVPUCore {
    readonly config: BCVPUConfig;
    readonly isInitialized: boolean;
    readonly isRunning: boolean;
    readonly stats: SystemStats;
    readonly queueInfo: TaskQueueInfo;

    /**
     * Initialize the BCVPU core system
     */
    initialize(config: BCVPUConfig): Promise<boolean>;

    /**
     * Start the BCVPU system
     */
    start(): Promise<boolean>;

    /**
     * Stop the BCVPU system
     */
    stop(): Promise<boolean>;

    /**
     * Cleanup system resources
     */
    cleanup(): Promise<boolean>;

    /**
     * Register a module with the system
     */
    registerModule(module: IModule): Promise<boolean>;

    /**
     * Get a registered module by type
     */
    getModule(type: ModuleType): IModule | null;

    /**
     * Submit a task to the processing queue
     */
    submitTask(task: Task): Promise<boolean>;

    /**
     * Process the next task in the queue
     */
    processNextTask(): Promise<boolean>;

    /**
     * Process all tasks in the queue
     */
    processAllTasks(): Promise<boolean>;

    /**
     * Get current system statistics
     */
    getStatistics(): SystemStats;

    /**
     * Check NPU availability
     */
    checkNPUAvailability(): Promise<boolean>;

    /**
     * Run system diagnostics
     */
    runDiagnostics(): Promise<{
        overall: 'healthy' | 'warning' | 'error';
        details: Record<string, any>;
    }>;

    /**
     * Register event listeners for system events
     */
    on(event: string, listener: (...args: any[]) => void): void;

    /**
     * Remove event listeners
     */
    off(event: string, listener: (...args: any[]) => void): void;
}