import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ConversionResult {
  code: string;
  language: string;
  explanation: string;
  logicCheck: string;
}

export interface ValidationResult {
  isValid: boolean;
  feedback: string;
  suggestions: string[];
}

export async function validatePseudocode(pseudocode: string, problem?: string): Promise<ValidationResult> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Analyze the following pseudocode for logical errors, inconsistencies, or missing edge cases.
    ${problem ? `The problem being solved is: ${problem}` : ''}
    Return a JSON object indicating if it's generally valid, providing detailed feedback, and a list of suggestions for improvement.
    
    Pseudocode:
    ${pseudocode}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isValid: { type: Type.BOOLEAN, description: "Whether the logic is sound" },
          feedback: { type: Type.STRING, description: "Detailed analysis of the logic" },
          suggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of specific improvements" }
        },
        required: ["isValid", "feedback", "suggestions"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}") as ValidationResult;
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("Invalid response from AI");
  }
}

export interface AuditResult {
  vulnerabilities: string[];
  performanceIssues: string[];
  hints: string[];
}

export async function auditPseudocode(pseudocode: string, problem?: string): Promise<AuditResult> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Perform a security and quality audit on the following pseudocode. 
    Identify potential vulnerabilities (e.g., logical overflows, infinite loops, security risks if implemented literally) and performance issues.
    ${problem ? `The problem context is: ${problem}` : ''}
    
    CRITICAL: Do not provide the corrected code or the full solution. Your goal is to guide the user to find the solution themselves. 
    Provide hints that point to the problematic areas without spoiling the fix.
    
    Pseudocode:
    ${pseudocode}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          vulnerabilities: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of potential security or logical vulnerabilities" },
          performanceIssues: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of potential performance bottlenecks" },
          hints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Hints to help the user fix the issues without spoiling the solution" }
        },
        required: ["vulnerabilities", "performanceIssues", "hints"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}") as AuditResult;
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("Invalid response from AI");
  }
}

export interface RefinementResult {
  clarifications: string[];
  edgeCases: string[];
}

export interface ProblemValidation {
  score: number; // 0-100
  missingElements: string[];
  isClear: boolean;
  feedback: string;
}

export async function validateProblem(problem: string): Promise<ProblemValidation> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Evaluate the following problem statement for completeness and clarity. 
    A good problem statement should have:
    1. A clear objective/goal.
    2. Defined input format/data.
    3. Defined output format/result.
    4. Constraints or specific rules.
    
    Problem Statement:
    ${problem}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER, description: "Completeness score from 0 to 100" },
          missingElements: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "List of missing standard sections (e.g., 'Input format', 'Constraints')"
          },
          isClear: { type: Type.BOOLEAN, description: "Whether the core logic is understandable" },
          feedback: { type: Type.STRING, description: "Brief constructive feedback" }
        },
        required: ["score", "missingElements", "isClear", "feedback"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}") as ProblemValidation;
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("Invalid response from AI");
  }
}

export async function refineProblem(problem: string): Promise<RefinementResult> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Analyze the following problem statement for a software algorithm. 
    Identify missing requirements, ambiguities, or edge cases that the developer should consider.
    Provide a list of clarifying questions and potential edge cases.
    
    Problem Statement:
    ${problem}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          clarifications: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Questions to clarify the requirements" },
          edgeCases: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Edge cases to consider" }
        },
        required: ["clarifications", "edgeCases"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}") as RefinementResult;
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("Invalid response from AI");
  }
}

export async function generateFlowchart(pseudocode: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Convert the following pseudocode into a Mermaid.js flowchart (graph TD). 
    The flowchart should be clear, logical, and show the control flow (loops, conditionals, etc.).
    Only return the Mermaid code block starting with 'graph TD'.
    
    Pseudocode:
    ${pseudocode}`,
  });

  // Clean up the response to ensure it's just the Mermaid code
  let text = response.text || "";
  text = text.replace(/```mermaid/g, "").replace(/```/g, "").trim();
  if (!text.startsWith("graph TD")) {
    text = "graph TD\n" + text;
  }
  return text;
}

export async function suggestPseudocode(problem: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Based on the following problem statement, suggest a high-level pseudocode structure to solve it. 
    The pseudocode should be clear, logical, and easy to follow, but not overly detailed implementation code.
    
    Problem Statement:
    ${problem}`,
  });

  return response.text || "";
}

export async function convertPseudocodeToCode(pseudocode: string, targetLanguage: string = "typescript", problem?: string): Promise<ConversionResult> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Convert the following pseudocode into high-quality, production-ready ${targetLanguage} code. 
    ${problem ? `The problem being solved is: ${problem}` : ''}
    Also provide a brief explanation of the logic and a 'logic check' which evaluates if the pseudocode was sound or had flaws.
    
    Pseudocode:
    ${pseudocode}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          code: { type: Type.STRING, description: "The generated source code" },
          language: { type: Type.STRING, description: "The programming language used" },
          explanation: { type: Type.STRING, description: "Brief explanation of how the pseudocode was interpreted" },
          logicCheck: { type: Type.STRING, description: "Evaluation of the pseudocode's logic (e.g., 'Sound', 'Missing edge cases', etc.)" }
        },
        required: ["code", "language", "explanation", "logicCheck"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}") as ConversionResult;
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("Invalid response from AI");
  }
}
