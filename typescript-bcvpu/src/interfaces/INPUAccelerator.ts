/*
 * Copyright © 2024 Intel Corporation
 * SPDX-License-Identifier: Apache 2.0
 */

/**
 * NPU operation types
 */
export enum NPUOperationType {
    MATRIX_MULTIPLY = 'matrix-multiply',
    CONVOLUTION = 'convolution',
    POOLING = 'pooling',
    ELEMENTWISE = 'elementwise',
    ACTIVATION = 'activation'
}

/**
 * NPU status enumeration
 */
export enum NPUStatus {
    SUCCESS = 'success',
    NOT_AVAILABLE = 'not-available',
    INIT_FAILED = 'init-failed',
    OPERATION_FAILED = 'operation-failed',
    INVALID_INPUT = 'invalid-input'
}

/**
 * Tensor descriptor
 */
export interface Tensor {
    readonly data: Float32Array | Int32Array | Int8Array;
    readonly shape: readonly number[];
    readonly dtype: 'float32' | 'float16' | 'int32' | 'int8';
    readonly rank: number;
}

/**
 * NPU device information
 */
export interface NPUDeviceInfo {
    readonly available: boolean;
    readonly deviceName: string;
    readonly driverVersion?: string | undefined;
    readonly maxMemory?: number | undefined;
    readonly computeUnits?: number | undefined;
}

/**
 * NPU operation parameters
 */
export interface NPUOperationParams {
    readonly operation: NPUOperationType;
    readonly inputs: Tensor[];
    readonly parameters?: Record<string, any>;
    readonly optimizationLevel?: 'none' | 'basic' | 'aggressive';
}

/**
 * NPU operation result
 */
export interface NPUOperationResult {
    readonly success: boolean;
    readonly output?: Tensor;
    readonly executionTime: number;
    readonly error?: string;
    readonly profileData?: NPUProfileData;
}

/**
 * NPU profiling data
 */
export interface NPUProfileData {
    readonly operationTime: number;
    readonly memoryTransferTime: number;
    readonly compilationTime: number;
    readonly deviceUtilization: number;
}

/**
 * NPU Accelerator interface
 */
export interface INPUAccelerator {
    readonly deviceInfo: NPUDeviceInfo;
    readonly isInitialized: boolean;

    /**
     * Initialize the NPU accelerator
     */
    initialize(): Promise<NPUStatus>;

    /**
     * Check if NPU is available
     */
    isAvailable(): boolean;

    /**
     * Create a tensor with specified shape and data type
     */
    createTensor(shape: number[], dtype: string, data?: ArrayLike<number>): Promise<Tensor>;

    /**
     * Perform matrix multiplication
     */
    matrixMultiply(inputA: Tensor, inputB: Tensor): Promise<NPUOperationResult>;

    /**
     * Perform convolution operation
     */
    convolution(input: Tensor, weights: Tensor, params?: Record<string, any>): Promise<NPUOperationResult>;

    /**
     * Perform element-wise operations
     */
    elementwiseOp(inputA: Tensor, inputB: Tensor, operation: NPUOperationType): Promise<NPUOperationResult>;

    /**
     * Execute a custom NPU operation
     */
    executeOperation(params: NPUOperationParams): Promise<NPUOperationResult>;

    /**
     * Optimize tensor for NPU execution
     */
    optimizeTensor(tensor: Tensor): Promise<Tensor>;

    /**
     * Get device information
     */
    getDeviceInfo(): NPUDeviceInfo;

    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
}

/**
 * NPU context interface
 */
export interface INPUContext {
    readonly contextId: string;
    readonly deviceInfo: NPUDeviceInfo;

    /**
     * Execute an operation in this context
     */
    execute(operation: NPUOperationParams): Promise<NPUOperationResult>;

    /**
     * Release the context
     */
    release(): Promise<void>;
}