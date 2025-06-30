"use strict";
/**
 * Copyright © 2024 Intel Corporation
 * SPDX-License-Identifier: Apache 2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CentralHub = void 0;
const events_1 = require("events");
class CentralHub extends events_1.EventEmitter {
    constructor() {
        super(...arguments);
        this.modules = new Map();
        this.isInitialized = false;
    }
    async initialize() {
        console.log('[Central Hub] Initializing central coordination system...');
        try {
            this.isInitialized = true;
            this.emit('initialized');
            console.log('[Central Hub] Central coordination system ready');
            return true;
        }
        catch (error) {
            console.error('[Central Hub] Initialization failed:', error);
            return false;
        }
    }
    async registerModule(module) {
        if (!this.isInitialized) {
            console.error('[Central Hub] Hub not initialized');
            return false;
        }
        if (this.modules.has(module.type)) {
            console.warn(`[Central Hub] Module ${module.type} already registered, replacing...`);
        }
        this.modules.set(module.type, module);
        // Set up module event listeners
        this.setupModuleEventListeners(module);
        console.log(`[Central Hub] Registered module: ${module.name}`);
        this.emit('moduleRegistered', module);
        return true;
    }
    getModule(type) {
        return this.modules.get(type) || null;
    }
    getAllModules() {
        return Array.from(this.modules.values());
    }
    async initializeAllModules(config) {
        console.log('[Central Hub] Initializing all registered modules...');
        const initPromises = Array.from(this.modules.values()).map(async (module) => {
            try {
                const success = await module.initialize(config);
                if (!success) {
                    console.error(`[Central Hub] Failed to initialize module: ${module.name}`);
                    return false;
                }
                return true;
            }
            catch (error) {
                console.error(`[Central Hub] Error initializing module ${module.name}:`, error);
                return false;
            }
        });
        const results = await Promise.all(initPromises);
        const allSuccess = results.every(result => result);
        if (allSuccess) {
            console.log('[Central Hub] All modules initialized successfully');
            this.emit('allModulesInitialized');
        }
        else {
            console.error('[Central Hub] Some modules failed to initialize');
            this.emit('moduleInitializationFailed');
        }
        return allSuccess;
    }
    async routeTask(task) {
        const module = this.getModule(task.targetModule);
        if (!module) {
            console.error(`[Central Hub] No module found for type: ${task.targetModule}`);
            this.emit('taskRoutingFailed', task, 'Module not found');
            return false;
        }
        if (!module.isInitialized) {
            console.error(`[Central Hub] Module ${module.name} not initialized`);
            this.emit('taskRoutingFailed', task, 'Module not initialized');
            return false;
        }
        try {
            console.log(`[Central Hub] Routing task ${task.id} to ${module.name}`);
            const success = await module.processTask(task);
            if (success) {
                this.emit('taskRouted', task, module);
            }
            else {
                this.emit('taskRoutingFailed', task, 'Module processing failed');
            }
            return success;
        }
        catch (error) {
            console.error(`[Central Hub] Error routing task to ${module.name}:`, error);
            this.emit('taskRoutingFailed', task, error);
            return false;
        }
    }
    getSystemStatus() {
        const modulesStatus = Array.from(this.modules.entries()).map(([type, module]) => ({
            type,
            name: module.name,
            status: module.getStatus(),
            stats: module.stats
        }));
        return {
            isInitialized: this.isInitialized,
            totalModules: this.modules.size,
            modules: modulesStatus,
            overallHealth: this.calculateOverallHealth(modulesStatus)
        };
    }
    calculateOverallHealth(modulesStatus) {
        if (modulesStatus.length === 0)
            return 'error';
        const healthCounts = {
            healthy: 0,
            warning: 0,
            error: 0
        };
        modulesStatus.forEach(module => {
            const health = module.status.health;
            if (health in healthCounts) {
                healthCounts[health]++;
            }
        });
        if (healthCounts.error > 0)
            return 'error';
        if (healthCounts.warning > 0)
            return 'warning';
        return 'healthy';
    }
    setupModuleEventListeners(module) {
        // Forward module events with module context
        module.on('taskStarted', (task) => {
            this.emit('moduleTaskStarted', module, task);
        });
        module.on('taskCompleted', (task) => {
            this.emit('moduleTaskCompleted', module, task);
        });
        module.on('taskFailed', (task, error) => {
            this.emit('moduleTaskFailed', module, task, error);
        });
        module.on('initialized', () => {
            this.emit('moduleInitialized', module);
        });
        module.on('cleanup', () => {
            this.emit('moduleCleanup', module);
        });
    }
    async cleanup() {
        console.log('[Central Hub] Cleaning up central coordination system...');
        try {
            // Cleanup all modules
            const cleanupPromises = Array.from(this.modules.values()).map(module => module.cleanup().catch(error => {
                console.error(`[Central Hub] Error cleaning up module ${module.name}:`, error);
                return false;
            }));
            await Promise.all(cleanupPromises);
            this.modules.clear();
            this.isInitialized = false;
            this.emit('cleanup');
            console.log('[Central Hub] Cleanup completed');
            return true;
        }
        catch (error) {
            console.error('[Central Hub] Cleanup failed:', error);
            return false;
        }
    }
}
exports.CentralHub = CentralHub;
