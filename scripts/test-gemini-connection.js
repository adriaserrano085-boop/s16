
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env vars
try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    // Check if key is loaded
    if (envConfig.VITE_GEMINI_API_KEY) {
        process.env.VITE_GEMINI_API_KEY = envConfig.VITE_GEMINI_API_KEY;
    }
} catch (e) {
    console.log("Could not load .env.local");
}

const apiKey = process.env.VITE_GEMINI_API_KEY || 'AIzaSyCQ0Pdm3F2eJof-bWF9W8Ysjtt-bnMSJco'; // Fallback to the one user gave

console.log("Testing with API Key: " + apiKey.substring(0, 10) + "...");

const genAI = new GoogleGenerativeAI(apiKey);

const modelsToTest = [
    "gemini-1.5-flash",
    "gemini-pro",
    "gemini-1.0-pro",
    "gemini-1.5-pro"
];

async function testModel(modelName) {
    console.log(`\n--- Testing ${modelName} ---`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hola, esto es una prueba.");
        const response = await result.response;
        console.log(`✅ SUCCESS: ${modelName} responded: ${response.text().substring(0, 20)}...`);
        return true;
    } catch (error) {
        console.log(`❌ FAILED: ${modelName}`);
        console.log(`   Error: ${error.message}`);
        return false;
    }
}

async function runTests() {
    let success = false;
    for (const model of modelsToTest) {
        if (await testModel(model)) {
            success = true;
            console.log(`\n🎉 FOUND WORKING MODEL: ${model}`);
            break; // Stop at first working one
        }
    }

    if (!success) {
        console.log("\n❌ ALL MODELS FAILED. The API Key might be invalid or has no access to Generative Language API.");
    }
}

runTests();
