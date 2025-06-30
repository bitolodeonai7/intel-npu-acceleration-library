/*
 * Copyright © 2024 Intel Corporation
 * SPDX-License-Identifier: Apache 2.0
 */

import { v4 as uuidv4 } from 'uuid';
import { IModule, ModuleType, ModuleStatus, ModuleConfig, Task, ModuleHealthStatus } from '../interfaces/IModule';
import { INPUAccelerator } from '../interfaces/INPUAccelerator';

/**
 * Base module implementation
 */
export abstract class BaseModule implements IModule {
    public readonly id: string;
    public readonly name: string;
    public readonly type: ModuleType;
    public readonly npuEnabled: boolean;

    protected _status: ModuleStatus = ModuleStatus.IDLE;
    protected _npuAvailable: boolean = false;
    protected _npuAccelerator?: INPUAccelerator | undefined;
    protected _tasksProcessed: number = 0;
    protected _errors: string[] = [];
    protected _startTime: Date = new Date();
    protected _lastActivity: Date = new Date();
    protected _config: ModuleConfig;

    constructor(config: ModuleConfig, npuAccelerator?: INPUAccelerator | undefined) {
        this.id = uuidv4();
        this.name = config.name;
        this.type = config.type;
        this.npuEnabled = config.npuEnabled;
        this._config = config;
        this._npuAccelerator = npuAccelerator;
    }

    public get status(): ModuleStatus {
        return this._status;
    }

    public get npuAvailable(): boolean {
        return this._npuAvailable;
    }

    public async initialize(): Promise<void> {
        try {
            this._status = ModuleStatus.PROCESSING;
            
            if (this.npuEnabled && this._npuAccelerator) {
                this._npuAvailable = this._npuAccelerator.isAvailable();
                if (this._npuAvailable) {
                    console.log(`[${this.name}] NPU acceleration enabled`);
                } else {
                    console.log(`[${this.name}] NPU acceleration failed to initialize`);
                }
            } else {
                console.log(`[${this.name}] NPU acceleration disabled`);
            }

            await this.doInitialize();
            this._status = ModuleStatus.IDLE;
            console.log(`[${this.name}] Initialized successfully`);
        } catch (error) {
            this._status = ModuleStatus.ERROR;
            const errorMsg = `Initialization failed: ${error}`;
            this._errors.push(errorMsg);
            console.error(`[${this.name}] ${errorMsg}`);
            throw error;
        }
    }

    public async processTask(task: Task): Promise<any> {
        try {
            this._status = ModuleStatus.PROCESSING;
            this._lastActivity = new Date();
            
            console.log(`[${this.name}] Processing task: ${task.taskName}`);
            
            const result = await this.doProcessTask(task);
            
            this._tasksProcessed++;
            this._status = ModuleStatus.COMPLETE;
            
            console.log(`[${this.name}] Task completed: ${task.taskName}`);
            return result;
        } catch (error) {
            const errorMsg = `Task processing failed: ${error}`;
            this._errors.push(errorMsg);
            console.error(`[${this.name}] ${errorMsg}`);
            
            // Reset status to allow subsequent operations
            this._status = ModuleStatus.IDLE;
            throw error;
        }
    }

    public getHealthStatus(): ModuleHealthStatus {
        const now = new Date();
        const uptime = now.getTime() - this._startTime.getTime();
        
        return {
            healthy: this._status !== ModuleStatus.ERROR,
            uptime: uptime / 1000, // in seconds
            tasksProcessed: this._tasksProcessed,
            lastActivity: this._lastActivity,
            memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
            errors: [...this._errors]
        };
    }

    public async cleanup(): Promise<void> {
        try {
            console.log(`[${this.name}] Cleaning up resources...`);
            await this.doCleanup();
            this._status = ModuleStatus.IDLE;
            console.log(`[${this.name}] Cleanup completed`);
        } catch (error) {
            const errorMsg = `Cleanup failed: ${error}`;
            this._errors.push(errorMsg);
            console.error(`[${this.name}] ${errorMsg}`);
            throw error;
        }
    }

    public updateConfig(config: Partial<ModuleConfig>): void {
        this._config = { ...this._config, ...config };
        console.log(`[${this.name}] Configuration updated`);
    }

    // Abstract methods to be implemented by subclasses
    protected abstract doInitialize(): Promise<void>;
    protected abstract doProcessTask(task: Task): Promise<any>;
    protected abstract doCleanup(): Promise<void>;
}