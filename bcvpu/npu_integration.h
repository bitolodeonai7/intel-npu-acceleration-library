//
// Copyright © 2024 Intel Corporation
// SPDX-License-Identifier: Apache 2.0
//

#pragma once

#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

/**
 * @brief NPU acceleration context structure
 */
typedef struct bcvpu_npu_context bcvpu_npu_context_t;

/**
 * @brief NPU operation types
 */
typedef enum {
    BCVPU_NPU_OP_MATRIX_MULTIPLY = 0,
    BCVPU_NPU_OP_CONVOLUTION = 1,
    BCVPU_NPU_OP_POOLING = 2,
    BCVPU_NPU_OP_ELEMENTWISE = 3,
    BCVPU_NPU_OP_ACTIVATION = 4
} bcvpu_npu_operation_t;

/**
 * @brief NPU tensor descriptor
 */
typedef struct {
    void* data;
    size_t* shape;
    size_t rank;
    size_t element_size;
    char dtype[16];
} bcvpu_npu_tensor_t;

/**
 * @brief NPU acceleration status
 */
typedef enum {
    BCVPU_NPU_STATUS_SUCCESS = 0,
    BCVPU_NPU_STATUS_NOT_AVAILABLE = 1,
    BCVPU_NPU_STATUS_INIT_FAILED = 2,
    BCVPU_NPU_STATUS_OPERATION_FAILED = 3,
    BCVPU_NPU_STATUS_INVALID_INPUT = 4
} bcvpu_npu_status_t;

/**
 * @brief Check if NPU is available on the system
 * 
 * @return uint8_t 1 if available, 0 otherwise
 */
uint8_t bcvpu_npu_is_available(void);

/**
 * @brief Initialize NPU context
 * 
 * @param context Pointer to NPU context pointer
 * @return bcvpu_npu_status_t Status of initialization
 */
bcvpu_npu_status_t bcvpu_npu_init_context(bcvpu_npu_context_t** context);

/**
 * @brief Cleanup NPU context
 * 
 * @param context Pointer to NPU context
 * @return bcvpu_npu_status_t Status of cleanup
 */
bcvpu_npu_status_t bcvpu_npu_cleanup_context(bcvpu_npu_context_t* context);

/**
 * @brief Perform matrix multiplication using NPU acceleration
 * 
 * @param context NPU context
 * @param input_a First input tensor
 * @param input_b Second input tensor
 * @param output Output tensor
 * @return bcvpu_npu_status_t Status of operation
 */
bcvpu_npu_status_t bcvpu_npu_matrix_multiply(bcvpu_npu_context_t* context,
                                            const bcvpu_npu_tensor_t* input_a,
                                            const bcvpu_npu_tensor_t* input_b,
                                            bcvpu_npu_tensor_t* output);

/**
 * @brief Perform convolution using NPU acceleration
 * 
 * @param context NPU context
 * @param input Input tensor
 * @param weights Weight tensor
 * @param output Output tensor
 * @return bcvpu_npu_status_t Status of operation
 */
bcvpu_npu_status_t bcvpu_npu_convolution(bcvpu_npu_context_t* context,
                                        const bcvpu_npu_tensor_t* input,
                                        const bcvpu_npu_tensor_t* weights,
                                        bcvpu_npu_tensor_t* output);

/**
 * @brief Perform element-wise operations using NPU acceleration
 * 
 * @param context NPU context
 * @param input_a First input tensor
 * @param input_b Second input tensor
 * @param output Output tensor
 * @param operation Operation type
 * @return bcvpu_npu_status_t Status of operation
 */
bcvpu_npu_status_t bcvpu_npu_elementwise_op(bcvpu_npu_context_t* context,
                                           const bcvpu_npu_tensor_t* input_a,
                                           const bcvpu_npu_tensor_t* input_b,
                                           bcvpu_npu_tensor_t* output,
                                           bcvpu_npu_operation_t operation);

/**
 * @brief Create a tensor with specified dimensions and data type
 * 
 * @param tensor Pointer to tensor structure
 * @param shape Array of dimensions
 * @param rank Number of dimensions
 * @param dtype Data type string (e.g., "float16", "float32")
 * @return bcvpu_npu_status_t Status of creation
 */
bcvpu_npu_status_t bcvpu_npu_create_tensor(bcvpu_npu_tensor_t* tensor,
                                          const size_t* shape,
                                          size_t rank,
                                          const char* dtype);

/**
 * @brief Free tensor resources
 * 
 * @param tensor Pointer to tensor structure
 * @return bcvpu_npu_status_t Status of cleanup
 */
bcvpu_npu_status_t bcvpu_npu_free_tensor(bcvpu_npu_tensor_t* tensor);

/**
 * @brief Get NPU status string
 * 
 * @param status NPU status
 * @return const char* Status string
 */
const char* bcvpu_npu_status_string(bcvpu_npu_status_t status);

/**
 * @brief Get NPU operation string
 * 
 * @param operation NPU operation type
 * @return const char* Operation string
 */
const char* bcvpu_npu_operation_string(bcvpu_npu_operation_t operation);

/**
 * @brief Optimize tensor operations for NPU
 * 
 * @param context NPU context
 * @param input Input tensor
 * @param output Optimized output tensor
 * @return bcvpu_npu_status_t Status of optimization
 */
bcvpu_npu_status_t bcvpu_npu_optimize_tensor(bcvpu_npu_context_t* context,
                                            const bcvpu_npu_tensor_t* input,
                                            bcvpu_npu_tensor_t* output);

#ifdef __cplusplus
}
#endif