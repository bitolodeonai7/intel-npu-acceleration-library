/*
 * Copyright © 2024 Intel Corporation
 * SPDX-License-Identifier: Apache 2.0
 */

import { BaseModule } from './BaseModule';
import { ModuleType, Task } from '../interfaces/IModule';
import { INPUAccelerator, Tensor } from '../interfaces/INPUAccelerator';

/**
 * Input processing configuration
 */
interface ProcessingConfig {
    inputChannels: number;
    processingWidth: number;
    processingHeight: number;
    enablePreprocessing: boolean;
}

/**
 * Pattern recognition result
 */
interface PatternResult {
    patterns: string[];
    confidence: number;
    features: number[];
    processingTime: number;
}

/**
 * Sensory Processing Module implementation
 * Handles input processing and pattern recognition with NPU acceleration
 */
export class SensoryProcessingModule extends BaseModule {
    private config: ProcessingConfig;
    private featureFilters: Float32Array[];
    private patternDatabase: Map<string, number[]>;

    constructor(npuAccelerator?: INPUAccelerator | undefined) {
        super({
            name: 'Sensory Processing Module',
            type: ModuleType.SENSORY_PROCESSING,
            npuEnabled: true,
            maxConcurrentTasks: 3
        }, npuAccelerator);

        this.config = {
            inputChannels: 3, // RGB
            processingWidth: 224,
            processingHeight: 224,
            enablePreprocessing: true
        };

        this.featureFilters = [];
        this.patternDatabase = new Map();
        this.initializeFilters();
    }

    protected async doInitialize(): Promise<void> {
        this.initializeFilters();
        this.initializePatternDatabase();
        
        console.log(`[${this.name}] Initialized for ${this.config.processingWidth}x${this.config.processingHeight} inputs with ${this.config.inputChannels} channels`);
    }

    protected async doProcessTask(task: Task): Promise<any> {
        const taskName = task.taskName.toLowerCase();
        
        if (taskName.includes('visual') || taskName.includes('image')) {
            return await this.processVisualInput(task);
        } else if (taskName.includes('audio') || taskName.includes('sound')) {
            return await this.processAudioInput(task);
        } else if (taskName.includes('text') || taskName.includes('language')) {
            return await this.processTextInput(task);
        } else if (taskName.includes('pattern')) {
            return await this.recognizePattern(task);
        } else if (taskName.includes('feature')) {
            return await this.extractFeatures(task);
        } else {
            throw new Error(`Unsupported sensory processing operation: ${task.taskName}`);
        }
    }

    private async processVisualInput(task: Task): Promise<PatternResult> {
        const startTime = Date.now();
        const { inputData } = task;
        
        if (!inputData || !inputData.imageData) {
            throw new Error('Visual processing requires image data');
        }

        console.log(`[${this.name}] Processing visual input data`);

        let result: PatternResult;

        if (this._npuAvailable && this._npuAccelerator) {
            console.log(`[${this.name}] Using NPU-accelerated convolution for pattern recognition`);
            result = await this.processVisualWithNPU(inputData.imageData);
        } else {
            console.log(`[${this.name}] Using CPU-based pattern recognition`);
            result = await this.processVisualWithCPU(inputData.imageData);
        }

        result.processingTime = Date.now() - startTime;
        console.log(`[${this.name}] Visual processing confidence: ${(result.confidence * 100).toFixed(0)}%`);

        return result;
    }

    private async processVisualWithNPU(imageData: number[]): Promise<PatternResult> {
        try {
            // Create input tensor for image data
            const inputTensor = await this._npuAccelerator!.createTensor(
                [1, this.config.inputChannels, this.config.processingHeight, this.config.processingWidth],
                'float32',
                imageData
            );

            // Create convolution filter
            const filterTensor = await this._npuAccelerator!.createTensor(
                [16, this.config.inputChannels, 3, 3], // 16 3x3 filters
                'float32',
                Array.from(this.featureFilters[0])
            );

            // Perform convolution
            const convResult = await this._npuAccelerator!.convolution(inputTensor, filterTensor, {
                stride: [1, 1],
                padding: [1, 1]
            });

            if (!convResult.success || !convResult.output) {
                throw new Error('NPU convolution failed');
            }

            // Extract features from convolution result
            const features = this.extractFeaturesFromTensor(convResult.output);
            const patterns = this.matchPatterns(features);
            const confidence = this.calculateConfidence(features, patterns);

            return {
                patterns,
                confidence,
                features,
                processingTime: 0 // Will be set by caller
            };

        } catch (error) {
            console.warn(`[${this.name}] NPU visual processing failed, falling back to CPU: ${error}`);
            return await this.processVisualWithCPU(imageData);
        }
    }

    private async processVisualWithCPU(imageData: number[]): Promise<PatternResult> {
        // Simple feature extraction using CPU
        const features: number[] = [];
        
        // Calculate basic statistics
        const mean = imageData.reduce((sum, val) => sum + val, 0) / imageData.length;
        const variance = imageData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / imageData.length;
        const max = Math.max(...imageData);
        const min = Math.min(...imageData);

        features.push(mean, variance, max, min);

        // Simple edge detection
        const edgeStrength = this.detectEdges(imageData);
        features.push(edgeStrength);

        // Color histogram (simplified)
        const colorFeatures = this.extractColorFeatures(imageData);
        features.push(...colorFeatures);

        const patterns = this.matchPatterns(features);
        const confidence = this.calculateConfidence(features, patterns);

        return {
            patterns,
            confidence,
            features,
            processingTime: 0 // Will be set by caller
        };
    }

    private async processAudioInput(task: Task): Promise<PatternResult> {
        const startTime = Date.now();
        const { inputData } = task;
        
        if (!inputData || !inputData.audioData) {
            throw new Error('Audio processing requires audio data');
        }

        console.log(`[${this.name}] Processing audio input data`);

        let result: PatternResult;

        if (this._npuAvailable && this._npuAccelerator) {
            console.log(`[${this.name}] Using NPU-accelerated audio feature extraction`);
            result = await this.processAudioWithNPU(inputData.audioData);
        } else {
            console.log(`[${this.name}] Using CPU-based audio processing`);
            result = await this.processAudioWithCPU(inputData.audioData);
        }

        result.processingTime = Date.now() - startTime;
        console.log(`[${this.name}] Audio processing confidence: ${(result.confidence * 100).toFixed(0)}%`);

        return result;
    }

    private async processAudioWithNPU(audioData: number[]): Promise<PatternResult> {
        try {
            // Create audio tensor
            await this._npuAccelerator!.createTensor(
                [1, 1, audioData.length],
                'float32',
                audioData
            );

            // Simulate NPU-based spectral analysis
            await new Promise(resolve => setTimeout(resolve, 30));

            const features = this.extractAudioFeatures(audioData, true);
            const patterns = this.matchAudioPatterns(features);
            const confidence = 0.72 + Math.random() * 0.18; // Simulated confidence

            return {
                patterns,
                confidence,
                features,
                processingTime: 0
            };

        } catch (error) {
            console.warn(`[${this.name}] NPU audio processing failed, falling back to CPU: ${error}`);
            return await this.processAudioWithCPU(audioData);
        }
    }

    private async processAudioWithCPU(audioData: number[]): Promise<PatternResult> {
        const features = this.extractAudioFeatures(audioData, false);
        const patterns = this.matchAudioPatterns(features);
        const confidence = 0.65 + Math.random() * 0.15; // Simulated confidence

        return {
            patterns,
            confidence,
            features,
            processingTime: 0
        };
    }

    private async processTextInput(task: Task): Promise<PatternResult> {
        const startTime = Date.now();
        const { inputData } = task;
        
        if (!inputData || !inputData.text) {
            throw new Error('Text processing requires text data');
        }

        console.log(`[${this.name}] Processing text input: "${inputData.text.substring(0, 50)}..."`);

        // Extract text features
        const features = this.extractTextFeatures(inputData.text);
        const patterns = this.matchTextPatterns(features, inputData.text);
        const confidence = 0.78 + Math.random() * 0.12;

        const result: PatternResult = {
            patterns,
            confidence,
            features,
            processingTime: Date.now() - startTime
        };

        console.log(`[${this.name}] Text processing confidence: ${(result.confidence * 100).toFixed(0)}%`);
        return result;
    }

    private async recognizePattern(task: Task): Promise<any> {
        const { inputData } = task;
        
        if (!inputData || !inputData.pattern) {
            throw new Error('Pattern recognition requires pattern data');
        }

        const pattern = inputData.pattern;
        const similarity = this.calculatePatternSimilarity(pattern);

        return {
            recognized: similarity > 0.7,
            similarity,
            matches: this.findSimilarPatterns(pattern),
            confidence: similarity
        };
    }

    private async extractFeatures(task: Task): Promise<any> {
        const { inputData } = task;
        
        if (!inputData || !inputData.data) {
            throw new Error('Feature extraction requires input data');
        }

        const data = inputData.data;
        let features: number[] = [];

        if (Array.isArray(data)) {
            if (typeof data[0] === 'number') {
                // Numerical data
                features = this.extractNumericalFeatures(data);
            } else {
                // Mixed data
                features = this.extractMixedFeatures(data);
            }
        } else if (typeof data === 'string') {
            features = this.extractTextFeatures(data);
        } else {
            features = this.extractObjectFeatures(data);
        }

        return {
            features,
            dimensionality: features.length,
            type: this.determineDataType(data)
        };
    }

    // Helper methods
    private initializeFilters(): void {
        // Initialize simple edge detection filters
        const edgeFilter = new Float32Array([
            -1, -1, -1,
            -1,  8, -1,
            -1, -1, -1
        ]);

        const blurFilter = new Float32Array([
            1/9, 1/9, 1/9,
            1/9, 1/9, 1/9,
            1/9, 1/9, 1/9
        ]);

        this.featureFilters = [edgeFilter, blurFilter];
    }

    private initializePatternDatabase(): void {
        // Initialize with some common patterns
        this.patternDatabase.set('edge', [1, 0, 1, 0, 1]);
        this.patternDatabase.set('smooth', [0, 1, 0, 1, 0]);
        this.patternDatabase.set('texture', [0.5, 0.7, 0.3, 0.8, 0.4]);
        this.patternDatabase.set('uniform', [0.5, 0.5, 0.5, 0.5, 0.5]);
    }

    private extractFeaturesFromTensor(tensor: Tensor): number[] {
        // Extract features from NPU tensor output
        const data = Array.from(tensor.data) as number[];
        return data.slice(0, 10); // Take first 10 features
    }

    private detectEdges(imageData: number[]): number {
        // Simple edge detection
        let edgeStrength = 0;
        const width = Math.sqrt(imageData.length / this.config.inputChannels);
        
        for (let i = 1; i < width - 1; i++) {
            for (let j = 1; j < width - 1; j++) {
                const idx = i * width + j;
                if (idx < imageData.length - width - 1) {
                    const gradient = Math.abs(imageData[idx] - imageData[idx + 1]) +
                                   Math.abs(imageData[idx] - imageData[idx + width]);
                    edgeStrength += gradient;
                }
            }
        }
        
        return edgeStrength / imageData.length;
    }

    private extractColorFeatures(imageData: number[]): number[] {
        const channelSize = imageData.length / this.config.inputChannels;
        const features: number[] = [];

        for (let c = 0; c < this.config.inputChannels; c++) {
            const channelStart = c * channelSize;
            const channelEnd = (c + 1) * channelSize;
            const channelData = imageData.slice(channelStart, channelEnd);
            
            const mean = channelData.reduce((sum, val) => sum + val, 0) / channelData.length;
            features.push(mean);
        }

        return features;
    }

    private extractAudioFeatures(audioData: number[], useAdvanced: boolean): number[] {
        const features: number[] = [];

        // Basic features
        const mean = audioData.reduce((sum, val) => sum + val, 0) / audioData.length;
        const rms = Math.sqrt(audioData.reduce((sum, val) => sum + val * val, 0) / audioData.length);
        const max = Math.max(...audioData);
        const min = Math.min(...audioData);

        features.push(mean, rms, max, min);

        if (useAdvanced) {
            // Simulate advanced spectral features
            const spectralCentroid = this.calculateSpectralCentroid(audioData);
            const spectralRolloff = this.calculateSpectralRolloff(audioData);
            features.push(spectralCentroid, spectralRolloff);
        }

        return features;
    }

    private extractTextFeatures(text: string): number[] {
        const features: number[] = [];
        
        features.push(text.length);
        features.push(text.split(' ').length);
        features.push(text.split('.').length);
        features.push((text.match(/[A-Z]/g) || []).length / text.length);
        features.push((text.match(/[0-9]/g) || []).length / text.length);

        return features;
    }

    private extractNumericalFeatures(data: number[]): number[] {
        const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
        const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min;

        return [mean, variance, min, max, range];
    }

    private extractMixedFeatures(data: any[]): number[] {
        const numericCount = data.filter(item => typeof item === 'number').length;
        const stringCount = data.filter(item => typeof item === 'string').length;
        const objectCount = data.filter(item => typeof item === 'object').length;

        return [data.length, numericCount, stringCount, objectCount];
    }

    private extractObjectFeatures(data: any): number[] {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const numericValues = values.filter(val => typeof val === 'number') as number[];

        const features = [keys.length, values.length];
        
        if (numericValues.length > 0) {
            features.push(...this.extractNumericalFeatures(numericValues));
        }

        return features;
    }

    private matchPatterns(features: number[]): string[] {
        const matches: string[] = [];
        
        for (const [patternName, patternFeatures] of this.patternDatabase.entries()) {
            const similarity = this.calculateSimilarity(features, patternFeatures);
            if (similarity > 0.6) {
                matches.push(patternName);
            }
        }

        return matches.length > 0 ? matches : ['unknown'];
    }

    private matchAudioPatterns(features: number[]): string[] {
        // Simple audio pattern matching
        const patterns: string[] = [];
        
        if (features[1] > 0.5) patterns.push('high-energy');
        if (features[0] < 0.1) patterns.push('quiet');
        if (features[2] - features[3] > 0.8) patterns.push('dynamic');
        
        return patterns.length > 0 ? patterns : ['audio-signal'];
    }

    private matchTextPatterns(features: number[], text: string): string[] {
        const patterns: string[] = [];
        
        if (features[1] > 100) patterns.push('long-text');
        if (features[3] > 0.1) patterns.push('formal');
        if (text.includes('?')) patterns.push('question');
        if (text.includes('!')) patterns.push('exclamation');
        
        return patterns.length > 0 ? patterns : ['text'];
    }

    private calculateConfidence(features: number[], patterns: string[]): number {
        // Simple confidence calculation
        const featureVariance = this.calculateVariance(features);
        const patternConfidence = patterns.length > 0 ? 0.8 : 0.4;
        
        return Math.min(0.95, patternConfidence * (1 - featureVariance / 10));
    }

    private calculateSimilarity(features1: number[], features2: number[]): number {
        const minLength = Math.min(features1.length, features2.length);
        let similarity = 0;
        
        for (let i = 0; i < minLength; i++) {
            const diff = Math.abs(features1[i] - features2[i]);
            similarity += 1 / (1 + diff);
        }
        
        return similarity / minLength;
    }

    private calculateVariance(values: number[]): number {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    }

    private calculateSpectralCentroid(audioData: number[]): number {
        // Simplified spectral centroid calculation
        return audioData.reduce((sum, val, idx) => sum + Math.abs(val) * idx, 0) / 
               audioData.reduce((sum, val) => sum + Math.abs(val), 0);
    }

    private calculateSpectralRolloff(audioData: number[]): number {
        // Simplified spectral rolloff calculation
        const totalEnergy = audioData.reduce((sum, val) => sum + val * val, 0);
        const threshold = 0.85 * totalEnergy;
        
        let cumulativeEnergy = 0;
        for (let i = 0; i < audioData.length; i++) {
            cumulativeEnergy += audioData[i] * audioData[i];
            if (cumulativeEnergy >= threshold) {
                return i / audioData.length;
            }
        }
        
        return 1.0;
    }

    private calculatePatternSimilarity(_pattern: any): number {
        // Simplified pattern similarity
        return 0.7 + Math.random() * 0.2;
    }

    private findSimilarPatterns(_pattern: any): string[] {
        return Array.from(this.patternDatabase.keys()).slice(0, 3);
    }

    private determineDataType(data: any): string {
        if (Array.isArray(data)) {
            if (typeof data[0] === 'number') return 'numerical-array';
            return 'mixed-array';
        } else if (typeof data === 'string') {
            return 'text';
        } else if (typeof data === 'object') {
            return 'object';
        }
        return 'unknown';
    }

    protected async doCleanup(): Promise<void> {
        this.patternDatabase.clear();
        this.initializePatternDatabase();
        
        if (this._npuAccelerator) {
            // Cleanup NPU resources if needed
        }
    }

    // Public methods for external access
    public getProcessingStats(): { patternsRecognized: number; averageConfidence: number } {
        return {
            patternsRecognized: this.patternDatabase.size,
            averageConfidence: 0.75 // Would be calculated from actual processing history
        };
    }

    public addPattern(name: string, features: number[]): void {
        this.patternDatabase.set(name, features);
        console.log(`[${this.name}] Added new pattern: ${name}`);
    }
}