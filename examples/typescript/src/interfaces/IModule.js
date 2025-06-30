"use strict";
/**
 * Copyright © 2024 Intel Corporation
 * SPDX-License-Identifier: Apache 2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskStatus = exports.ModuleType = void 0;
var ModuleType;
(function (ModuleType) {
    ModuleType["MEMORY"] = "memory";
    ModuleType["DECISION_MAKING"] = "decision_making";
    ModuleType["SENSORY_PROCESSING"] = "sensory_processing";
})(ModuleType = exports.ModuleType || (exports.ModuleType = {}));
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["PENDING"] = "pending";
    TaskStatus["PROCESSING"] = "processing";
    TaskStatus["COMPLETED"] = "completed";
    TaskStatus["FAILED"] = "failed";
})(TaskStatus = exports.TaskStatus || (exports.TaskStatus = {}));
