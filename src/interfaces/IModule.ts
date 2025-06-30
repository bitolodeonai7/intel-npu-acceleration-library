/**
 * Copyright © 2024 Intel Corporation
 * SPDX-License-Identifier: Apache 2.0
 */

export enum ModuleType {
    MEMORY = 'memory',
    DECISION_MAKING = 'decision_making',
    SENSORY_PROCESSING = 'sensory_processing'
}

export enum TaskStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed'
}

export interface Task {
    id: string;
    targetModule: ModuleType;
    description: string;
    data?: any;
    status: TaskStatus;
    useNPUAcceleration: boolean;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    processingTimeMs?: number;
    metadata?: Record<string, any>;
}

export interface ModuleCapabilities {
    supportsNPUAcceleration: boolean;
    maxConcurrentTasks: number;
    supportedDataTypes: string[];
    estimatedProcessingTime: number;
}

export interface ModuleStats {
    totalTasksProcessed: number;
    successfulTasks: number;
    failedTasks: number;
    averageProcessingTime: number;
    npuAcceleratedTasks: number;
}

export interface IModule {
    readonly type: ModuleType;
    readonly name: string;
    readonly isInitialized: boolean;
    readonly npuEnabled: boolean;
    readonly capabilities: ModuleCapabilities;
    readonly stats: ModuleStats;

    /**
     * Initialize the module with optional configuration
     */
    initialize(config?: Record<string, any>): Promise<boolean>;

    /**
     * Process a single task
     */
    processTask(task: Task): Promise<boolean>;

    /**
     * Cleanup module resources
     */
    cleanup(): Promise<boolean>;

    /**
     * Get module status information
     */
    getStatus(): {
        initialized: boolean;
        npuEnabled: boolean;
        currentLoad: number;
        health: 'healthy' | 'warning' | 'error';
    };

    /**
     * Register event listeners for module events
     */
    on(event: string, listener: (...args: any[]) => void): void;

    /**
     * Remove event listeners
     */
    off(event: string, listener: (...args: any[]) => void): void;
}