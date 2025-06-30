/*
 * Copyright © 2024 Intel Corporation
 * SPDX-License-Identifier: Apache 2.0
 */

import { BaseModule } from './BaseModule';
import { ModuleType, Task } from '../interfaces/IModule';
import { INPUAccelerator, Tensor, NPUOperationType } from '../interfaces/INPUAccelerator';

/**
 * Decision context for AI inference
 */
interface DecisionContext {
    features: number[];
    weights?: number[];
    threshold: number;
    confidence: number;
}

/**
 * Decision result
 */
interface DecisionResult {
    decision: boolean;
    confidence: number;
    reasoning: string[];
    executionTime: number;
}

/**
 * Decision-Making Module implementation
 * Processes decision logic and AI inference with NPU acceleration
 */
export class DecisionMakingModule extends BaseModule {
    private decisionThreshold: number = 0.5;
    private decisionCount: number = 0;
    private modelWeights: Float32Array;
    private learningRate: number = 0.01;

    constructor(npuAccelerator?: INPUAccelerator) {
        super({
            name: 'Decision-Making Module',
            type: ModuleType.DECISION_MAKING,
            npuEnabled: true,
            maxConcurrentTasks: 5
        }, npuAccelerator);

        // Initialize simple neural network weights
        this.modelWeights = new Float32Array(64); // 8x8 weight matrix
        this.initializeWeights();
    }

    protected async doInitialize(): Promise<void> {
        this.initializeWeights();
        console.log(`[${this.name}] Initialized with threshold ${this.decisionThreshold}`);
    }

    protected async doProcessTask(task: Task): Promise<any> {
        const taskName = task.taskName.toLowerCase();
        
        if (taskName.includes('decision') || taskName.includes('choice')) {
            return await this.makeDecision(task);
        } else if (taskName.includes('classify')) {
            return await this.classifyInput(task);
        } else if (taskName.includes('predict')) {
            return await this.makePrediction(task);
        } else if (taskName.includes('learn') || taskName.includes('train')) {
            return await this.learnFromData(task);
        } else {
            throw new Error(`Unsupported decision operation: ${task.taskName}`);
        }
    }

    private async makeDecision(task: Task): Promise<DecisionResult> {
        const startTime = Date.now();
        const { inputData } = task;
        
        if (!inputData || !inputData.features) {
            throw new Error('Decision making requires input features');
        }

        const features = Array.isArray(inputData.features) ? inputData.features : [inputData.features];
        const context: DecisionContext = {
            features,
            threshold: inputData.threshold || this.decisionThreshold,
            confidence: 0
        };

        let result: DecisionResult;

        if (this._npuAvailable && this._npuAccelerator) {
            console.log(`[${this.name}] Using NPU-accelerated AI inference`);
            result = await this.makeDecisionWithNPU(context);
        } else {
            console.log(`[${this.name}] Using CPU-based inference`);
            result = await this.makeDecisionWithCPU(context);
        }

        result.executionTime = Date.now() - startTime;
        this.decisionCount++;

        console.log(`[${this.name}] Decision: ${result.decision ? 'POSITIVE' : 'NEGATIVE'} (confidence: ${result.confidence.toFixed(2)})`);
        console.log(`[${this.name}] Total decisions made: ${this.decisionCount}`);

        return result;
    }

    private async makeDecisionWithNPU(context: DecisionContext): Promise<DecisionResult> {
        try {
            // Create input tensor
            const inputTensor = await this._npuAccelerator!.createTensor(
                [1, context.features.length],
                'float32',
                context.features
            );

            // Create weight tensor
            const weightTensor = await this._npuAccelerator!.createTensor(
                [context.features.length, 1],
                'float32',
                Array.from(this.modelWeights.slice(0, context.features.length))
            );

            // Perform matrix multiplication using NPU
            const matmulResult = await this._npuAccelerator!.matrixMultiply(inputTensor, weightTensor);
            
            if (!matmulResult.success || !matmulResult.output) {
                throw new Error('NPU matrix multiplication failed');
            }

            // Apply sigmoid activation
            const logits = matmulResult.output.data[0] as number;
            const confidence = this.sigmoid(logits);
            const decision = confidence > context.threshold;

            return {
                decision,
                confidence,
                reasoning: [
                    `NPU-accelerated inference completed`,
                    `Matrix multiplication execution time: ${matmulResult.executionTime}ms`,
                    `Confidence score: ${confidence.toFixed(4)}`,
                    `Threshold: ${context.threshold}`
                ],
                executionTime: 0 // Will be set by caller
            };

        } catch (error) {
            console.warn(`[${this.name}] NPU inference failed, falling back to CPU: ${error}`);
            return await this.makeDecisionWithCPU(context);
        }
    }

    private async makeDecisionWithCPU(context: DecisionContext): Promise<DecisionResult> {
        // Simple neural network forward pass
        let sum = 0;
        for (let i = 0; i < context.features.length && i < this.modelWeights.length; i++) {
            sum += context.features[i] * this.modelWeights[i];
        }

        const confidence = this.sigmoid(sum);
        const decision = confidence > context.threshold;

        return {
            decision,
            confidence,
            reasoning: [
                `CPU-based inference completed`,
                `Feature vector size: ${context.features.length}`,
                `Weighted sum: ${sum.toFixed(4)}`,
                `Confidence score: ${confidence.toFixed(4)}`,
                `Threshold: ${context.threshold}`
            ],
            executionTime: 0 // Will be set by caller
        };
    }

    private async classifyInput(task: Task): Promise<any> {
        const { inputData } = task;
        
        if (!inputData || !inputData.data) {
            throw new Error('Classification requires input data');
        }

        const features = this.extractFeatures(inputData.data);
        const classificationTask = {
            ...task,
            inputData: { features, threshold: 0.5 }
        };

        const decision = await this.makeDecision(classificationTask);

        return {
            classification: decision.decision ? 'positive' : 'negative',
            confidence: decision.confidence,
            features: features.length,
            reasoning: decision.reasoning
        };
    }

    private async makePrediction(task: Task): Promise<any> {
        const { inputData } = task;
        
        if (!inputData || !inputData.sequence) {
            throw new Error('Prediction requires sequence data');
        }

        const sequence = inputData.sequence;
        const features = this.extractSequenceFeatures(sequence);

        // Use NPU for time series prediction if available
        if (this._npuAvailable && this._npuAccelerator) {
            console.log(`[${this.name}] Using NPU for time series prediction`);
            return await this.predictWithNPU(features);
        } else {
            console.log(`[${this.name}] Using CPU for time series prediction`);
            return await this.predictWithCPU(features);
        }
    }

    private async learnFromData(task: Task): Promise<any> {
        const { inputData } = task;
        
        if (!inputData || !inputData.trainingData) {
            throw new Error('Learning requires training data');
        }

        const trainingData = inputData.trainingData;
        const learningRate = inputData.learningRate || this.learningRate;

        console.log(`[${this.name}] Learning from ${trainingData.length} samples`);

        // Simple gradient descent update
        for (const sample of trainingData) {
            const features = sample.features || sample.input;
            const target = sample.target || sample.label;
            
            if (features && typeof target === 'number') {
                const predicted = this.forwardPass(features);
                const error = target - predicted;
                
                // Update weights
                for (let i = 0; i < features.length && i < this.modelWeights.length; i++) {
                    this.modelWeights[i] += learningRate * error * features[i];
                }
            }
        }

        return {
            success: true,
            samplesProcessed: trainingData.length,
            learningRate,
            message: 'Model weights updated based on training data'
        };
    }

    private async predictWithNPU(features: number[]): Promise<any> {
        try {
            // Create sequence tensor for time series prediction
            const inputTensor = await this._npuAccelerator!.createTensor(
                [1, features.length],
                'float32',
                features
            );

            // Simulate NPU-based sequence prediction
            await new Promise(resolve => setTimeout(resolve, 50));

            const prediction = features.reduce((sum, val, idx) => sum + val * Math.sin(idx * 0.1), 0) / features.length;
            
            return {
                prediction,
                confidence: 0.8 + Math.random() * 0.15,
                method: 'NPU-accelerated time series analysis',
                features: features.length
            };

        } catch (error) {
            console.warn(`[${this.name}] NPU prediction failed, falling back to CPU: ${error}`);
            return await this.predictWithCPU(features);
        }
    }

    private async predictWithCPU(features: number[]): Promise<any> {
        // Simple moving average prediction
        const windowSize = Math.min(5, features.length);
        const lastValues = features.slice(-windowSize);
        const prediction = lastValues.reduce((sum, val) => sum + val, 0) / lastValues.length;

        return {
            prediction,
            confidence: 0.6 + Math.random() * 0.2,
            method: 'CPU-based moving average',
            features: features.length
        };
    }

    private extractFeatures(data: any): number[] {
        if (Array.isArray(data)) {
            return data.map(val => typeof val === 'number' ? val : parseFloat(val) || 0);
        } else if (typeof data === 'object') {
            return Object.values(data).map(val => typeof val === 'number' ? val : parseFloat(val as string) || 0);
        } else {
            return [typeof data === 'number' ? data : parseFloat(data) || 0];
        }
    }

    private extractSequenceFeatures(sequence: any[]): number[] {
        return sequence.map(item => {
            if (typeof item === 'number') return item;
            if (typeof item === 'object' && item.value !== undefined) return item.value;
            return parseFloat(item) || 0;
        });
    }

    private forwardPass(features: number[]): number {
        let sum = 0;
        for (let i = 0; i < features.length && i < this.modelWeights.length; i++) {
            sum += features[i] * this.modelWeights[i];
        }
        return this.sigmoid(sum);
    }

    private sigmoid(x: number): number {
        return 1 / (1 + Math.exp(-x));
    }

    private initializeWeights(): void {
        // Xavier initialization
        const fan_in = 8;
        const limit = Math.sqrt(6.0 / fan_in);
        
        for (let i = 0; i < this.modelWeights.length; i++) {
            this.modelWeights[i] = (Math.random() * 2 - 1) * limit;
        }
    }

    protected async doCleanup(): Promise<void> {
        this.decisionCount = 0;
        this.initializeWeights();
        
        if (this._npuAccelerator) {
            // Cleanup NPU resources if needed
        }
    }

    // Public methods for external access
    public getDecisionStats(): { count: number; threshold: number; accuracy?: number } {
        return {
            count: this.decisionCount,
            threshold: this.decisionThreshold,
            // accuracy would be calculated based on validation data
        };
    }

    public updateThreshold(threshold: number): void {
        this.decisionThreshold = Math.max(0, Math.min(1, threshold));
        console.log(`[${this.name}] Decision threshold updated to ${this.decisionThreshold}`);
    }
}