
import Bytez from "bytez.js";

// Initialize Bytez with the provided key using Env Variable
const key = import.meta.env.VITE_BYTEZ_KEY || "d382d9fb50901d79b3681056b872d8f3";
const sdk = new Bytez(key);

// Load models for different tasks
const objectModel = sdk.model("hustvl/yolos-tiny");
const tableModel = sdk.model("microsoft/table-transformer-detection");
const fashionModel = sdk.model("bigmouse/Fashionpedia57000");
const zeroShotModel = sdk.model("fushh7/llmdet_swin_large_hf");

export interface BoundingBox {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
}

export interface DetectionResult {
    score: number;
    label: string;
    box: BoundingBox;
}

/**
 * Detect objects in an image using Bytez API (hustvl/yolos-tiny).
 * Optimized for general navigation (people, vehicles, furniture).
 */
export const detectObjectsBytez = async (imageInput: string): Promise<DetectionResult[]> => {
    try {
        const { error, output } = await objectModel.run(imageInput);

        if (error) {
            console.error("Bytez Object API Error:", error);
            return [];
        }

        if (output && Array.isArray(output)) {
            return output as DetectionResult[];
        }

        return [];
    } catch (err) {
        console.error("Bytez Detection Failed:", err);
        return [];
    }
};

/**
 * Detect tables in document images using Bytez API (microsoft/table-transformer-detection).
 * Useful for reading mode / document scanning.
 */
export const detectTablesBytez = async (imageInput: string) => {
    try {
        const { error, output } = await tableModel.run(imageInput);
        if (error) {
            console.error("Bytez Table API Error:", error);
            return [];
        }
        return output || [];
    } catch (err) {
        console.error("Bytez Table Detection Failed:", err);
        return [];
    }
};

/**
 * Detect fashion items/clothing using Bytez API (bigmouse/Fashionpedia57000).
 * Useful for describing people or shopping assistance.
 */
export const detectFashionBytez = async (imageInput: string) => {
    try {
        const { error, output } = await fashionModel.run(imageInput);
        if (error) {
            console.error("Bytez Fashion API Error:", error);
            return [];
        }
        return output || [];
    } catch (err) {
        console.error("Bytez Fashion Detection Failed:", err);
        return [];
    }
};

/**
 * Detect custom objects using Zero-Shot Detection (fushh7/llmdet_swin_large_hf).
 * @param imageInput - Image URL or Base64
 * @param candidateLabels - Array of strings to look for (e.g. ["cat", "dog"])
 */
export const detectCustomBytez = async (imageInput: string, candidateLabels: string[]) => {
    try {
        // This model uses a specific input structure
        const payload = {
            candidate_labels: candidateLabels,
            url: imageInput // Bytez usually handles base64 in the 'url' field too, or tries to auto-detect
        };

        const { error, output } = await zeroShotModel.run(payload);

        if (error) {
            console.error("Bytez Zero-Shot API Error:", error);
            return [];
        }
        return output || [];
    } catch (err) {
        console.error("Bytez Zero-Shot Detection Failed:", err);
        return [];
    }
};
