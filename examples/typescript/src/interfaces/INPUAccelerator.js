"use strict";
/**
 * Copyright © 2024 Intel Corporation
 * SPDX-License-Identifier: Apache 2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NPUOperationType = exports.NPUDataType = void 0;
var NPUDataType;
(function (NPUDataType) {
    NPUDataType["FLOAT16"] = "float16";
    NPUDataType["FLOAT32"] = "float32";
    NPUDataType["INT8"] = "int8";
    NPUDataType["INT4"] = "int4";
    NPUDataType["INT32"] = "int32";
})(NPUDataType = exports.NPUDataType || (exports.NPUDataType = {}));
var NPUOperationType;
(function (NPUOperationType) {
    NPUOperationType["MATMUL"] = "matmul";
    NPUOperationType["CONVOLUTION"] = "convolution";
    NPUOperationType["ELEMENTWISE_ADD"] = "elementwise_add";
    NPUOperationType["ACTIVATION"] = "activation";
    NPUOperationType["POOLING"] = "pooling";
})(NPUOperationType = exports.NPUOperationType || (exports.NPUOperationType = {}));
