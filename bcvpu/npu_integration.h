//
// Copyright © 2024 Intel Corporation
// SPDX-License-Identifier: Apache 2.0
//

#pragma once

#include <stddef.h>
#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

// Forward declarations
typedef struct NPUContext NPUContext;
typedef struct NPUTensor NPUTensor;
typedef struct NPUModel NPUModel;

// NPU tensor data types
typedef enum {
    NPU_DTYPE_FLOAT16,
    NPU_DTYPE_FLOAT32,
    NPU_DTYPE_INT8,
    NPU_DTYPE_INT4,
    NPU_DTYPE_INT32
} NPUDataType;

// NPU operation types
typedef enum {
    NPU_OP_MATMUL,
    NPU_OP_CONVOLUTION,
    NPU_OP_ELEMENTWISE_ADD,
    NPU_OP_ACTIVATION,
    NPU_OP_POOLING
} NPUOperationType;

// NPU tensor structure
struct NPUTensor {
    void* data;
    size_t* shape;
    uint32_t num_dimensions;
    NPUDataType dtype;
    size_t total_size;
    bool is_allocated;
};

// NPU model structure
struct NPUModel {
    void* openvino_model;
    void* inference_request;
    char model_name[128];
    bool is_compiled;
    bool is_npu_optimized;
};

// NPU context structure
struct NPUContext {
    void* openvino_core;
    char device[32];
    bool is_initialized;
    bool npu_available;
    uint32_t driver_version;
    uint32_t total_operations;
    double total_inference_time_ms;
};

// Core NPU functions
NPUContext* npu_create_context(void);
bool npu_initialize_context(NPUContext* context, const char* device_preference);
bool npu_is_available(NPUContext* context);
uint32_t npu_get_driver_version(NPUContext* context);
void npu_cleanup_context(NPUContext* context);
void npu_destroy_context(NPUContext* context);

// Tensor operations
NPUTensor* npu_create_tensor(const size_t* shape, uint32_t num_dims, NPUDataType dtype);
bool npu_set_tensor_data(NPUTensor* tensor, const void* data, size_t data_size);
bool npu_get_tensor_data(const NPUTensor* tensor, void* data, size_t data_size);
void npu_destroy_tensor(NPUTensor* tensor);

// Matrix operations (for AI inference)
bool npu_matrix_multiply(NPUContext* context, const NPUTensor* input, const NPUTensor* weights, NPUTensor* output);
bool npu_elementwise_add(NPUContext* context, const NPUTensor* a, const NPUTensor* b, NPUTensor* output);
bool npu_activation_relu(NPUContext* context, const NPUTensor* input, NPUTensor* output);

// Model compilation and inference
NPUModel* npu_create_model(NPUContext* context, const char* model_name);
bool npu_compile_simple_model(NPUContext* context, NPUModel* model, 
                              const size_t* input_shape, uint32_t input_dims,
                              const size_t* output_shape, uint32_t output_dims);
bool npu_run_inference(NPUContext* context, NPUModel* model, const NPUTensor* input, NPUTensor* output);
void npu_destroy_model(NPUModel* model);

// BCVPU-specific NPU acceleration functions
bool npu_accelerate_memory_operation(NPUContext* context, const void* data, size_t data_size, const char* operation);
bool npu_accelerate_decision_making(NPUContext* context, const float* features, size_t num_features, float* decision_scores);
bool npu_accelerate_sensory_processing(NPUContext* context, const void* sensor_data, size_t data_size, void* processed_output);

// Utility functions
const char* npu_dtype_to_string(NPUDataType dtype);
size_t npu_get_dtype_size(NPUDataType dtype);
bool npu_validate_tensor_shape(const size_t* shape, uint32_t num_dims);

// Performance monitoring
void npu_reset_performance_counters(NPUContext* context);
void npu_print_performance_stats(const NPUContext* context);

#ifdef __cplusplus
}
#endif