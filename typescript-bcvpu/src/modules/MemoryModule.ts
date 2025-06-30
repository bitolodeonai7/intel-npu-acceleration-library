/*
 * Copyright © 2024 Intel Corporation
 * SPDX-License-Identifier: Apache 2.0
 */

import { BaseModule } from './BaseModule';
import { ModuleType, Task } from '../interfaces/IModule';
import { INPUAccelerator } from '../interfaces/INPUAccelerator';

/**
 * Memory module data structure
 */
interface MemoryBank {
    data: Map<string, any>;
    totalSize: number;
    usedSize: number;
    metadata: Map<string, any>;
}

/**
 * Memory Module implementation
 * Handles memory-related tasks and data storage with NPU acceleration
 */
export class MemoryModule extends BaseModule {
    private memoryBank: MemoryBank;
    private maxMemorySize: number = 1024 * 1024 * 100; // 100MB default

    constructor(npuAccelerator?: INPUAccelerator | undefined) {
        super({
            name: 'Memory Module',
            type: ModuleType.MEMORY,
            npuEnabled: true,
            maxConcurrentTasks: 10
        }, npuAccelerator);

        this.memoryBank = {
            data: new Map(),
            totalSize: this.maxMemorySize,
            usedSize: 0,
            metadata: new Map()
        };
    }

    protected async doInitialize(): Promise<void> {
        // Initialize memory bank
        this.memoryBank.data.clear();
        this.memoryBank.metadata.clear();
        this.memoryBank.usedSize = 0;
        
        console.log(`[${this.name}] Initialized with ${this.memoryBank.totalSize / (1024 * 1024)}MB memory bank`);
    }

    protected async doProcessTask(task: Task): Promise<any> {
        const taskName = task.taskName.toLowerCase();
        
        if (taskName.includes('store')) {
            return await this.storeData(task);
        } else if (taskName.includes('retrieve') || taskName.includes('get')) {
            return await this.retrieveData(task);
        } else if (taskName.includes('delete') || taskName.includes('remove')) {
            return await this.deleteData(task);
        } else if (taskName.includes('search') || taskName.includes('find')) {
            return await this.searchData(task);
        } else {
            throw new Error(`Unsupported memory operation: ${task.taskName}`);
        }
    }

    private async storeData(task: Task): Promise<any> {
        const { inputData } = task;
        
        if (!inputData || !inputData.key) {
            throw new Error('Store operation requires data with key');
        }

        const key = inputData.key;
        const data = inputData.data;
        const dataSize = this.calculateDataSize(data);

        if (this.memoryBank.usedSize + dataSize > this.memoryBank.totalSize) {
            // Use NPU for memory optimization if available
            if (this._npuAvailable && this._npuAccelerator) {
                console.log(`[${this.name}] Using NPU-accelerated memory compression`);
                // Simulate NPU-based compression
                const compressedData = await this.compressWithNPU(data);
                this.memoryBank.data.set(key, compressedData);
                this.memoryBank.metadata.set(key, { 
                    originalSize: dataSize,
                    compressedSize: this.calculateDataSize(compressedData),
                    compressed: true,
                    timestamp: new Date()
                });
                this.memoryBank.usedSize += this.calculateDataSize(compressedData);
            } else {
                throw new Error(`Memory full: cannot store ${dataSize} bytes`);
            }
        } else {
            this.memoryBank.data.set(key, data);
            this.memoryBank.metadata.set(key, {
                size: dataSize,
                compressed: false,
                timestamp: new Date()
            });
            this.memoryBank.usedSize += dataSize;
        }

        console.log(`[${this.name}] Stored data with key '${key}', used: ${this.memoryBank.usedSize}/${this.memoryBank.totalSize} bytes`);
        
        return {
            success: true,
            key,
            size: dataSize,
            totalUsed: this.memoryBank.usedSize
        };
    }

    private async retrieveData(task: Task): Promise<any> {
        const { inputData } = task;
        
        if (!inputData?.key) {
            throw new Error('Retrieve operation requires key');
        }

        const key = inputData.key;
        
        if (!this.memoryBank.data.has(key)) {
            throw new Error(`Data with key '${key}' not found`);
        }

        let data = this.memoryBank.data.get(key);
        const metadata = this.memoryBank.metadata.get(key);

        // Decompress if needed using NPU
        if (metadata?.compressed && this._npuAvailable && this._npuAccelerator) {
            console.log(`[${this.name}] Using NPU-accelerated decompression`);
            data = await this.decompressWithNPU(data);
        }

        console.log(`[${this.name}] Retrieved data with key '${key}'`);
        
        return {
            success: true,
            key,
            data,
            metadata
        };
    }

    private async deleteData(task: Task): Promise<any> {
        const { inputData } = task;
        
        if (!inputData || !inputData.key) {
            throw new Error('Delete operation requires key');
        }

        const key = inputData.key;
        
        if (!this.memoryBank.data.has(key)) {
            throw new Error(`Data with key '${key}' not found`);
        }

        const metadata = this.memoryBank.metadata.get(key);
        const size = metadata?.size || metadata?.compressedSize || 0;

        this.memoryBank.data.delete(key);
        this.memoryBank.metadata.delete(key);
        this.memoryBank.usedSize -= size;

        console.log(`[${this.name}] Deleted data with key '${key}', freed ${size} bytes`);
        
        return {
            success: true,
            key,
            freedSize: size,
            totalUsed: this.memoryBank.usedSize
        };
    }

    private async searchData(task: Task): Promise<any> {
        const { inputData } = task;
        const query = inputData?.query || '';

        // Use NPU for accelerated search if available
        if (this._npuAvailable && this._npuAccelerator) {
            console.log(`[${this.name}] Using NPU-accelerated semantic search`);
            return await this.searchWithNPU(query);
        } else {
            console.log(`[${this.name}] Using CPU-based search`);
            return await this.searchWithCPU(query);
        }
    }

    private async compressWithNPU(data: any): Promise<any> {
        // Simulate NPU-based compression
        await new Promise(resolve => setTimeout(resolve, 10));
        return { compressed: true, data: JSON.stringify(data) };
    }

    private async decompressWithNPU(compressedData: any): Promise<any> {
        // Simulate NPU-based decompression
        await new Promise(resolve => setTimeout(resolve, 10));
        return JSON.parse(compressedData.data);
    }

    private async searchWithNPU(query: string): Promise<any> {
        // Simulate NPU-accelerated semantic search
        await new Promise(resolve => setTimeout(resolve, 20));
        
        const results: any[] = [];
        for (const [key, metadata] of this.memoryBank.metadata.entries()) {
            if (key.toLowerCase().includes(query.toLowerCase())) {
                results.push({
                    key,
                    metadata,
                    relevanceScore: Math.random() * 0.5 + 0.5 // Simulated relevance
                });
            }
        }

        results.sort((a, b) => b.relevanceScore - a.relevanceScore);
        
        return {
            success: true,
            query,
            results: results.slice(0, 10), // Top 10 results
            totalMatches: results.length
        };
    }

    private async searchWithCPU(query: string): Promise<any> {
        // Simple CPU-based search
        const results: any[] = [];
        for (const [key, metadata] of this.memoryBank.metadata.entries()) {
            if (key.toLowerCase().includes(query.toLowerCase())) {
                results.push({ key, metadata });
            }
        }

        return {
            success: true,
            query,
            results,
            totalMatches: results.length
        };
    }

    private calculateDataSize(data: any): number {
        // Simple size calculation
        return JSON.stringify(data).length * 2; // Approximation for UTF-16
    }

    protected async doCleanup(): Promise<void> {
        this.memoryBank.data.clear();
        this.memoryBank.metadata.clear();
        this.memoryBank.usedSize = 0;
        
        if (this._npuAccelerator) {
            // Cleanup NPU resources if needed
        }
    }

    // Public methods for external access
    public getMemoryUsage(): { used: number; total: number; percentage: number } {
        return {
            used: this.memoryBank.usedSize,
            total: this.memoryBank.totalSize,
            percentage: (this.memoryBank.usedSize / this.memoryBank.totalSize) * 100
        };
    }

    public getStoredKeys(): string[] {
        return Array.from(this.memoryBank.data.keys());
    }
}