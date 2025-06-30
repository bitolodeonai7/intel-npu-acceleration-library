/*
 * Copyright © 2024 Intel Corporation
 * SPDX-License-Identifier: Apache 2.0
 */

/**
 * Module types for BCVPU architecture
 */
export enum ModuleType {
    MEMORY = 'memory',
    DECISION_MAKING = 'decision-making',
    SENSORY_PROCESSING = 'sensory-processing'
}

/**
 * Module status enumeration
 */
export enum ModuleStatus {
    IDLE = 'idle',
    PROCESSING = 'processing',
    COMPLETE = 'complete',
    ERROR = 'error'
}

/**
 * Task structure for module communication
 */
export interface Task {
    readonly taskId: string;
    readonly taskName: string;
    readonly inputData?: any;
    readonly outputData?: any;
    readonly metadata?: Record<string, any>;
    readonly timestamp: Date;
}

/**
 * Module configuration interface
 */
export interface ModuleConfig {
    readonly name: string;
    readonly type: ModuleType;
    readonly npuEnabled: boolean;
    readonly maxConcurrentTasks?: number;
    readonly customSettings?: Record<string, any>;
}

/**
 * Base module interface
 */
export interface IModule {
    readonly id: string;
    readonly name: string;
    readonly type: ModuleType;
    readonly status: ModuleStatus;
    readonly npuEnabled: boolean;
    readonly npuAvailable: boolean;

    /**
     * Initialize the module
     */
    initialize(): Promise<void>;

    /**
     * Process a task
     */
    processTask(task: Task): Promise<any>;

    /**
     * Get module health status
     */
    getHealthStatus(): ModuleHealthStatus;

    /**
     * Cleanup module resources
     */
    cleanup(): Promise<void>;

    /**
     * Update module configuration
     */
    updateConfig(config: Partial<ModuleConfig>): void;
}

/**
 * Module health status
 */
export interface ModuleHealthStatus {
    readonly healthy: boolean;
    readonly uptime: number;
    readonly tasksProcessed: number;
    readonly lastActivity: Date;
    readonly memoryUsage?: number;
    readonly errors: string[];
}

/**
 * Module factory interface
 */
export interface IModuleFactory {
    createModule(config: ModuleConfig): IModule;
    getSupportedTypes(): ModuleType[];
}