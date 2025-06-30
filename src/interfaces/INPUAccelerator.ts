/**
 * Copyright © 2024 Intel Corporation
 * SPDX-License-Identifier: Apache 2.0
 */

export enum NPUDataType {
    FLOAT16 = 'float16',
    FLOAT32 = 'float32',
    INT8 = 'int8',
    INT4 = 'int4',
    INT32 = 'int32'
}

export enum NPUOperationType {
    MATMUL = 'matmul',
    CONVOLUTION = 'convolution',
    ELEMENTWISE_ADD = 'elementwise_add',
    ACTIVATION = 'activation',
    POOLING = 'pooling'
}

export interface NPUTensorInfo {
    shape: number[];
    dtype: NPUDataType;
    totalSize: number;
}

export interface NPUTensor {
    info: NPUTensorInfo;
    data: ArrayBuffer | Float32Array | Int32Array | Int8Array | Uint8Array;
}

export interface NPUModel {
    name: string;
    isCompiled: boolean;
    isNPUOptimized: boolean;
    inputShape?: number[];
    outputShape?: number[];
}

export interface NPUPerformanceStats {
    totalOperations: number;
    totalInferenceTimeMs: number;
    averageOperationTimeMs: number;
    operationsPerSecond: number;
}

export interface INPUAccelerator {
    readonly isAvailable: boolean;
    readonly isInitialized: boolean;
    readonly device: string;
    readonly driverVersion?: string;
    readonly performanceStats: NPUPerformanceStats;

    /**
     * Initialize NPU accelerator
     */
    initialize(devicePreference?: string): Promise<boolean>;

    /**
     * Check if NPU is available on the system
     */
    checkAvailability(): Promise<boolean>;

    /**
     * Get NPU driver version
     */
    getDriverVersion(): Promise<string | null>;

    /**
     * Create a tensor with specified shape and data type
     */
    createTensor(shape: number[], dtype: NPUDataType): NPUTensor;

    /**
     * Set tensor data
     */
    setTensorData(tensor: NPUTensor, data: ArrayBuffer | TypedArray): boolean;

    /**
     * Get tensor data
     */
    getTensorData(tensor: NPUTensor): ArrayBuffer;

    /**
     * Perform matrix multiplication
     */
    matrixMultiply(input: NPUTensor, weights: NPUTensor): Promise<NPUTensor>;

    /**
     * Perform elementwise addition
     */
    elementwiseAdd(a: NPUTensor, b: NPUTensor): Promise<NPUTensor>;

    /**
     * Apply ReLU activation
     */
    activationRelu(input: NPUTensor): Promise<NPUTensor>;

    /**
     * Create and compile a model
     */
    createModel(name: string): NPUModel;

    /**
     * Compile a model for NPU execution
     */
    compileModel(
        model: NPUModel,
        inputShape: number[],
        outputShape: number[]
    ): Promise<boolean>;

    /**
     * Run inference on a compiled model
     */
    runInference(model: NPUModel, input: NPUTensor): Promise<NPUTensor>;

    /**
     * BCVPU-specific acceleration functions
     */
    accelerateMemoryOperation(data: ArrayBuffer, operation: string): Promise<boolean>;

    accelerateDecisionMaking(features: Float32Array): Promise<Float32Array>;

    accelerateSensoryProcessing(sensorData: ArrayBuffer): Promise<ArrayBuffer>;

    /**
     * Reset performance counters
     */
    resetPerformanceCounters(): void;

    /**
     * Get performance statistics
     */
    getPerformanceStats(): NPUPerformanceStats;

    /**
     * Cleanup NPU resources
     */
    cleanup(): Promise<boolean>;
}