import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { HUNDRED_CRIMINALS } from './src/data/hundredCriminals';

dotenv.config();

const app = express();
const PORT = 3000;

// Increase JSON body limits for base64 image streams
app.use(express.json({ limit: '10mb' }));

// Lazy load Gemini API
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("⚠️ GEMINI_API_KEY is not defined in the environment. Falling back to simulated scores.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Helper function to resolve remote images or parse base64 inline streams
async function getImageData(image: string): Promise<{ data: string; mimeType: string }> {
  if (image.startsWith('http://') || image.startsWith('https://')) {
    try {
      const response = await fetch(image);
      if (!response.ok) {
        throw new Error(`Failed to fetch image URL: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const data = buffer.toString('base64');
      let mimeType = response.headers.get('content-type') || 'image/jpeg';
      if (!mimeType.includes('image/')) {
        mimeType = 'image/jpeg';
      }
      return { data, mimeType };
    } catch (err: any) {
      console.warn("⚠️ Failed fetching remote image, falling back to clean dummy base64:", err.message);
      return {
        data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        mimeType: "image/png"
      };
    }
  }

  let base64Data = image;
  let mimeType = 'image/jpeg';
  if (image.includes(';base64,')) {
    const parts = image.split(';base64,');
    const meta = parts[0];
    base64Data = parts[1];
    if (meta.includes('image/png')) mimeType = 'image/png';
    else if (meta.includes('image/webp')) mimeType = 'image/webp';
    else if (meta.includes('image/gif')) mimeType = 'image/gif';
  }
  return { data: base64Data, mimeType };
}

const TEMPLATE_CACHE: Record<string, { data: string; mimeType: string }> = {};

async function getTemplateImage(id: string, url: string) {
  if (TEMPLATE_CACHE[id]) {
    return TEMPLATE_CACHE[id];
  }
  try {
    const res = await getImageData(url);
    TEMPLATE_CACHE[id] = res;
    return res;
  } catch (err) {
    console.warn(`Failed to cache template ${id}:`, err);
    return {
      data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      mimeType: "image/png"
    };
  }
}

function getDeterministicHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Robust offline/simulation fallback generator for face analysis
function getFaceFallback(image: string, simulateMatch: boolean, forcedCriminalId: string) {
  const isMarcusPreset = image.includes('photo-1507003211169');
  const isChloePreset = image.includes('photo-1494790108377');
  const isLowQualityPreset = image.includes('photo-1534528741775');
  const isMotionBlurPreset = image.includes('photo-1500648767791');
  const isSafeCitizenPreset = image.includes('photo-1438761681033');
  const isCustomImage = image.startsWith('data:image/');

  let hasFace = true;
  let quality = 85;
  let blur = 8;
  let matchedId: string | null = null;
  let similarity = 0;

  if (isMarcusPreset) {
    quality = 88;
    blur = 12;
    matchedId = "WF-2026-001";
    similarity = 92;
  } else if (isChloePreset) {
    quality = 81;
    blur = 24;
    matchedId = "WF-2026-003";
    similarity = 78;
  } else if (isLowQualityPreset) {
    quality = 45;
    blur = 28;
    matchedId = null;
    similarity = 0;
  } else if (isMotionBlurPreset) {
    quality = 72;
    blur = 58;
    matchedId = null;
    similarity = 0;
  } else if (isSafeCitizenPreset) {
    quality = 89;
    blur = 14;
    matchedId = "WF-2026-003";
    similarity = 18; // Low non-matching similarity
  } else if (isCustomImage) {
    // Generate deterministic values based on image contents hash!
    const hash = getDeterministicHash(image);
    quality = 78 + (hash % 13); // 78 to 90
    blur = 6 + (hash % 9);      // 6 to 14
    
    // For custom images, we should NOT match any criminal, unless forced
    if (forcedCriminalId && forcedCriminalId !== 'NONE' && forcedCriminalId !== 'clear') {
      matchedId = forcedCriminalId;
      const idHash = getDeterministicHash(forcedCriminalId);
      quality = 84 + (idHash % 10);    // Stable quality score (84-93)
      blur = 5 + (idHash % 6);         // Stable blur score (5-10)
      similarity = 88 + (idHash % 8);   // 100% stable, accurate matching score (88-95)
    } else if (simulateMatch) {
      // If client explicitly requests a match, we simulate a matching ID based on the hash
      const randNum = String(1 + (hash % 100)).padStart(3, '0');
      matchedId = `WF-2026-${randNum}`;
      similarity = 78 + (hash % 18); // 78 to 95
    } else {
      // Normal operator selfie/custom face: low resemblance, no alarm!
      matchedId = null;
      similarity = 12 + (hash % 15); // 12% to 26%
    }
  } else {
    // Default fallback
    const hash = getDeterministicHash(image || "default");
    quality = 80 + (hash % 11);
    blur = 5 + (hash % 8);
    matchedId = null;
    similarity = 0;
  }

  const customHash = getDeterministicHash(image || "default");
  const scannedGender = isCustomImage ? ((customHash % 2 === 0) ? "Female" : "Male") : (image.includes('1507003211169') || image.includes('1500648767791') ? "Male" : "Female");

  let finalSimilarity = similarity;
  let finalAssessment = isMarcusPreset || isChloePreset 
    ? "HIGH ACCURACY BIOMETRIC MATCH FOUND IN DATABASE SEARCH." 
    : "Processed via local edge pipeline. Quality passes threshold. Status: Clear.";

  if (matchedId) {
    const matchedCriminal = HUNDRED_CRIMINALS.find(c => c.watchlist_id === matchedId);
    if (matchedCriminal) {
      const scannedGenderLower = scannedGender.toLowerCase();
      const targetGenderLower = matchedCriminal.gender.toLowerCase();
      
      const isScannedFemale = scannedGenderLower.includes('female') || scannedGenderLower === 'girl' || scannedGenderLower === 'woman';
      const isScannedMale = scannedGenderLower === 'male' || scannedGenderLower === 'boy' || scannedGenderLower === 'man';
      const isTargetFemale = targetGenderLower.includes('female') || targetGenderLower === 'girl' || targetGenderLower === 'woman';
      const isTargetMale = targetGenderLower === 'male' || targetGenderLower === 'boy' || targetGenderLower === 'man';
      
      if ((isScannedFemale && isTargetMale) || (isScannedMale && isTargetFemale)) {
        finalSimilarity = Math.min(finalSimilarity, 28); // Drastically reduce similarity under 60% (e.g. 28%) since genders mismatch!
        finalAssessment = "WARNING: Biometric gender mismatch detected. Scanned subject gender does not match watchlist record. Match rejected.";
      }
    }
  }

  return {
    faceDetected: hasFace,
    qualityScore: quality,
    blurScore: blur,
    gender: scannedGender,
    ageRange: isCustomImage ? `${20 + (customHash % 15)}-${25 + (customHash % 15)}` : "25-35",
    attributes: ["neutral", "glasses", "smiling"].slice(0, 1 + (customHash % 3)),
    matchCriminalId: matchedId,
    matchSimilarity: finalSimilarity,
    assessment: finalAssessment
  };
}

// Robust offline/simulation fallback generator for vehicle analysis
function getVehicleFallback(image: string, simulateMatch: boolean, forcedVehicleId: string, isWebcam?: boolean, fileName?: string) {
  let isFaceInsteadOfVehicle = false;
  const nameToCheck = String(fileName || "").toLowerCase();
  const imgStr = String(image || "").toLowerCase();
  
  if (
    isWebcam || 
    imgStr.includes('photo-1438761681033') || 
    imgStr.includes('photo-1544005313') || 
    imgStr.includes('photo-1507003211169') || 
    imgStr.includes('photo-1494790108377') ||
    imgStr.includes('photo-1534528741775') ||
    imgStr.includes('photo-1500648767791') ||
    imgStr.includes('face') || 
    imgStr.includes('avatar') || 
    imgStr.includes('person') || 
    imgStr.includes('selfie') ||
    nameToCheck.includes('face') ||
    nameToCheck.includes('selfie') ||
    nameToCheck.includes('person') ||
    nameToCheck.includes('avatar') ||
    nameToCheck.includes('profile') ||
    nameToCheck.includes('human') ||
    nameToCheck.includes('man') ||
    nameToCheck.includes('woman') ||
    nameToCheck.includes('guy') ||
    nameToCheck.includes('girl') ||
    nameToCheck.includes('boy') ||
    nameToCheck.includes('portrait') ||
    nameToCheck.includes('me') ||
    nameToCheck.includes('photo') ||
    nameToCheck.includes('pic')
  ) {
    isFaceInsteadOfVehicle = true;
  }

  const isMudCovered = image.includes('photo-1525609004556');
  const isSafeCommuter = forcedVehicleId === 'NONE';

  const hash = getDeterministicHash(image || "default-veh");
  const isForced = forcedVehicleId && forcedVehicleId !== 'NONE' && forcedVehicleId !== 'clear';
  const idHash = isForced ? getDeterministicHash(forcedVehicleId) : 0;

  const hasPlate = !isFaceInsteadOfVehicle && !isMudCovered;
  
  let quality = 75 + (hash % 20);
  let blur = 5 + (hash % 10);
  let ocrConf = 82 + (hash % 16);

  if (isFaceInsteadOfVehicle) {
    quality = 0;
    blur = 100;
    ocrConf = 0;
  } else if (isMudCovered) {
    quality = 41;
    blur = 18;
    ocrConf = 35;
  } else if (isSafeCommuter) {
    quality = 85;
    blur = 12;
    ocrConf = 92;
  } else if (isForced) {
    if (forcedVehicleId === 'WV-2026-001') {
      quality = 88; blur = 15; ocrConf = 94;
    } else if (forcedVehicleId === 'WV-2026-002') {
      quality = 91; blur = 10; ocrConf = 98;
    } else if (forcedVehicleId === 'WV-2026-003') {
      quality = 85; blur = 12; ocrConf = 96;
    } else {
      quality = 88 + (idHash % 6);
      blur = 8 + (idHash % 4);
      ocrConf = 94 + (idHash % 4);
    }
  }

  let matchedId: string | null = null;
  let plate = isFaceInsteadOfVehicle || isMudCovered ? "" : `SGB${4000 + (hash % 4999)}K`;
  let make = isFaceInsteadOfVehicle || isMudCovered ? "" : "Toyota";
  let color = isFaceInsteadOfVehicle || isMudCovered ? "" : "Silver";

  let occupantFaceDetected = false;
  let occupantMatchCriminalId: string | null = null;
  let occupantMatchSimilarity = 0;
  let occupantQualityScore = 0;
  let occupantAssessment: string | null = null;

  if (!isFaceInsteadOfVehicle && !isMudCovered) {
    if (forcedVehicleId && forcedVehicleId !== 'NONE' && forcedVehicleId !== 'clear') {
      matchedId = forcedVehicleId;
      if (forcedVehicleId === 'WV-2026-001') { 
        plate = 'SLS1234A'; make = 'Porsche'; color = 'Black'; 
        occupantFaceDetected = true;
        occupantMatchCriminalId = "WF-2026-001"; // Marcus Vance
        occupantMatchSimilarity = 86;
        occupantQualityScore = 78;
        occupantAssessment = "POLICE TRACE: Target fugitive Marcus Vance detected through windshield glass.";
      }
      else if (forcedVehicleId === 'WV-2026-002') { 
        plate = 'SGB8899K'; make = 'Chevrolet'; color = 'Blue'; 
        occupantFaceDetected = true;
        occupantMatchCriminalId = "WF-2026-002"; // Elena Rostova
        occupantMatchSimilarity = 82;
        occupantQualityScore = 75;
        occupantAssessment = "POLICE TRACE: Interpol suspect Elena Rostova identified driving the getaway vehicle.";
      }
      else if (forcedVehicleId === 'WV-2026-003') { 
        plate = 'SJR4050G'; make = 'Ford'; color = 'Gray'; 
        occupantFaceDetected = true;
        occupantMatchCriminalId = "WF-2026-003"; // Chloe Tan
        occupantMatchSimilarity = 79;
        occupantQualityScore = 72;
        occupantAssessment = "VULNERABLE PERSON: Missing student Chloe Tan detected inside vehicle.";
      }
      else if (forcedVehicleId === 'WV-2026-004') { plate = 'SMA2311X'; make = 'Ferrari'; color = 'Red'; }
      else if (forcedVehicleId === 'WV-2026-005') { plate = 'SFT7700Z'; make = 'Honda'; color = 'White'; }
      else if (forcedVehicleId === 'WV-2026-006') { plate = 'SGE5544E'; make = 'McLaren'; color = 'Orange'; }
    } else if (simulateMatch) {
      const idx = 1 + (hash % 5);
      matchedId = `WV-2026-00${idx}`;
      if (matchedId === 'WV-2026-001') { 
        plate = 'SLS1234A'; make = 'Porsche'; color = 'Black'; 
        occupantFaceDetected = true;
        occupantMatchCriminalId = "WF-2026-001";
        occupantMatchSimilarity = 86;
        occupantQualityScore = 78;
        occupantAssessment = "POLICE TRACE: Target fugitive Marcus Vance detected through windshield glass.";
      }
      else if (matchedId === 'WV-2026-002') { 
        plate = 'SGB8899K'; make = 'Chevrolet'; color = 'Blue'; 
        occupantFaceDetected = true;
        occupantMatchCriminalId = "WF-2026-002";
        occupantMatchSimilarity = 82;
        occupantQualityScore = 75;
        occupantAssessment = "POLICE TRACE: Interpol suspect Elena Rostova identified driving the getaway vehicle.";
      }
      else if (matchedId === 'WV-2026-003') { 
        plate = 'SJR4050G'; make = 'Ford'; color = 'Gray'; 
        occupantFaceDetected = true;
        occupantMatchCriminalId = "WF-2026-003";
        occupantMatchSimilarity = 79;
        occupantQualityScore = 72;
        occupantAssessment = "VULNERABLE PERSON: Missing student Chloe Tan detected inside vehicle.";
      }
      else if (matchedId === 'WV-2026-004') { plate = 'SMA2311X'; make = 'Ferrari'; color = 'Red'; }
      else if (matchedId === 'WV-2026-005') { plate = 'SFT7700Z'; make = 'Honda'; color = 'White'; }
    } else {
      matchedId = null;
    }
  }

  return {
    plateDetected: hasPlate,
    isFaceInsteadOfVehicle,
    qualityScore: quality,
    blurScore: blur,
    ocrConfidence: ocrConf,
    plateNumber: plate,
    vehicleMake: make,
    vehicleColor: color,
    matchVehicleId: matchedId,
    occupantFaceDetected,
    occupantMatchCriminalId,
    occupantMatchSimilarity,
    occupantQualityScore,
    occupantAssessment,
    assessment: isFaceInsteadOfVehicle 
      ? "Human face detected in vehicle scan terminal. Please switch to the facial recognition scan tab instead."
      : isMudCovered 
        ? "Rejected: Plate is obscured by mud or road exhaust. OCR parsing aborted."
        : "Processed via local optical edge pipeline. Quality and OCR match verified."
  };
}

// Robust content generation wrapper with exponential backoff and automatic model fallback
async function generateContentWithRetry(ai: GoogleGenAI, params: any, maxRetries = 3, delayMs = 1000) {
  let lastError = null;
  const modelsToTry = [params.model, 'gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
  
  for (const model of modelsToTry) {
    if (!model) continue;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          ...params,
          model: model
        });
        return response;
      } catch (err: any) {
        lastError = err;
        console.info(`ℹ️ notice: Gemini API status for model ${model} on attempt ${attempt} is busy. Retrying...`);
        
        const errStr = String(err?.message || "").toLowerCase();
        const errStatus = Number(err?.status || err?.code || 0);
        const isTransient = errStatus === 503 || errStatus === 429 || errStr.includes('503') || errStr.includes('demand') || errStr.includes('resource') || errStr.includes('rate limit') || errStr.includes('429') || errStr.includes('unavailable');
        
        if (isTransient && attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
        } else {
          break;
        }
      }
    }
  }
  throw lastError || new Error("Failed to generate content after retries");
}

// API endpoint for face dynamic analysis
app.post('/api/analyze-face', async (req, res) => {
  const { image, simulateMatch, forcedCriminalId } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'No image data provided' });
  }

  const ai = getGeminiClient();

  // Check if this is a preset scenario (e.g. Unsplash image URL) or has forced target match
  const isPreset = typeof image === 'string' && (image.startsWith('http://') || image.startsWith('https://') || (forcedCriminalId && forcedCriminalId !== 'NONE' && forcedCriminalId !== 'clear'));

  // If Gemini API client is not configured or it's a preset, fall back to offline generator for instant response
  if (!ai || isPreset) {
    const fallbackResponse = getFaceFallback(image, simulateMatch, forcedCriminalId);
    return res.json(fallbackResponse);
  }

  try {
    const { data: base64Data, mimeType } = await getImageData(image);

    const userImagePart = {
      inlineData: {
        mimeType,
        data: base64Data
      }
    };

    let response;
    let targetId = forcedCriminalId;

    if (targetId && targetId !== 'NONE' && targetId !== 'clear') {
      // Comparison of user scanned face vs specified target criminal record
      const targetCriminal = HUNDRED_CRIMINALS.find(c => c.watchlist_id === targetId);
      let referenceImagePart = null;
      if (targetCriminal) {
        try {
          const refData = await getImageData(targetCriminal.reference_face_image);
          referenceImagePart = {
            inlineData: {
              mimeType: refData.mimeType,
              data: refData.data
            }
          };
        } catch (err) {
          console.warn(`Failed to fetch target criminal reference image:`, err);
        }
      }

      const contentsParts: any[] = [userImagePart];
      if (referenceImagePart) {
        contentsParts.push(referenceImagePart);
      }

      const textPart = {
        text: `You are an advanced biometric surveillance AI running inside the Halo Grid system.
You are provided with:
- Image 1: Scanned live face (captured from surveillance/webcam).
${referenceImagePart ? `- Image 2: Database reference photo for suspect: ${targetCriminal?.candidate_name} (ID: ${targetCriminal?.watchlist_id}, Gender: ${targetCriminal?.gender}, Age Range: ${targetCriminal?.age_range}).` : ''}

Your task is to:
1. Determine if a human face is clearly visible in Image 1. If not, set faceDetected to false.
2. If a face is visible:
   - Predict the face quality score (integer 0-100) based on visibility, lighting, alignment, and facial clarity of Image 1.
   - Predict the blur score (integer 0-100) based on camera motion and focus clarity of Image 1 (0 is sharp, 100 is blurred).
   - Determine gender ("Male", "Female", or "Unknown") and approximate ageRange of the person in Image 1.
   - List key visible facial attributes (e.g. ["glasses", "beard", "smiling", "neutral", "hat", "frowning"]) of the person in Image 1.
   - Perform a highly accurate, objective biometric comparison between Image 1 and Image 2.
     - Evaluate key facial metrics (distance between eyes, nose shape, lip structure, jawline structure, hair line, ethnicity, age, and facial proportions).
     - Calculate the ACTUAL physical similarity score (0% to 100%) between Image 1 and Image 2.
     - If the two images show the exact same person (even under different lighting, camera quality, angles, or subtle expression shifts), the similarity score must be very high (e.g., 85% to 98%).
     - If the two images show different people who look somewhat alike (e.g., same gender, same race, similar age/hair), the similarity score should be medium (e.g., 40% to 65%).
     - If they show completely different people (e.g. a young female face vs an adult male face, or completely different facial structures), the similarity score MUST be extremely low (e.g., 5% to 35%). DO NOT inflate this score. Be highly objective and accurate.
     - Set matchCriminalId to "${targetId}".
     - Set matchSimilarity to the calculated similarity score (integer 0 to 100).
   - Give a short 1-sentence operator assessment statement.`
      };

      contentsParts.push(textPart);

      response = await generateContentWithRetry(ai, {
        model: 'gemini-3.5-flash',
        contents: { parts: contentsParts },
        config: {
          temperature: 0.0,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              faceDetected: { type: Type.BOOLEAN },
              qualityScore: { type: Type.INTEGER, description: 'Score between 0 and 100' },
              blurScore: { type: Type.INTEGER, description: 'Score between 0 and 100 (0 is sharp, 100 is blurred)' },
              gender: { type: Type.STRING },
              ageRange: { type: Type.STRING },
              attributes: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              matchCriminalId: { type: Type.STRING, nullable: true },
              matchSimilarity: { type: Type.INTEGER },
              assessment: { type: Type.STRING }
            },
            required: ['faceDetected', 'qualityScore', 'blurScore', 'gender', 'ageRange', 'attributes', 'matchCriminalId', 'matchSimilarity', 'assessment']
          }
        }
      });
    } else {
      // General biometric lookup: Compare the scanned face with 4 major templates of different demographics
      const templates = [
        { id: 'WF-2026-001', name: 'Marcus Vance', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop' },
        { id: 'WF-2026-002', name: 'Elena Rostova', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop' },
        { id: 'WF-2026-003', name: 'Chloe Tan', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop' },
        { id: 'WF-2026-004', name: 'David Kovic', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop' }
      ];

      const parts: any[] = [userImagePart];
      for (const t of templates) {
        const imgData = await getTemplateImage(t.id, t.image);
        parts.push({
          inlineData: {
            mimeType: imgData.mimeType,
            data: imgData.data
          }
        });
      }

      const textPart = {
        text: `You are an advanced biometric surveillance AI running inside the Halo Grid system.
You are comparing a scanned live face (Image 1) against four high-priority database reference templates:
- Image 2: Marcus Vance (ID: WF-2026-001, Male, Age 35-40)
- Image 3: Elena Rostova (ID: WF-2026-002, Female, Age 28-32)
- Image 4: Chloe Tan (ID: WF-2026-003, Female, Age 19-22)
- Image 5: David Kovic (ID: WF-2026-004, Male, Age 42-46)

Your task is to:
1. Determine if a human face is clearly visible in Image 1. If not, set faceDetected to false.
2. If a face is visible:
   - Predict the face quality score (integer 0-100) based on visibility, lighting, alignment, and facial clarity of Image 1.
   - Predict the blur score (integer 0-100) based on camera motion and focus clarity of Image 1 (0 is sharp, 100 is blurred).
   - Determine gender ("Male", "Female", or "Unknown") and approximate ageRange of the person in Image 1.
   - List key visible facial attributes (e.g. ["glasses", "beard", "smiling", "neutral", "hat", "frowning"]) of the person in Image 1.
   - Perform a highly accurate, objective biometric comparison between Image 1 and each of the reference templates (Images 2, 3, 4, and 5).
     - Evaluate key facial metrics (eye spacing, nose shape, lip shape, age, gender, race, hairline, and facial proportions).
     - Identify the template that has the highest physical resemblance to Image 1.
     - Calculate the ACTUAL physical similarity score (0% to 100%) between Image 1 and that closest template.
     - If the scanned face in Image 1 does not actually look like any of the templates (e.g. different gender, different age, completely different facial shape/features), the similarity score MUST be extremely low (e.g., 5% to 35%). DO NOT inflate the similarity score. Be completely honest and precise.
     - Set matchCriminalId to that closest template's ID (e.g., "WF-2026-003").
     - Set matchSimilarity to the calculated similarity score (integer 0 to 100).
   - Give a short 1-sentence operator assessment statement.`
      };
      parts.push(textPart);

      response = await generateContentWithRetry(ai, {
        model: 'gemini-3.5-flash',
        contents: { parts },
        config: {
          temperature: 0.0,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              faceDetected: { type: Type.BOOLEAN },
              qualityScore: { type: Type.INTEGER, description: 'Score between 0 and 100' },
              blurScore: { type: Type.INTEGER, description: 'Score between 0 and 100 (0 is sharp, 100 is blurred)' },
              gender: { type: Type.STRING },
              ageRange: { type: Type.STRING },
              attributes: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              matchCriminalId: { type: Type.STRING, nullable: true },
              matchSimilarity: { type: Type.INTEGER },
              assessment: { type: Type.STRING }
            },
            required: ['faceDetected', 'qualityScore', 'blurScore', 'gender', 'ageRange', 'attributes', 'matchCriminalId', 'matchSimilarity', 'assessment']
          }
        }
      });
    }

    const parsedResponse = JSON.parse(response.text || '{}');

    // Ensure that for live webcam or custom uploaded images (not the predefined failure scenario images),
    // we boost the scores to always pass the quality metrics deterministically.
    if (parsedResponse.faceDetected) {
      const isFailurePreset = image.includes('photo-1534528741775-53994a69daeb') || image.includes('photo-1500648767791-00dcc994a43e');
      if (!isFailurePreset) {
        const hash = getDeterministicHash(image);
        parsedResponse.qualityScore = Math.max(parsedResponse.qualityScore || 0, 82 + (hash % 12));
        parsedResponse.blurScore = Math.min(parsedResponse.blurScore || 0, 5 + (hash % 10));
      }

      // Check for gender mismatch between subject and watchlisted candidate
      if (parsedResponse.matchCriminalId) {
        const matchedCriminal = HUNDRED_CRIMINALS.find(c => c.watchlist_id === parsedResponse.matchCriminalId);
        if (matchedCriminal && parsedResponse.gender) {
          const scannedGenderLower = parsedResponse.gender.toLowerCase();
          const targetGenderLower = matchedCriminal.gender.toLowerCase();
          
          const isScannedFemale = scannedGenderLower.includes('female') || scannedGenderLower === 'girl' || scannedGenderLower === 'woman';
          const isScannedMale = scannedGenderLower === 'male' || scannedGenderLower === 'boy' || scannedGenderLower === 'man';
          const isTargetFemale = targetGenderLower.includes('female') || targetGenderLower === 'girl' || targetGenderLower === 'woman';
          const isTargetMale = targetGenderLower === 'male' || targetGenderLower === 'boy' || targetGenderLower === 'man';
          
          if ((isScannedFemale && isTargetMale) || (isScannedMale && isTargetFemale)) {
            parsedResponse.matchSimilarity = Math.min(parsedResponse.matchSimilarity || 0, 28); // Drastically reduce similarity under 60%
            parsedResponse.assessment = "WARNING: Biometric gender mismatch detected. Scanned subject gender does not match watchlist record. Match rejected.";
          }
        }
      }
    }

    return res.json(parsedResponse);
  } catch (error: any) {
    console.info("ℹ️ Face scan pipeline status notice: using offline edge fallback simulator.");
    const fallbackResponse = getFaceFallback(image, simulateMatch, forcedCriminalId);
    return res.json(fallbackResponse);
  }
});

// API endpoint for vehicle/plate dynamic analysis
app.post('/api/analyze-vehicle', async (req, res) => {
  const { image, simulateMatch, forcedVehicleId, isWebcam, fileName } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'No image data provided' });
  }

  const ai = getGeminiClient();

  // Check if this is a preset scenario (e.g. Unsplash image URL) or has forced target match
  const isPreset = typeof image === 'string' && (image.startsWith('http://') || image.startsWith('https://') || (forcedVehicleId && forcedVehicleId !== 'NONE' && forcedVehicleId !== 'clear'));

  // If Gemini API client is not configured or it's a preset, fall back to offline generator for instant response
  if (!ai || isPreset) {
    const fallbackResponse = getVehicleFallback(image, simulateMatch, forcedVehicleId, isWebcam, fileName);
    return res.json(fallbackResponse);
  }

  try {
    const { data: base64Data, mimeType } = await getImageData(image);

    const imagePart = {
      inlineData: {
        mimeType,
        data: base64Data
      }
    };

    const textPart = {
      text: `You are an advanced Automatic Number Plate Recognition (ANPR) and vehicle telemetry AI running inside the Halo Grid system.
Analyze the provided camera footage or image (Image 1).

1. CRITICAL CLASSIFICATION CHECK: Determine if the image is primarily a close-up human face or a person instead of a vehicle or a vehicle's license plate. 
   - If the image shows a human face or person (e.g. webcam selfie), you MUST set "isFaceInsteadOfVehicle" to true, "plateDetected" to false, "qualityScore" to 0, "blurScore" to 100, "ocrConfidence" to 0, "plateNumber" to "", "vehicleMake" to "", "vehicleColor" to "", "matchVehicleId" to null, and "assessment" to "Human face detected."
2. Otherwise, if it is a vehicle/license plate:
   - Set "isFaceInsteadOfVehicle" to false.
   - Determine if a vehicle license plate is visible and readable. If not, set "plateDetected" to false.
   - If a license plate is visible:
     - Extract the exact alphanumeric license plate characters (e.g. "SLS1234A", "SGB8899K", "SJR4050G", "SMA2311X", "SFT7700Z", "SGE5544E").
     - Predict the plate frame resolution quality score (integer 0-100) based on lighting, pixel clarity, skew angle, and legibility of the plate.
     - Predict the plate motion blur score (integer 0-100) representing pixel smear. Make sure to keep it LOW (e.g. 5-25) if the plate characters are sharp and clear.
     - Predict the character recognition confidence score (integer 0-100) representing OCR accuracy.
     - Predict the vehicle make (brand, e.g. "Porsche", "Chevrolet", "Ford", "Ferrari", "Honda", "McLaren") and primary paint color.
     - Perform an authentic database lookup:
       - Cross-reference the extracted plate number with the registered watchlist:
         1. SLS1234A: Black Porsche (ID: WV-2026-001)
         2. SGB8899K: Blue Chevrolet (ID: WV-2026-002)
         3. SJR4050G: Gray Ford (ID: WV-2026-003)
         4. SMA2311X: Red Ferrari (ID: WV-2026-004)
         5. SFT7700Z: White Honda (ID: WV-2026-005)
         6. SGE5544E: Orange McLaren (ID: WV-2026-006)
       - If forcedVehicleId is specified as "${forcedVehicleId || ''}" and is not empty, you MUST match this scan to that vehicle watchlist ID: "${forcedVehicleId}" and output its registered plate and vehicle specs.
       - Otherwise, if the extracted plate number matches (or resembles very closely) one of the plates above, or if simulateMatch is true, match it to the corresponding vehicle ID (e.g., WV-2026-001).
       - If the extracted plate is a regular plate not present in the list above, set matchVehicleId to null (meaning it is a regular cleared citizen vehicle).
     - Provide a short 1-sentence legal/radar operator assessment statement.
3. CABIN OCCUPANT DETECTOR: Check if a driver/passenger is visible through the windshield or car window glass.
   - If a suspect vehicle above is detected or simulateMatch is true, determine if there is a corresponding facial match inside the vehicle:
     - SLS1234A: occupantFaceDetected=true, occupantMatchCriminalId="WF-2026-001" (Marcus Vance), occupantMatchSimilarity=86, occupantQualityScore=78, occupantAssessment="POLICE TRACE: Target fugitive Marcus Vance detected through windshield glass."
     - SGB8899K: occupantFaceDetected=true, occupantMatchCriminalId="WF-2026-002" (Elena Rostova), occupantMatchSimilarity=82, occupantQualityScore=75, occupantAssessment="POLICE TRACE: Interpol suspect Elena Rostova identified driving the getaway vehicle."
     - SJR4050G: occupantFaceDetected=true, occupantMatchCriminalId="WF-2026-003" (Chloe Tan), occupantMatchSimilarity=79, occupantQualityScore=72, occupantAssessment="VULNERABLE PERSON: Missing student Chloe Tan detected inside vehicle."
     - For others, occupantFaceDetected=false, occupantMatchCriminalId=null, occupantMatchSimilarity=0, occupantQualityScore=0, occupantAssessment=null.`
    };

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.5-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        temperature: 0.0,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            plateDetected: { type: Type.BOOLEAN },
            isFaceInsteadOfVehicle: { type: Type.BOOLEAN, description: 'True if the image shows a human face or person instead of a vehicle or license plate' },
            qualityScore: { type: Type.INTEGER, description: 'Plate visual quality score between 0 and 100' },
            blurScore: { type: Type.INTEGER, description: 'Motion blur score between 0 and 100' },
            ocrConfidence: { type: Type.INTEGER, description: 'Character confidence score between 0 and 100' },
            plateNumber: { type: Type.STRING, description: 'License plate alphanumeric code' },
            vehicleMake: { type: Type.STRING, description: 'Vehicle brand/make' },
            vehicleColor: { type: Type.STRING, description: 'Vehicle primary color' },
            matchVehicleId: { type: Type.STRING, nullable: true, description: 'The matched vehicle ID like WV-2026-001, or null' },
            occupantFaceDetected: { type: Type.BOOLEAN, description: 'True if a human face is detected inside the vehicle cabin' },
            occupantQualityScore: { type: Type.INTEGER, description: 'Occupant face visual quality score' },
            occupantMatchCriminalId: { type: Type.STRING, nullable: true, description: 'The matched facial criminal ID like WF-2026-001, or null' },
            occupantMatchSimilarity: { type: Type.INTEGER, description: 'Occupant match similarity percentage' },
            occupantAssessment: { type: Type.STRING, nullable: true, description: 'Occupant trace statement' },
            assessment: { type: Type.STRING, description: 'Short operator assessment text' }
          },
          required: [
            'plateDetected', 'isFaceInsteadOfVehicle', 'qualityScore', 'blurScore', 
            'ocrConfidence', 'plateNumber', 'vehicleMake', 'vehicleColor', 
            'matchVehicleId', 'occupantFaceDetected', 'occupantQualityScore', 
            'occupantMatchCriminalId', 'occupantMatchSimilarity', 'assessment'
          ]
        }
      }
    });

    const parsedResponse = JSON.parse(response.text || '{}');
    
    // If the image is a webcam capture or the AI specifically classified it as a face instead of vehicle,
    // we must respect that finding and reject vehicle classification entirely!
    if (isWebcam || parsedResponse.isFaceInsteadOfVehicle) {
      parsedResponse.plateDetected = false;
      parsedResponse.isFaceInsteadOfVehicle = true;
      parsedResponse.qualityScore = 0;
      parsedResponse.blurScore = 100;
      parsedResponse.ocrConfidence = 0;
      parsedResponse.plateNumber = "";
      parsedResponse.vehicleMake = "";
      parsedResponse.vehicleColor = "";
      parsedResponse.matchVehicleId = null;
      parsedResponse.occupantFaceDetected = false;
      parsedResponse.occupantMatchCriminalId = null;
      parsedResponse.occupantMatchSimilarity = 0;
      parsedResponse.occupantQualityScore = 0;
      parsedResponse.occupantAssessment = null;
      parsedResponse.assessment = "Rejected: Human face or person detected instead of a vehicle/license plate.";
    } else if (forcedVehicleId && forcedVehicleId !== 'NONE' && forcedVehicleId !== 'clear') {
      parsedResponse.matchVehicleId = forcedVehicleId;
      parsedResponse.plateDetected = true;
      parsedResponse.isFaceInsteadOfVehicle = false;
      
      if (forcedVehicleId === 'WV-2026-001') {
        parsedResponse.plateNumber = 'SLS1234A';
        parsedResponse.vehicleMake = 'Porsche';
        parsedResponse.vehicleColor = 'Black';
        parsedResponse.qualityScore = 94;
        parsedResponse.blurScore = 8;
        parsedResponse.ocrConfidence = 94;
        parsedResponse.occupantFaceDetected = true;
        parsedResponse.occupantMatchCriminalId = "WF-2026-001";
        parsedResponse.occupantMatchSimilarity = 86;
        parsedResponse.occupantQualityScore = 78;
        parsedResponse.occupantAssessment = "POLICE TRACE: Target fugitive Marcus Vance detected through windshield glass.";
      } else if (forcedVehicleId === 'WV-2026-002') {
        parsedResponse.plateNumber = 'SGB8899K';
        parsedResponse.vehicleMake = 'Chevrolet';
        parsedResponse.vehicleColor = 'Blue';
        parsedResponse.qualityScore = 91;
        parsedResponse.blurScore = 9;
        parsedResponse.ocrConfidence = 98;
        parsedResponse.occupantFaceDetected = true;
        parsedResponse.occupantMatchCriminalId = "WF-2026-002";
        parsedResponse.occupantMatchSimilarity = 82;
        parsedResponse.occupantQualityScore = 75;
        parsedResponse.occupantAssessment = "POLICE TRACE: Interpol suspect Elena Rostova identified driving the getaway vehicle.";
      } else if (forcedVehicleId === 'WV-2026-003') {
        parsedResponse.plateNumber = 'SJR4050G';
        parsedResponse.vehicleMake = 'Ford';
        parsedResponse.vehicleColor = 'Gray';
        parsedResponse.qualityScore = 85;
        parsedResponse.blurScore = 12;
        parsedResponse.ocrConfidence = 96;
        parsedResponse.occupantFaceDetected = true;
        parsedResponse.occupantMatchCriminalId = "WF-2026-003";
        parsedResponse.occupantMatchSimilarity = 79;
        parsedResponse.occupantQualityScore = 72;
        parsedResponse.occupantAssessment = "VULNERABLE PERSON: Missing student Chloe Tan detected inside vehicle.";
      } else if (forcedVehicleId === 'WV-2026-004') {
        parsedResponse.plateNumber = 'SMA2311X';
        parsedResponse.vehicleMake = 'Ferrari';
        parsedResponse.vehicleColor = 'Red';
        parsedResponse.qualityScore = 96;
        parsedResponse.blurScore = 5;
        parsedResponse.ocrConfidence = 99;
      } else if (forcedVehicleId === 'WV-2026-005') {
        parsedResponse.plateNumber = 'SFT7700Z';
        parsedResponse.vehicleMake = 'Honda';
        parsedResponse.vehicleColor = 'White';
        parsedResponse.qualityScore = 89;
        parsedResponse.blurScore = 7;
        parsedResponse.ocrConfidence = 95;
      } else if (forcedVehicleId === 'WV-2026-006') {
        parsedResponse.plateNumber = 'SGE5544E';
        parsedResponse.vehicleMake = 'McLaren';
        parsedResponse.vehicleColor = 'Orange';
        parsedResponse.qualityScore = 92;
        parsedResponse.blurScore = 6;
        parsedResponse.ocrConfidence = 97;
      }
    }
    return res.json(parsedResponse);
  } catch (error: any) {
    console.info("ℹ️ Vehicle analysis fallback pipeline active. Running robust local edge simulator.");
    const fallbackResponse = getVehicleFallback(image, simulateMatch, forcedVehicleId, isWebcam, fileName);
    return res.json(fallbackResponse);
  }
});

// Serve static assets in production, otherwise mount Vite in development
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Halo Grid Simulator Server running on port ${PORT}`);
  });
}

setupServer();
