import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, Upload, RefreshCw, AlertTriangle, ShieldCheck, 
  XCircle, Scan, Image as ImageIcon, CheckCircle, HelpCircle, ArrowRight,
  Mic, Square, Play, Pause, Trash2, Shield, Send
} from 'lucide-react';
import { 
  FaceWatchlistRecord, VehicleWatchlistRecord, SystemSettings, ScanOutcome, AlertRecord 
} from '../types';

interface CameraScanTabProps {
  settings: SystemSettings;
  faceWatchlist: FaceWatchlistRecord[];
  vehicleWatchlist: VehicleWatchlistRecord[];
  onAddAlert: (alert: AlertRecord) => void;
  onNavigate: (tab: string, arg?: any) => void;
  incrementScansCount?: (accepted: boolean) => void;
  isCitizenMode?: boolean;
  onCitizenSubmit?: (scanDetails: any) => void;
  citizenHandle?: string;
}

// Preset Scenario buttons to easily demonstrate all branches of the pipeline
const DEMO_SCENARIOS_FACE = [
  {
    label: "Fugitive Marcus Vance (Target Match)",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    desc: "Simulates high-quality, sharp facial alignment of Marcus Vance. Expect match similarity score 85% (>75% threshold), triggering an alert.",
    quality: 88,
    blur: 12,
    forcedMatchId: "WF-2026-001"
  },
  {
    label: "Missing Student Chloe Tan (Medium Match)",
    img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
    desc: "Simulates Chloe Tan entry. Expect match similarity score 78% (>70% threshold), generating a missing person alert.",
    quality: 81,
    blur: 24,
    forcedMatchId: "WF-2026-003"
  },
  {
    label: "Low Quality Face Crop (Rejection Branch)",
    img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop",
    desc: "Simulates face captured in extremely poor, dark, off-angle lighting. Expect Face Quality 45% (fails <65% threshold). Pipeline terminates before match attempt.",
    quality: 45,
    blur: 28,
    forcedMatchId: ""
  },
  {
    label: "High Speed Motion Blur (Rejection Branch)",
    img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
    desc: "Simulates high-speed movement blur. Expect Blur Score 58% (fails max allowed 40%). Pipeline terminates before match attempt.",
    quality: 72,
    blur: 58,
    forcedMatchId: ""
  },
  {
    label: "Safe Citizen (No Watchlist Match)",
    img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
    desc: "Simulates scanning an ordinary civilian not registered on any watchlist. Expect high quality, but similarity remains very low (<30%), yielding NO alert.",
    quality: 89,
    blur: 14,
    forcedMatchId: "NONE"
  }
];

const DEMO_SCENARIOS_VEHICLE = [
  {
    label: "Stolen Porsche Carrera (SLS1234A) [Glass Cabin Scan]",
    img: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=300&fit=crop",
    desc: "Simulates reading plate 'SLS1234A'. Automatically penetrates windshield glass to biometric scan fugitive driver Marcus Vance.",
    plateText: "SLS1234A",
    ocrConf: 94,
    quality: 88,
    blur: 15,
    forcedMatchId: "WV-2026-001"
  },
  {
    label: "Getaway Chevrolet Camaro (SGB8899K) [Glass Cabin Scan]",
    img: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop",
    desc: "Simulates reading plate 'SGB8899K'. Automatically penetrates side-window reflection to scan driver Elena Rostova.",
    plateText: "SGB8899K",
    ocrConf: 98,
    quality: 91,
    blur: 10,
    forcedMatchId: "WV-2026-002"
  },
  {
    label: "Missing Student Ford (SJR4050G) [Glass Cabin Scan]",
    img: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&h=300&fit=crop",
    desc: "Simulates reading plate 'SJR4050G'. Penetrates windshield reflections to locate missing person Chloe Tan inside the cabin.",
    plateText: "SJR4050G",
    ocrConf: 96,
    quality: 85,
    blur: 12,
    forcedMatchId: "WV-2026-003"
  },
  {
    label: "Mud-Covered Plate (Low Quality Rejection)",
    img: "https://images.unsplash.com/photo-1525609004556-c46c7d6cf0a3?w=400&h=300&fit=crop",
    desc: "Simulates plate obscured by mud or exhaust smoke. Plate Quality 41% (<65% minimum). Rejected before matching database.",
    plateText: "???",
    ocrConf: 35,
    quality: 41,
    blur: 18,
    forcedMatchId: ""
  },
  {
    label: "Safe Commuter Vehicle (No Match)",
    img: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&h=300&fit=crop",
    desc: "Simulates reading plate 'SFG5544T' of a typical non-watchlist vehicle. Expect high confidence read but NO watchlist match, logging no alarms.",
    plateText: "SFG5544T",
    ocrConf: 92,
    quality: 85,
    blur: 12,
    forcedMatchId: "NONE"
  }
];

export default function CameraScanTab({
  settings,
  faceWatchlist,
  vehicleWatchlist,
  onAddAlert,
  onNavigate,
  incrementScansCount,
  isCitizenMode = false,
  onCitizenSubmit,
  citizenHandle = "Citizen_Hero_77"
}: CameraScanTabProps) {
  const [scanMode, setScanMode] = useState<'Face' | 'Vehicle'>('Vehicle');
  
  // Citizen Review specific states
  const [citizenNotes, setCitizenNotes] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [recordedVoice, setRecordedVoice] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSeconds, setPlaySeconds] = useState(0);
  const timerRef = useRef<any>(null);
  const playbackTimerRef = useRef<any>(null);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    };
  }, []);
  
  // Scanned photo state
  const [selectedImage, setSelectedImage] = useState<string>(DEMO_SCENARIOS_VEHICLE[0].img);
  const [customFileSelected, setCustomFileSelected] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");

  // Active scenario inputs
  const [simulatedQuality, setSimulatedQuality] = useState(DEMO_SCENARIOS_VEHICLE[0].quality);
  const [simulatedBlur, setSimulatedBlur] = useState(DEMO_SCENARIOS_VEHICLE[0].blur);
  const [forcedMatchId, setForcedMatchId] = useState(DEMO_SCENARIOS_VEHICLE[0].forcedMatchId);
  const [simulatedPlate, setSimulatedPlate] = useState(DEMO_SCENARIOS_VEHICLE[0].plateText);
  const [simulatedOcrConf, setSimulatedOcrConf] = useState(DEMO_SCENARIOS_VEHICLE[0].ocrConf);

  // Animation & workflow states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0); // 0: Idle, 1: Detecting box, 2: Quality checks, 3: Matching DB, 4: Completed
  const [outcome, setOutcome] = useState<ScanOutcome | null>(null);
  const [latestAlertId, setLatestAlertId] = useState<string | null>(null);

  // Webcam states
  const [useWebcam, setUseWebcam] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync mode scenarios
  useEffect(() => {
    if (scanMode === 'Face') {
      const defaultS = DEMO_SCENARIOS_FACE[0];
      setSelectedImage(defaultS.img);
      setSimulatedQuality(defaultS.quality);
      setSimulatedBlur(defaultS.blur);
      setForcedMatchId(defaultS.forcedMatchId);
      setCustomFileSelected(false);
    } else {
      const defaultS = DEMO_SCENARIOS_VEHICLE[0];
      setSelectedImage(defaultS.img);
      setSimulatedQuality(defaultS.quality);
      setSimulatedBlur(defaultS.blur);
      setSimulatedPlate(defaultS.plateText);
      setSimulatedOcrConf(defaultS.ocrConf);
      setForcedMatchId(defaultS.forcedMatchId);
      setCustomFileSelected(false);
    }
    setOutcome(null);
    setLatestAlertId(null);
    stopWebcam();
  }, [scanMode]);

  // Citizen Voice Recorder Controls
  const startRecording = () => {
    setIsRecording(true);
    setSeconds(0);
    setRecordedVoice(false);
    timerRef.current = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    clearInterval(timerRef.current);
    setRecordedVoice(true);
  };

  const deleteRecording = () => {
    setRecordedVoice(false);
    setIsPlaying(false);
    setSeconds(0);
    clearInterval(playbackTimerRef.current);
  };

  const togglePlayback = () => {
    if (isPlaying) {
      setIsPlaying(false);
      clearInterval(playbackTimerRef.current);
    } else {
      setIsPlaying(true);
      setPlaySeconds(0);
      playbackTimerRef.current = setInterval(() => {
        setPlaySeconds(prev => {
          if (prev >= seconds - 1) {
            setIsPlaying(false);
            clearInterval(playbackTimerRef.current);
            return seconds;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  const handleCitizenAction = (action: 'Submit' | 'Dismiss' | 'Draft') => {
    if (!outcome) return;
    
    const scanId = `CSCAN-${Math.floor(1000 + Math.random() * 9000)}`;
    const pointsGained = action === 'Submit' ? (outcome.matchFound ? 250 : 50) : action === 'Dismiss' ? 10 : 0;
    const hasVoiceNote = recordedVoice;
    const voiceNoteDuration = recordedVoice ? seconds : undefined;
    
    let policeAlertId: string | undefined = undefined;
    
    if (action === 'Submit') {
      policeAlertId = latestAlertId || `ALRT-${Math.floor(10000 + Math.random() * 9000)}`;
      
      let notesText = `COMMUNITY WATCH REPORT. Submitted by citizen: [${citizenHandle}]. `;
      if (scanMode === 'Face' && outcome.matchedFace) {
        notesText += `Sighted face matching wanted record: ${outcome.matchedFace.candidate_name}. `;
      } else if (scanMode === 'Vehicle') {
        notesText += `Sighted vehicle with license plate ${outcome.detectedText || 'scanned'}. `;
        if (outcome.matchedVehicle) {
          notesText += `Matches watchlist category: [${outcome.matchedVehicle.vehicle_status_type}]. `;
        }
      }
      notesText += `Notes: "${citizenNotes || 'No notes attached'}". `;
      if (hasVoiceNote) {
        notesText += `Voice memo attached (${voiceNoteDuration}s).`;
      }
      
      const newAlert: AlertRecord = {
        alert_id: policeAlertId,
        alert_type: scanMode === 'Face' ? "Face Alert" : "Vehicle Alert",
        timestamp: new Date().toISOString(),
        spotted_location: "Community Scout Submission",
        source_camera: `CITIZEN-NODE-(${citizenHandle})`,
        matched_entity_name: scanMode === 'Face' ? (outcome.matchedFace?.candidate_name || 'Face') : (outcome.detectedText || 'Plate'),
        watchlist_id: scanMode === 'Face' ? (outcome.matchedFace?.watchlist_id || 'NONE') : (outcome.matchedVehicle?.vehicle_watchlist_id || 'NONE'),
        case_id: scanMode === 'Face' ? (outcome.matchedFace?.case_id || 'FACE-LOG-2026') : (outcome.matchedVehicle?.case_id || 'CIVIC-LOG-2026'),
        similarity_score_or_plate_confidence: outcome.similarityScore || 85,
        quality_score: outcome.qualityScore || 80,
        blur_score: outcome.blurScore || 15,
        threshold: scanMode === 'Face' ? settings.faceThreshold : settings.plateConfidenceMin,
        status: "Pending Review",
        thumbnail_image: selectedImage,
        notes: notesText,
        risk_priority: scanMode === 'Face' ? (outcome.matchedFace?.risk_priority || 'Low') : (outcome.matchedVehicle?.risk_priority || 'Low')
      };
      
      onAddAlert(newAlert);
    }
    
    if (onCitizenSubmit) {
      onCitizenSubmit({
        id: scanId,
        timestamp: new Date().toISOString(),
        image: selectedImage,
        scanMode,
        plateNumber: scanMode === 'Vehicle' ? outcome.detectedText : undefined,
        vehicleMake: scanMode === 'Vehicle' ? (outcome.matchedVehicle?.vehicle_make || 'Sighted Car') : undefined,
        vehicleColor: scanMode === 'Vehicle' ? (outcome.matchedVehicle?.vehicle_color || 'Unknown') : undefined,
        faceName: scanMode === 'Face' ? outcome.matchedFace?.candidate_name : undefined,
        matchFound: outcome.matchFound,
        matchedEntityName: scanMode === 'Face' ? outcome.matchedFace?.candidate_name : outcome.matchedVehicle?.plate_number,
        status: action === 'Submit' ? 'Sent to Police' : action === 'Dismiss' ? 'Dismissed' : 'Draft',
        notes: citizenNotes,
        hasVoiceNote,
        voiceNoteDuration,
        pointsAwarded: pointsGained,
        qualityScore: outcome.qualityScore,
        blurScore: outcome.blurScore,
        policeAlertId
      });
    }
    
    setOutcome(null);
    setLatestAlertId(null);
    setCitizenNotes("");
    setRecordedVoice(false);
    setSeconds(0);
  };

  // Webcam controls
  const startWebcam = async () => {
    setUseWebcam(true);
    setOutcome(null);
    setCustomFileSelected(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 400 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Webcam access failed or denied, using camera simulator HUD instead.", err);
    }
  };

  const stopWebcam = () => {
    setUseWebcam(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopWebcam();
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 400;
      canvas.height = video.videoHeight || 400;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setSelectedImage(dataUrl);
        setCustomFileSelected(true);
        stopWebcam();
        
        // Clear forced preset override and run real-time AI for either Face or Vehicle mode!
        setForcedMatchId("NONE"); // Let Gemini decide dynamically!
        handleStartScan(dataUrl);
      }
    }
  };

  // Image upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const dataUrl = event.target.result as string;
          setSelectedImage(dataUrl);
          setCustomFileSelected(true);
          stopWebcam();
          
          // Clear forced preset override and run real-time AI for either Face or Vehicle mode!
          setForcedMatchId("NONE");
          handleStartScan(dataUrl, file.name);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Execute scan matching pipeline
  const handleStartScan = async (imageOverride?: any, fileNameOverride?: string) => {
    let activeImage = (typeof imageOverride === 'string') ? imageOverride : selectedImage;
    let currentForcedMatchId = forcedMatchId;
    let isWebcamScan = false;
    
    // Auto-capture frame if webcam is active on trigger
    if (useWebcam && !imageOverride && videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 400;
      canvas.height = video.videoHeight || 400;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setSelectedImage(dataUrl);
        setCustomFileSelected(true);
        activeImage = dataUrl;
        stopWebcam();
        setForcedMatchId("NONE"); // Clear forced preset for dynamic live webcam captures
        currentForcedMatchId = "NONE";
        isWebcamScan = true;
      }
    } else if (imageOverride) {
      // Clear forced preset immediately for custom uploaded file
      setForcedMatchId("NONE");
      currentForcedMatchId = "NONE";
    }

    setIsAnalyzing(true);
    setAnalysisStep(1);
    setOutcome(null);
    setLatestAlertId(null);

    // Reset gauge scores to 0 during analysis to prevent stale/confusing passing-then-failing indicators
    setSimulatedQuality(0);
    setSimulatedBlur(0);
    if (scanMode === 'Vehicle') {
      setSimulatedPlate('');
      setSimulatedOcrConf(0);
    }

    if (scanMode === 'Face') {
      try {
        // Step 1: Detect Region
        await new Promise(resolve => setTimeout(resolve, 15));
        setAnalysisStep(2); // Analyzing Quality Metrics
        
        // Query our server-side Gemini API endpoint
        const response = await fetch('/api/analyze-face', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: activeImage,
            simulateMatch: currentForcedMatchId !== 'NONE' && currentForcedMatchId !== 'clear',
            forcedCriminalId: (currentForcedMatchId && currentForcedMatchId !== 'NONE' && currentForcedMatchId !== 'clear') ? currentForcedMatchId : undefined
          })
        });

        setAnalysisStep(3); // Matching registers database
        await new Promise(resolve => setTimeout(resolve, 15));

        if (!response.ok) {
          throw new Error(await response.text() || 'Failed to analyze face image');
        }

        const data = await response.json();
        
        setAnalysisStep(4);
        setIsAnalyzing(false);

        // Update local state with the actual AI-calculated quality and blur scores!
        setSimulatedQuality(data.qualityScore);
        setSimulatedBlur(data.blurScore);

        if (!data.faceDetected) {
          incrementScansCount?.(false);
          setOutcome({
            accepted: false,
            reason: "Rejected: No human face detected in the frame. Please align your face clearly in the camera center and try again.",
            qualityScore: 0,
            blurScore: 100,
            matchFound: false
          });
          return;
        }

        let accepted = false;
        let reason = "";

        if (data.qualityScore < settings.faceQualityMin) {
          accepted = false;
          reason = `Rejected: Face quality index ${data.qualityScore}% is below minimum required gateway ${settings.faceQualityMin}%.`;
        } else if (data.blurScore > settings.faceBlurMax) {
          accepted = false;
          reason = `Rejected: Motion blur index ${data.blurScore}% exceeds maximum permitted gateway ${settings.faceBlurMax}%.`;
        } else {
          accepted = true;
        }

        if (accepted) {
          incrementScansCount?.(true);
          
          let matchedFace: FaceWatchlistRecord | undefined = undefined;
          let matchFound = false;

          if (data.matchCriminalId) {
            // Look up in our watchlist of 100 criminals!
            matchedFace = faceWatchlist.find(f => f.watchlist_id === data.matchCriminalId);
            if (matchedFace) {
              matchFound = true;
            }
          }

          const meetsThreshold = data.matchSimilarity >= settings.faceThreshold;
          
          setOutcome({
            accepted,
            qualityScore: data.qualityScore,
            blurScore: data.blurScore,
            matchFound: matchFound && meetsThreshold,
            similarityScore: data.matchSimilarity,
            matchedFace
          });

          if (matchFound && meetsThreshold && matchedFace) {
            // Generate warning alert record immediately for both modes
            const newAlertId = `ALRT-${Math.floor(10000 + Math.random() * 9000)}`;
            const isFromCitizen = isCitizenMode;
            const sourceCamera = isFromCitizen ? `CITIZEN-NODE-(${citizenHandle})` : "CAM-SIM-ENTRY-01";
            const spottedLocation = isFromCitizen ? "Community Scout Submission" : "Orchard Road Crossing";

            const newAlert: AlertRecord = {
              alert_id: newAlertId,
              alert_type: "Face Alert",
              timestamp: new Date().toISOString(),
              spotted_location: spottedLocation,
              source_camera: sourceCamera,
              matched_entity_name: matchedFace.candidate_name,
              watchlist_id: matchedFace.watchlist_id,
              case_id: matchedFace.case_id,
              similarity_score_or_plate_confidence: data.matchSimilarity,
              quality_score: data.qualityScore,
              blur_score: data.blurScore,
              threshold: settings.faceThreshold,
              status: "Pending Review",
              thumbnail_image: activeImage,
              notes: isFromCitizen 
                ? `ANPR/Biometric matching trigger in Citizen Lookout. Sighted wanted face: ${matchedFace.candidate_name}. Gender: ${data.gender}, Age Range: ${data.ageRange}. Waiting for citizen escalation dispatch notes.`
                : `Live facial matching trigger. Face quality indices parsed in real time by AI. Gender: ${data.gender}, Age Range: ${data.ageRange}, Attributes: ${data.attributes?.join(', ') || 'None'}. Assessment: ${data.assessment || 'Approved for dispatch.'}`,
              risk_priority: matchedFace.risk_priority
            };
            if (!isFromCitizen) {
              onAddAlert(newAlert);
            }
            setLatestAlertId(newAlertId);
          }
        } else {
          incrementScansCount?.(false);
          setOutcome({
            accepted,
            reason,
            qualityScore: data.qualityScore,
            blurScore: data.blurScore,
            matchFound: false
          });
        }

      } catch (error: any) {
        console.error("AI Face Scan Pipeline failed:", error);
        setIsAnalyzing(false);
        incrementScansCount?.(false);
        setOutcome({
          accepted: false,
          reason: `Biometric pipeline error: ${error.message || 'AI engine timeout'}.`,
          qualityScore: 50,
          blurScore: 50,
          matchFound: false
        });
      }
    } else {
      // Vehicle scan Mode
      try {
        // Step 1: Detect Region
        await new Promise(resolve => setTimeout(resolve, 15));
        setAnalysisStep(2); // Analyzing Quality Metrics
        
        // Query our server-side Gemini API endpoint
        const response = await fetch('/api/analyze-vehicle', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: activeImage,
            simulateMatch: currentForcedMatchId !== 'NONE' && currentForcedMatchId !== 'clear',
            forcedVehicleId: (currentForcedMatchId && currentForcedMatchId !== 'NONE' && currentForcedMatchId !== 'clear') ? currentForcedMatchId : undefined,
            isWebcam: isWebcamScan || useWebcam,
            fileName: fileNameOverride || uploadedFileName
          })
        });

        setAnalysisStep(3); // Matching registers database
        await new Promise(resolve => setTimeout(resolve, 15));

        if (!response.ok) {
          throw new Error(await response.text() || 'Failed to analyze vehicle image');
        }

        const data = await response.json();
        
        setAnalysisStep(4);
        setIsAnalyzing(false);

        // 1. Check if a human face was mistakenly submitted inside the Vehicle division!
        if (data.isFaceInsteadOfVehicle) {
          setSimulatedQuality(0);
          setSimulatedBlur(100);
          setSimulatedPlate("");
          setSimulatedOcrConf(0);
          incrementScansCount(false);
          setOutcome({
            accepted: false,
            reason: "Rejected: A human face was detected in this Vehicle Scan. This division is strictly calibrated for license plates and vehicle telemetry. Please switch to and utilize the Biometric Facial Recognition Scan tab instead.",
            qualityScore: 0,
            blurScore: 100,
            matchFound: false
          });
          return;
        }

        if (!data.plateDetected) {
          setSimulatedQuality(0);
          setSimulatedBlur(100);
          setSimulatedPlate("");
          setSimulatedOcrConf(0);
          incrementScansCount(false);
          setOutcome({
            accepted: false,
            reason: "Rejected: No vehicle license plate detected in the frame. Please align the license plate clearly in the center and try again.",
            qualityScore: 0,
            blurScore: 100,
            matchFound: false
          });
          return;
        }

        let matchedVehicle: VehicleWatchlistRecord | undefined = undefined;
        let matchFound = false;

        if (data.matchVehicleId) {
          // Look up in our vehicle watchlist records!
          matchedVehicle = vehicleWatchlist.find(v => v.vehicle_watchlist_id === data.matchVehicleId);
          if (matchedVehicle) {
            matchFound = true;
          }
        }

        // Determine quality/confidence issues
        const isQualityUnusable = data.qualityScore < settings.plateQualityMin && !matchFound;
        const isConfidenceUnreliable = data.ocrConfidence < settings.plateConfidenceMin && !matchFound;
        const isBlurObscured = data.blurScore > settings.plateBlurMax && !matchFound;

        let accepted = false;
        let reason = "";

        if (isQualityUnusable) {
          accepted = false;
          reason = `Rejected: Plate frame resolution quality ${data.qualityScore}% is below standard required gateway ${settings.plateQualityMin}%.`;
        } else if (isConfidenceUnreliable) {
          accepted = false;
          reason = `Rejected: OCR character confidence ${data.ocrConfidence}% is below standard required gateway ${settings.plateConfidenceMin}%.`;
        } else if (isBlurObscured) {
          accepted = false;
          reason = `Rejected: Optical plate blur ${data.blurScore}% exceeds maximum permitted gateway ${settings.plateBlurMax}%.`;
        } else {
          accepted = true;
        }

        // If the plate frame quality or OCR confidence is unusable/unreliable, clear the plate number so it's not shown in the text readout!
        const finalPlateNumber = (isQualityUnusable || isConfidenceUnreliable) ? "" : data.plateNumber;
        const finalOcrConf = (isQualityUnusable || isConfidenceUnreliable) ? 0 : data.ocrConfidence;

        // Update local state with the actual AI-calculated quality and confidence scores!
        setSimulatedQuality(data.qualityScore);
        setSimulatedBlur(data.blurScore);
        setSimulatedPlate(finalPlateNumber);
        setSimulatedOcrConf(finalOcrConf);

        if (accepted) {
          incrementScansCount?.(true);
          
          // If we matched a watchlisted vehicle, we bypass standard OCR threshold to ensure a critical alert is triggered!
          const meetsThreshold = matchFound || (finalOcrConf >= settings.plateConfidenceMin);
          
          let occupantMatchedFace: FaceWatchlistRecord | undefined = undefined;
          if (data.occupantFaceDetected && data.occupantMatchCriminalId) {
            occupantMatchedFace = faceWatchlist.find(f => f.watchlist_id === data.occupantMatchCriminalId);
          }

          setOutcome({
            accepted,
            qualityScore: data.qualityScore,
            blurScore: data.blurScore,
            detectedText: finalPlateNumber,
            matchFound: matchFound && meetsThreshold,
            similarityScore: finalOcrConf,
            matchedVehicle,
            occupantFaceDetected: data.occupantFaceDetected,
            occupantQualityScore: data.occupantQualityScore,
            occupantMatchCriminalId: data.occupantMatchCriminalId,
            occupantMatchSimilarity: data.occupantMatchSimilarity,
            occupantMatchedFace,
            occupantAssessment: data.occupantAssessment
          });

          if (matchFound && meetsThreshold && matchedVehicle) {
            // Generate warning alert record immediately for both modes
            const newAlertId = `ALRT-${Math.floor(10000 + Math.random() * 9000)}`;
            const isFromCitizen = isCitizenMode;
            const sourceCamera = isFromCitizen ? `CITIZEN-NODE-(${citizenHandle})` : "CAM-SIM-VEHICLE-02";
            const spottedLocation = isFromCitizen ? "Community Scout Submission" : "Tampines Junction";

            const newAlert: AlertRecord = {
              alert_id: newAlertId,
              alert_type: "Vehicle Alert",
              timestamp: new Date().toISOString(),
              spotted_location: spottedLocation,
              source_camera: sourceCamera,
              matched_entity_name: matchedVehicle.plate_number,
              watchlist_id: matchedVehicle.vehicle_watchlist_id,
              case_id: matchedVehicle.case_id,
              similarity_score_or_plate_confidence: data.ocrConfidence,
              quality_score: data.qualityScore,
              blur_score: data.blurScore,
              threshold: settings.plateConfidenceMin,
              status: "Pending Review",
              thumbnail_image: activeImage,
              notes: isFromCitizen 
                ? `ANPR Plate matching trigger in Citizen Lookout. Sighted vehicle ${matchedVehicle.plate_number}. Color: ${data.vehicleColor}, Make: ${data.vehicleMake}. Registered category: ${matchedVehicle.vehicle_status_type}. Waiting for citizen escalation dispatch notes.`
                : `ANPR Plate parsing trigger. Optical text recognized plate ${matchedVehicle.plate_number}. Color: ${data.vehicleColor}, Make: ${data.vehicleMake}. Registered category: ${matchedVehicle.vehicle_status_type}. Assessment: ${data.assessment || 'Dispatched for patrol verification.'}${data.occupantFaceDetected && occupantMatchedFace ? ` Note: Active Cabin Occupant Scanner detected a passenger matching ${occupantMatchedFace.candidate_name}.` : ''}`,
              risk_priority: matchedVehicle.risk_priority
            };
            if (!isFromCitizen) {
              onAddAlert(newAlert);
            }
            setLatestAlertId(newAlertId);

            // If cabin occupant matches a fugitive/watchlist record, trigger a companion biometric face alert!
            if (data.occupantFaceDetected && occupantMatchedFace) {
              const faceAlertId = `ALRT-${Math.floor(10000 + Math.random() * 9000)}`;
              const faceAlert: AlertRecord = {
                alert_id: faceAlertId,
                alert_type: "Face Alert",
                timestamp: new Date().toISOString(),
                spotted_location: isFromCitizen ? "Community Scout Submission (Windshield Scan)" : "Tampines Junction (Cabin Scan)",
                source_camera: isFromCitizen ? `CITIZEN-NODE-(${citizenHandle})-CABIN` : "CAM-SIM-VEHICLE-02-CABIN",
                matched_entity_name: occupantMatchedFace.candidate_name,
                watchlist_id: occupantMatchedFace.watchlist_id,
                case_id: occupantMatchedFace.case_id,
                similarity_score_or_plate_confidence: data.occupantMatchSimilarity || 85,
                quality_score: data.occupantQualityScore || 75,
                blur_score: data.blurScore,
                threshold: settings.faceThreshold,
                status: "Pending Review",
                thumbnail_image: occupantMatchedFace.reference_face_image,
                notes: isFromCitizen
                  ? `Cabin Scanner Match in Citizen Lookout. Passenger face matching ${occupantMatchedFace.candidate_name} identified through the windshield of vehicle ${matchedVehicle.plate_number}.`
                  : `Cabin Scanner Match. Passenger face matching ${occupantMatchedFace.candidate_name} identified through the windshield of stolen vehicle ${matchedVehicle.plate_number}. ${data.occupantAssessment || ''}`,
                risk_priority: occupantMatchedFace.risk_priority
              };
              if (!isFromCitizen) {
                onAddAlert(faceAlert);
              }
            }
          }
        } else {
          incrementScansCount?.(false);
          setOutcome({
            accepted,
            reason,
            qualityScore: data.qualityScore,
            blurScore: data.blurScore,
            matchFound: false
          });
        }

      } catch (error: any) {
        console.error("AI Vehicle Scan Pipeline failed:", error);
        setIsAnalyzing(false);
        incrementScansCount?.(false);
        setOutcome({
          accepted: false,
          reason: `ANPR radar pipeline error: ${error.message || 'AI engine timeout'}.`,
          qualityScore: 50,
          blurScore: 50,
          matchFound: false
        });
      }
    }
  };

  const selectScenario = (sc: any) => {
    setSelectedImage(sc.img);
    setSimulatedQuality(sc.quality);
    setSimulatedBlur(sc.blur);
    setForcedMatchId(sc.forcedMatchId);
    setCustomFileSelected(false);
    
    if (scanMode === 'Vehicle') {
      setSimulatedPlate(sc.plateText);
      setSimulatedOcrConf(sc.ocrConf);
    }
    setOutcome(null);
    setLatestAlertId(null);
    stopWebcam();
  };

  return (
    <div className="space-y-4" id="camera-scan-container">
      {/* Simulation Banner Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-brand-card border border-slate-800 p-3.5 rounded gap-2 shadow-md">
        <div>
          <span className="text-[9px] font-mono text-cyan-400 font-bold uppercase tracking-widest block">Operational Scanner Console</span>
          <h2 className="text-xs font-sans font-black uppercase text-slate-200">Interactive Pipeline Sandbox</h2>
        </div>
        <div className="text-[9px] text-slate-400 max-w-md bg-brand-bg/60 p-2 rounded border border-slate-800 font-mono">
          <strong>How to test:</strong> Select a **Quick Scenario Preset** on the bottom of the left panel to easily evaluate both acceptance/rejection paths and warning alert generators.
        </div>
      </div>

      {/* Selectable Scan Modes Tabs - Sidelined Facial Recognition to focus purely on plate scan */}
      <div className="bg-brand-card border border-slate-800 px-4 py-2.5 rounded flex items-center justify-between text-xs font-mono" id="scan-mode-toggles">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span className="text-slate-400">Scanner Engine Pipeline Status:</span>
          <span className="text-white font-bold font-sans uppercase">Active plate ANPR scan</span>
        </div>
        <span className="px-2 py-0.5 bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-[9px] font-bold uppercase rounded">
          Fully Operational
        </span>
      </div>

      {/* THREE PANEL GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start" id="scanner-three-panels">
        
        {/* PANEL 1: Left Input Panel - 4 Cols */}
        <div className="lg:col-span-4 bg-brand-card border border-slate-800 rounded p-4 space-y-3.5 shadow-lg" id="input-left-panel">
          <div className="border-b border-slate-850 pb-2">
            <h3 className="text-xs font-mono font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
              <Camera className="w-4 h-4" />
              Source Input Feed
            </h3>
          </div>

          {/* Video / Image viewport frame */}
          <div className="relative aspect-square bg-brand-bg rounded overflow-hidden border border-slate-800 flex items-center justify-center">
            {useWebcam ? (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover scale-x-[-1]" // mirrored
              />
            ) : (
              <img 
                src={selectedImage} 
                alt="Scanning target preview" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            )}

            {/* Hidden canvas for capturing video frames */}
            <canvas ref={canvasRef} className="hidden" />

            {/* SCANNING LASER HUD ANIMATION */}
            {isAnalyzing && (
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_#22d3ee] top-0 animate-[bounce_1.5s_infinite] pointer-events-none z-10"></div>
            )}

            {/* Camera Overlay HUD */}
            <div className="absolute inset-0 border border-slate-800/40 pointer-events-none flex flex-col justify-between p-3">
              <div className="flex justify-between">
                <span className="w-3 h-3 border-t-2 border-l-2 border-slate-600"></span>
                <span className="w-3 h-3 border-t-2 border-r-2 border-slate-600"></span>
              </div>
              <div className="flex justify-between">
                <span className="w-3 h-3 border-b-2 border-l-2 border-slate-600"></span>
                <span className="w-3 h-3 border-b-2 border-r-2 border-slate-600"></span>
              </div>
            </div>
          </div>

          {/* Primary stream controls */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {useWebcam ? (
              <button
                onClick={handleCapture}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded flex items-center justify-center gap-1.5"
              >
                <Camera className="w-4 h-4" />
                Capture Photo
              </button>
            ) : (
              <button
                onClick={startWebcam}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded border border-slate-700 flex items-center justify-center gap-1.5"
              >
                <Camera className="w-4 h-4" />
                Use Webcam
              </button>
            )}

            <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer text-center">
              <Upload className="w-4 h-4" />
              Upload Image
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileUpload} 
                className="hidden" 
              />
            </label>
          </div>

          {/* START SCAN CORE RUN TRIGGER */}
          <button
            id="trigger-radar-scan-btn"
            onClick={() => handleStartScan()}
            disabled={isAnalyzing}
            className={`w-full py-2.5 font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition tracking-wider uppercase ${
              isAnalyzing 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-md shadow-cyan-900/20'
            }`}
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Pipeline Analyzing...
              </>
            ) : (
              <>
                <Scan className="w-4 h-4" />
                Initiate Radar analysis
              </>
            )}
          </button>

          {/* Quick Scenario Selection Block */}
          <div className="pt-2.5 border-t border-slate-850 space-y-2">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">
              Quick Sandbox presets ({scanMode === 'Face' ? 'Faces' : 'Vehicles'})
            </span>
            <div className="space-y-1 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
              {(scanMode === 'Face' ? DEMO_SCENARIOS_FACE : DEMO_SCENARIOS_VEHICLE).map((sc, i) => (
                <button
                  key={i}
                  onClick={() => selectScenario(sc)}
                  className="w-full text-left p-1.5 bg-brand-bg/50 border border-slate-850 rounded hover:border-slate-700 transition flex flex-col"
                >
                  <span className="text-[10px] font-bold text-slate-200">{sc.label}</span>
                  <span className="text-[9px] text-slate-500 truncate block">{sc.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* PANEL 2: Middle Pipeline Analysis results - 4 Cols */}
        <div className="lg:col-span-4 bg-brand-card border border-slate-800 rounded p-4 space-y-4 h-full shadow-lg" id="analysis-middle-panel">
          <div className="border-b border-slate-850 pb-2">
            <h3 className="text-xs font-mono font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
              <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
              AI Pipeline Metrics
            </h3>
          </div>

          {/* Processing Steps HUD */}
          {isAnalyzing && (
            <div className="p-3 bg-brand-bg border border-slate-850 rounded space-y-2.5 font-mono text-[9px] text-cyan-400">
              <div className="flex justify-between items-center">
                <span>[STAGE 1] DETECT_REGION_BOX:</span>
                <span className={analysisStep >= 1 ? "text-emerald-400 font-bold" : "text-slate-600"}>
                  {analysisStep >= 2 ? "COMPLETE" : "RUNNING"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>[STAGE 2] PARSE_OPTICAL_METRICS:</span>
                <span className={analysisStep >= 2 ? "text-emerald-400 font-bold" : "text-slate-600"}>
                  {analysisStep > 2 ? "COMPLETE" : analysisStep === 2 ? "RUNNING" : "WAITING"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>[STAGE 3] BIOMETRIC_MATCH_INDEX:</span>
                <span className={analysisStep >= 3 ? "text-emerald-400 font-bold" : "text-slate-600"}>
                  {analysisStep > 3 ? "COMPLETE" : analysisStep === 3 ? "RUNNING" : "WAITING"}
                </span>
              </div>
              {/* Spinning progress loader */}
              <div className="w-full bg-slate-900 h-1 rounded overflow-hidden mt-2 relative">
                <div className="absolute top-0 bottom-0 left-0 bg-cyan-400 animate-[pulse_1s_infinite]" style={{ width: `${analysisStep * 25}%` }}></div>
              </div>
            </div>
          )}

          {/* Static Metrics readout (Sliders for testing) */}
          <div className="space-y-4">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Calibrate Capture tolerances</span>

            {scanMode === 'Face' ? (
              <div className="space-y-4 text-xs" id="middle-face-sliders">
                {/* Visual indicator that sliders are locked to AI real-time calculation */}
                <div className="flex items-center gap-1.5 p-2 bg-slate-900/60 border border-slate-800 rounded font-mono text-[9px] text-cyan-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                  <span>🔒 BIOMETRIC FEED LOCKED: REAL-TIME AI SCORING</span>
                </div>

                {/* Dynamic Face Quality Gauge */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-slate-300">
                    <span className="font-mono text-[10px] uppercase">Calculated Face Quality:</span>
                    <span className={`font-mono font-bold ${simulatedQuality >= settings.faceQualityMin ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isAnalyzing ? (
                        <span className="text-cyan-400 animate-pulse">ANALYZING...</span>
                      ) : (
                        `${simulatedQuality}% ${simulatedQuality >= settings.faceQualityMin ? '(PASS)' : '(FAIL)'}`
                      )}
                    </span>
                  </div>
                  {/* Visual gauge */}
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className={`h-full transition-all duration-500 rounded-full ${
                        isAnalyzing ? 'bg-cyan-500 animate-pulse' : (simulatedQuality >= settings.faceQualityMin ? 'bg-emerald-500' : 'bg-red-500')
                      }`}
                      style={{ width: `${isAnalyzing ? 100 : simulatedQuality}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[8px] font-mono text-slate-500">
                    <span>Low Quality</span>
                    <span>Required Min: {settings.faceQualityMin}%</span>
                    <span>High Quality</span>
                  </div>
                </div>

                {/* Dynamic Blur Score Gauge */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-slate-300">
                    <span className="font-mono text-[10px] uppercase">Calculated Optical Blur:</span>
                    <span className={`font-mono font-bold ${simulatedBlur <= settings.faceBlurMax ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isAnalyzing ? (
                        <span className="text-cyan-400 animate-pulse">MEASURING...</span>
                      ) : (
                        `${simulatedBlur}% ${simulatedBlur <= settings.faceBlurMax ? '(PASS)' : '(OBSCURED)'}`
                      )}
                    </span>
                  </div>
                  {/* Visual gauge */}
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className={`h-full transition-all duration-500 rounded-full ${
                        isAnalyzing ? 'bg-cyan-500 animate-pulse' : (simulatedBlur <= settings.faceBlurMax ? 'bg-emerald-500' : 'bg-red-500')
                      }`}
                      style={{ width: `${isAnalyzing ? 100 : simulatedBlur}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[8px] font-mono text-slate-500">
                    <span>Razor Sharp (0%)</span>
                    <span>Max Allowed: {settings.faceBlurMax}%</span>
                    <span>Highly Blurred (100%)</span>
                  </div>
                </div>

                {/* CITIZEN ESCALATION NOTE & AUDIO MEMO FOR FACE SCAN */}
                {isCitizenMode && (
                  <div className="mt-3 p-3 bg-slate-900/60 border border-slate-800 rounded-lg space-y-2.5">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-indigo-400">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        CITIZEN ESCALATION DISPATCH NOTE
                      </div>
                      <span className="text-[8px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono font-bold px-1.5 py-0.5 rounded uppercase">
                        LOCAL FIELD INPUT
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-wider block">
                        Escalation Dispatch Note
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Type any special details to escalate to police dispatch..."
                        value={citizenNotes}
                        onChange={e => setCitizenNotes(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 rounded p-2 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-indigo-500 font-mono transition"
                      />
                    </div>

                    {/* Integrated simulated voice recorder for escalation notes */}
                    <div className="space-y-2 pt-1 border-t border-slate-850">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-mono font-black text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                          <Mic className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
                          Escalation Voice Memo
                        </span>
                        {recordedVoice ? (
                          <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono px-1.5 py-0.5 rounded-sm uppercase font-bold">
                            ✓ RECORDED ({seconds}s)
                          </span>
                        ) : (
                          <span className="text-[8px] text-slate-500 font-mono uppercase">
                            Optional audio clip
                          </span>
                        )}
                      </div>

                      {!isRecording && !recordedVoice ? (
                        <button
                          type="button"
                          onClick={startRecording}
                          className="w-full py-1.5 bg-slate-950 hover:bg-slate-850 text-indigo-400 hover:text-indigo-300 text-[9px] font-mono font-black uppercase rounded flex items-center justify-center gap-1.5 border border-slate-850 transition cursor-pointer"
                        >
                          <Mic className="w-3 h-3 text-indigo-400" />
                          Record Escalation Voice Note
                        </button>
                      ) : isRecording ? (
                        <div className="space-y-2 text-center py-1.5 bg-red-950/15 rounded border border-red-900/10">
                          {/* Audio Wave Visualizer */}
                          <div className="flex justify-center items-center gap-1 h-4">
                            <span className="w-1 bg-red-500 rounded animate-pulse" style={{ height: '75%', animationDuration: '0.4s' }} />
                            <span className="w-1 bg-red-400 rounded animate-pulse" style={{ height: '45%', animationDuration: '0.6s' }} />
                            <span className="w-1 bg-red-500 rounded animate-pulse" style={{ height: '95%', animationDuration: '0.3s' }} />
                          </div>
                          <div className="flex justify-between items-center px-2 text-[9px]">
                            <span className="text-red-400 font-mono font-bold animate-pulse">RECORDING AUDIO...</span>
                            <span className="font-mono text-slate-300">00:{seconds < 10 ? `0${seconds}` : seconds}</span>
                            <button
                              type="button"
                              onClick={stopRecording}
                              className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white font-mono uppercase rounded flex items-center gap-1 cursor-pointer font-bold"
                            >
                              Stop
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Playback simulator
                        <div className="flex items-center justify-between bg-slate-950 p-1.5 rounded border border-slate-850">
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={togglePlayback}
                              className="p-1 bg-indigo-650 hover:bg-indigo-500 text-white rounded transition cursor-pointer flex items-center justify-center"
                            >
                              {isPlaying ? <Pause className="w-3 h-3 fill-current text-white" /> : <Play className="w-3 h-3 fill-current text-white" />}
                            </button>
                            <div className="flex flex-col">
                              <span className="text-[8px] font-mono font-bold text-slate-300">ESCALATION_MEMO.WAV</span>
                              <span className="text-[7px] font-mono text-slate-500">
                                {isPlaying ? `00:${playSeconds < 10 ? `0${playSeconds}` : playSeconds}` : `00:00`} / 00:{seconds < 10 ? `0${seconds}` : seconds}
                              </span>
                            </div>
                          </div>
                          
                          {/* Audio progress track */}
                          <div className="flex-1 mx-2 bg-slate-900 h-1 rounded overflow-hidden relative">
                            <div 
                              className="bg-indigo-500 h-full transition-all duration-300"
                              style={{ width: isPlaying ? `${(playSeconds / seconds) * 100}%` : '0%' }}
                            />
                          </div>

                          <button
                            type="button"
                            onClick={deleteRecording}
                            className="p-1 hover:bg-slate-850 text-slate-500 hover:text-red-400 rounded transition cursor-pointer"
                            title="Delete memo"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Integrated Action Buttons for Direct Send/Save */}
                    <div className="pt-2.5 border-t border-slate-850 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleCitizenAction('Dismiss')}
                          className="py-1.5 bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-white font-mono uppercase text-[9px] font-black rounded border border-slate-850 hover:border-slate-800 transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3 h-3 text-rose-500" />
                          ✕ Dismiss
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCitizenAction('Draft')}
                          className="py-1.5 bg-slate-950 hover:bg-slate-850 text-indigo-400 hover:text-indigo-300 font-mono uppercase text-[9px] font-black rounded border border-slate-850 hover:border-slate-800 transition flex items-center justify-center gap-1 cursor-pointer font-bold animate-pulse"
                        >
                          <Upload className="w-3.5 h-3.5 text-indigo-400" />
                          📥 Save Draft
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCitizenAction('Submit')}
                        className="w-full py-2 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-mono uppercase text-[10px] font-black rounded shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer font-bold"
                      >
                        <Send className="w-3.5 h-3.5 text-emerald-300" />
                        ⚡ Escalate & Send to Police
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3.5" id="middle-vehicle-sliders">
                {/* Plate quality gauge */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-slate-300 text-[10px] font-mono">
                    <span className="uppercase font-semibold text-slate-400">Plate Frame Quality:</span>
                    <span className={`font-bold ${simulatedQuality >= settings.plateQualityMin ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isAnalyzing ? (
                        <span className="text-cyan-400 animate-pulse">ANALYZING...</span>
                      ) : (
                        `${simulatedQuality}% ${simulatedQuality >= settings.plateQualityMin ? '(PASS)' : '(UNUSABLE)'}`
                      )}
                    </span>
                  </div>
                  {/* Visual gauge */}
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className={`h-full transition-all duration-500 rounded-full ${
                        isAnalyzing ? 'bg-cyan-500 animate-pulse' : (simulatedQuality >= settings.plateQualityMin ? 'bg-emerald-500' : 'bg-red-500')
                      }`}
                      style={{ width: `${isAnalyzing ? 100 : simulatedQuality}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[8px] font-mono text-slate-500">
                    <span>Low Quality</span>
                    <span>Required Min: {settings.plateQualityMin}%</span>
                    <span>High Quality</span>
                  </div>
                </div>

                {/* OCR character confidence gauge */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-slate-300 text-[10px] font-mono">
                    <span className="uppercase font-semibold text-slate-400">OCR Character Confidence:</span>
                    <span className={`font-bold ${simulatedOcrConf >= settings.plateConfidenceMin ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isAnalyzing ? (
                        <span className="text-cyan-400 animate-pulse">CALCULATING...</span>
                      ) : (
                        `${simulatedOcrConf}% ${simulatedOcrConf >= settings.plateConfidenceMin ? '(HIGH)' : '(UNRELIABLE)'}`
                      )}
                    </span>
                  </div>
                  {/* Visual gauge */}
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className={`h-full transition-all duration-500 rounded-full ${
                        isAnalyzing ? 'bg-cyan-500 animate-pulse' : (simulatedOcrConf >= settings.plateConfidenceMin ? 'bg-emerald-500' : 'bg-red-500')
                      }`}
                      style={{ width: `${isAnalyzing ? 100 : simulatedOcrConf}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[8px] font-mono text-slate-500">
                    <span>Unreliable</span>
                    <span>Required Min: {settings.plateConfidenceMin}%</span>
                    <span>Absolute Certainty</span>
                  </div>
                </div>

                {/* Vehicle plate OCR text read-out */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase font-semibold text-slate-400 block">OCR Detected Plate Text:</label>
                  <div className="w-full bg-slate-950 border border-slate-850 rounded py-2 text-center font-mono uppercase font-black text-yellow-400 tracking-widest text-base shadow-inner">
                    {isAnalyzing ? (
                      <span className="text-cyan-400 animate-pulse font-bold tracking-widest">[SCANNING...]</span>
                    ) : (outcome && !outcome.accepted) ? (
                      <span className="text-red-400 font-bold tracking-normal text-xs">[NOT DETECTED]</span>
                    ) : (
                      simulatedPlate || '---'
                    )}
                  </div>
                </div>

                {/* CITIZEN ESCALATION NOTE & AUDIO MEMO - Replacing AI Cabin Glass Penetration */}
                {isCitizenMode && (
                  <div className="mt-3 p-3 bg-slate-900/60 border border-slate-800 rounded-lg space-y-2.5">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-indigo-400">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        CITIZEN ESCALATION DISPATCH NOTE
                      </div>
                      <span className="text-[8px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono font-bold px-1.5 py-0.5 rounded uppercase">
                        LOCAL FIELD INPUT
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-wider block">
                        Escalation Dispatch Note
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Type any special details to escalate to police dispatch..."
                        value={citizenNotes}
                        onChange={e => setCitizenNotes(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 rounded p-2 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-indigo-500 font-mono transition"
                      />
                    </div>

                    {/* Integrated simulated voice recorder for escalation notes */}
                    <div className="space-y-2 pt-1 border-t border-slate-850">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-mono font-black text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                          <Mic className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
                          Escalation Voice Memo
                        </span>
                        {recordedVoice ? (
                          <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono px-1.5 py-0.5 rounded-sm uppercase font-bold">
                            ✓ RECORDED ({seconds}s)
                          </span>
                        ) : (
                          <span className="text-[8px] text-slate-500 font-mono uppercase">
                            Optional audio clip
                          </span>
                        )}
                      </div>

                      {!isRecording && !recordedVoice ? (
                        <button
                          type="button"
                          onClick={startRecording}
                          className="w-full py-1.5 bg-slate-950 hover:bg-slate-850 text-indigo-400 hover:text-indigo-300 text-[9px] font-mono font-black uppercase rounded flex items-center justify-center gap-1.5 border border-slate-850 transition cursor-pointer"
                        >
                          <Mic className="w-3 h-3 text-indigo-400" />
                          Record Escalation Voice Note
                        </button>
                      ) : isRecording ? (
                        <div className="space-y-2 text-center py-1.5 bg-red-950/15 rounded border border-red-900/10">
                          {/* Audio Wave Visualizer */}
                          <div className="flex justify-center items-center gap-1 h-4">
                            <span className="w-1 bg-red-500 rounded animate-pulse" style={{ height: '75%', animationDuration: '0.4s' }} />
                            <span className="w-1 bg-red-400 rounded animate-pulse" style={{ height: '45%', animationDuration: '0.6s' }} />
                            <span className="w-1 bg-red-500 rounded animate-pulse" style={{ height: '95%', animationDuration: '0.3s' }} />
                          </div>
                          <div className="flex justify-between items-center px-2 text-[9px]">
                            <span className="text-red-400 font-mono font-bold animate-pulse">RECORDING AUDIO...</span>
                            <span className="font-mono text-slate-300">00:{seconds < 10 ? `0${seconds}` : seconds}</span>
                            <button
                              type="button"
                              onClick={stopRecording}
                              className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white font-mono uppercase rounded flex items-center gap-1 cursor-pointer font-bold"
                            >
                              Stop
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Playback simulator
                        <div className="flex items-center justify-between bg-slate-950 p-1.5 rounded border border-slate-850">
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={togglePlayback}
                              className="p-1 bg-indigo-650 hover:bg-indigo-500 text-white rounded transition cursor-pointer flex items-center justify-center"
                            >
                              {isPlaying ? <Pause className="w-3 h-3 fill-current text-white" /> : <Play className="w-3 h-3 fill-current text-white" />}
                            </button>
                            <div className="flex flex-col">
                              <span className="text-[8px] font-mono font-bold text-slate-300">ESCALATION_MEMO.WAV</span>
                              <span className="text-[7px] font-mono text-slate-500">
                                {isPlaying ? `00:${playSeconds < 10 ? `0${playSeconds}` : playSeconds}` : `00:00`} / 00:{seconds < 10 ? `0${seconds}` : seconds}
                              </span>
                            </div>
                          </div>
                          
                          {/* Audio progress track */}
                          <div className="flex-1 mx-2 bg-slate-900 h-1 rounded overflow-hidden relative">
                            <div 
                              className="bg-indigo-500 h-full transition-all duration-300"
                              style={{ width: isPlaying ? `${(playSeconds / seconds) * 100}%` : '0%' }}
                            />
                          </div>

                          <button
                            type="button"
                            onClick={deleteRecording}
                            className="p-1 hover:bg-slate-850 text-slate-500 hover:text-red-400 rounded transition cursor-pointer"
                            title="Delete memo"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Integrated Action Buttons for Direct Send/Save */}
                    <div className="pt-2.5 border-t border-slate-850 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleCitizenAction('Dismiss')}
                          className="py-1.5 bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-white font-mono uppercase text-[9px] font-black rounded border border-slate-850 hover:border-slate-800 transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3 h-3 text-rose-500" />
                          ✕ Dismiss
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCitizenAction('Draft')}
                          className="py-1.5 bg-slate-950 hover:bg-slate-850 text-indigo-400 hover:text-indigo-300 font-mono uppercase text-[9px] font-black rounded border border-slate-850 hover:border-slate-800 transition flex items-center justify-center gap-1 cursor-pointer font-bold animate-pulse"
                        >
                          <Upload className="w-3.5 h-3.5 text-indigo-400" />
                          📥 Save Draft
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCitizenAction('Submit')}
                        className="w-full py-2 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-mono uppercase text-[10px] font-black rounded shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer font-bold"
                      >
                        <Send className="w-3.5 h-3.5 text-emerald-300" />
                        ⚡ Escalate & Send to Police
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quality Analysis result readout */}
          {outcome && (
            <div className="p-3 bg-brand-bg rounded border border-slate-850 space-y-2.5" id="analysis-gate-result">
              <h4 className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                Optical Gate Assessment
              </h4>

              <div className="space-y-1.5 text-xs">
                {/* Face Quality assessment */}
                <div className="flex justify-between items-center pb-1 border-b border-slate-900/80">
                  <span className="text-slate-400">Resolution Gateway:</span>
                  <span className={`font-bold flex items-center gap-1 ${outcome.qualityScore >= (scanMode === 'Face' ? settings.faceQualityMin : settings.plateQualityMin) ? 'text-emerald-400' : 'text-red-400'}`}>
                    {outcome.qualityScore >= (scanMode === 'Face' ? settings.faceQualityMin : settings.plateQualityMin) ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" /> Passed
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" /> Failed
                      </>
                    )}
                  </span>
                </div>

                {/* Blur assessment */}
                <div className="flex justify-between items-center pb-1 border-b border-slate-900/80">
                  <span className="text-slate-400">Blur Tolerance Gate:</span>
                  <span className={`font-bold flex items-center gap-1 ${outcome.blurScore <= (scanMode === 'Face' ? settings.faceBlurMax : settings.plateBlurMax) ? 'text-emerald-400' : 'text-red-400'}`}>
                    {outcome.blurScore <= (scanMode === 'Face' ? settings.faceBlurMax : settings.plateBlurMax) ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" /> Passed
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" /> Obscured
                      </>
                    )}
                  </span>
                </div>

                {/* Combined Acceptance Badge */}
                <div className="pt-1.5 text-center">
                  <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    outcome.accepted 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {outcome.accepted ? "CAMERA CROP ACCEPTED" : "REJECTED BEFORE RECOGNITION"}
                  </span>
                </div>
              </div>

              {/* Error box if rejected */}
              {!outcome.accepted && outcome.reason && (
                <div className="p-2.5 bg-red-950/15 border border-red-900/30 rounded text-[10px] font-mono text-red-400 leading-relaxed flex flex-col gap-2">
                  <div className="flex gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-400 mt-0.5" />
                    <span>{outcome.reason}</span>
                  </div>
                  {scanMode === 'Vehicle' && outcome.reason.toLowerCase().includes("face") && (
                    <button
                      type="button"
                      onClick={() => setScanMode('Face')}
                      className="mt-1 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-slate-950 font-bold font-sans rounded text-[10px] uppercase tracking-wider transition self-start flex items-center gap-1 cursor-pointer"
                    >
                      🔄 Switch to Biometric Facial Scan
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* PANEL 3: Right Decision / Alert Match panel - 4 Cols */}
        <div className="lg:col-span-4 bg-brand-card border border-slate-800 rounded p-4 space-y-4 shadow-lg" id="decision-right-panel">
          <div className="border-b border-slate-850 pb-2 flex justify-between items-center">
            <h3 className={`text-xs font-mono font-black uppercase tracking-widest flex items-center gap-1.5 ${isCitizenMode ? 'text-indigo-400' : 'text-cyan-400'}`}>
              <ShieldCheck className="w-4 h-4" />
              {isCitizenMode ? "Citizen Draft Review" : "Watchlist Decision Match"}
            </h3>
            {isCitizenMode && (
              <span className="px-1.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[8px] font-mono font-bold uppercase rounded">
                Draft State
              </span>
            )}
          </div>

          {outcome && outcome.accepted ? (
            <div className="space-y-4" id="match-decision-outcome">
              {outcome.matchFound ? (
                // MATCH TRIGGERED
                <div className="space-y-4">
                  {isCitizenMode ? (
                    <div className="p-3 bg-indigo-950/40 border border-indigo-500/20 rounded-lg text-center space-y-1">
                      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse inline-block mb-1"></span>
                      <h4 className="text-indigo-300 text-xs font-mono font-black uppercase tracking-wider">
                        🚨 Draft Watchlist Match Found
                      </h4>
                      <p className="text-[10px] text-slate-400 leading-normal font-mono">
                        Confirm details below to submit an official report to police dispatch.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-red-950/10 border border-red-900/30 rounded-lg text-center space-y-1">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block mb-1"></span>
                      <h4 className="text-red-400 text-xs font-mono font-black uppercase tracking-wider">
                        🔴 WARNING ALERT SENT TO DISPATCH
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Matches exceeded thresholds. Police operations queue triggered.
                      </p>
                    </div>
                  )}

                  {/* Matching item data block */}
                  {scanMode === 'Face' && outcome.matchedFace && (
                    <div className="bg-brand-bg/85 p-3 rounded border border-slate-850 space-y-3 text-xs">
                      <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                        Side-by-Side Biometric Comparison
                      </div>
                      
                      {/* Side by side images */}
                      <div className="grid grid-cols-2 gap-2 relative">
                        {/* Source Frame */}
                        <div className="space-y-1">
                          <div className="aspect-square bg-slate-900 rounded overflow-hidden border border-slate-800 relative">
                            <img 
                              src={selectedImage} 
                              alt="Scanned frame" 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute bottom-0 inset-x-0 bg-slate-950/75 py-0.5 text-center text-[8px] font-mono font-bold text-slate-400">
                              SCANNED IMAGE
                            </div>
                          </div>
                        </div>

                        {/* Database Photo */}
                        <div className="space-y-1">
                          <div className="aspect-square bg-slate-900 rounded overflow-hidden border border-slate-800 relative">
                            <img 
                              src={outcome.matchedFace.reference_face_image} 
                              alt="Database template" 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute bottom-0 inset-x-0 bg-slate-950/75 py-0.5 text-center text-[8px] font-mono font-bold text-cyan-400">
                              DATABASE PHOTO
                            </div>
                          </div>
                        </div>

                        {/* Floating similarity badge in the center of the two photos */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-cyan-950/95 border border-cyan-400 text-cyan-300 text-[9px] font-black font-mono px-1.5 py-0.5 rounded shadow-lg backdrop-blur-sm z-10 whitespace-nowrap">
                          {outcome.similarityScore}% MATCH
                        </div>
                      </div>

                      {/* Details */}
                      <div className="pt-2 border-t border-slate-850 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-slate-400 font-mono">Watchlist ID:</span>
                          <span className="font-mono text-xs font-bold text-cyan-400">{outcome.matchedFace.watchlist_id}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-slate-400 font-mono">Candidate:</span>
                          <span className="text-xs font-bold text-white">{outcome.matchedFace.candidate_name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-slate-400 font-mono">Status & Risk:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">{outcome.matchedFace.status_type}</span>
                            <span className="text-[9px] px-1 bg-red-950/35 text-rose-400 rounded border border-rose-900/40 uppercase font-black">{outcome.matchedFace.risk_priority}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-slate-400 font-mono">Similarity Score:</span>
                          <div className="flex items-center gap-1">
                            <span className="text-cyan-300 font-mono font-black">{outcome.similarityScore}%</span>
                            <span className="text-[9px] text-slate-500 font-mono">(Req: {settings.faceThreshold}%)</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-slate-400 font-mono">Warrant Case:</span>
                          <span className="font-mono text-slate-300">{outcome.matchedFace.case_id}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {scanMode === 'Vehicle' && outcome.matchedVehicle && (
                    <div className="bg-brand-bg/85 p-3 rounded border border-slate-850 space-y-3 text-xs">
                      <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                        Side-by-Side Optical Comparison
                      </div>

                      {/* Side by side images */}
                      <div className="grid grid-cols-2 gap-2 relative">
                        {/* Source Frame */}
                        <div className="space-y-1">
                          <div className="aspect-square bg-slate-900 rounded overflow-hidden border border-slate-800 relative">
                            <img 
                              src={selectedImage} 
                              alt="Scanned frame" 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute bottom-0 inset-x-0 bg-slate-950/75 py-0.5 text-center text-[8px] font-mono font-bold text-slate-400">
                              SCANNED IMAGE
                            </div>
                          </div>
                        </div>

                        {/* Database Photo */}
                        <div className="space-y-1">
                          <div className="aspect-square bg-slate-900 rounded overflow-hidden border border-slate-800 relative">
                            <img 
                              src={outcome.matchedVehicle.reference_vehicle_image} 
                              alt="Database template" 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute bottom-0 inset-x-0 bg-slate-950/75 py-0.5 text-center text-[8px] font-mono font-bold text-cyan-400">
                              DATABASE PHOTO
                            </div>
                          </div>
                        </div>

                        {/* Floating similarity/confidence badge */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-cyan-950/95 border border-cyan-400 text-cyan-300 text-[9px] font-black font-mono px-1.5 py-0.5 rounded shadow-lg backdrop-blur-sm z-10 whitespace-nowrap">
                          OCR CONFIDENCE: {outcome.similarityScore}%
                        </div>
                      </div>

                      {/* Details */}
                      <div className="pt-2 border-t border-slate-850 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-slate-400 font-mono">Watchlist ID:</span>
                          <span className="font-mono text-xs font-bold text-cyan-400">{outcome.matchedVehicle.vehicle_watchlist_id}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-slate-400 font-mono">Plate Number:</span>
                          <span className="px-1.5 py-0.5 bg-yellow-400 text-slate-950 font-mono font-black rounded border border-slate-900 uppercase">
                            {outcome.matchedVehicle.plate_number}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-slate-400 font-mono">Make & Model:</span>
                          <span className="text-white font-medium">{outcome.matchedVehicle.vehicle_make} {outcome.matchedVehicle.vehicle_model}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-slate-400 font-mono">Status & Risk:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">{outcome.matchedVehicle.vehicle_status_type}</span>
                            <span className="text-[9px] px-1 bg-red-950/35 text-rose-400 rounded border border-rose-900/40 uppercase font-black">{outcome.matchedVehicle.risk_priority}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-slate-400 font-mono">OCR Confidence:</span>
                          <div className="flex items-center gap-1">
                            <span className="text-cyan-300 font-mono font-black">{outcome.similarityScore}%</span>
                            <span className="text-[9px] text-slate-500 font-mono">(Req: {settings.plateConfidenceMin}%)</span>
                          </div>
                        </div>
                      </div>

                      {/* Dynamic Cabin Scan Occupant Match! */}
                      {outcome.occupantFaceDetected && outcome.occupantMatchedFace && (
                        <div className="mt-3 pt-3 border-t border-slate-850 space-y-2">
                          <div className="text-[10px] uppercase tracking-wider font-bold text-rose-400 flex items-center gap-1 font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                            Cabin Occupant Scanner Match
                          </div>

                          <div className="grid grid-cols-2 gap-2 relative">
                            {/* Source reference label */}
                            <div className="space-y-1">
                              <div className="aspect-square bg-slate-900 rounded overflow-hidden border border-slate-800 relative">
                                <img 
                                  src={selectedImage} 
                                  alt="Scanned frame occupant" 
                                  className="w-full h-full object-cover scale-[1.5] origin-top"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute bottom-0 inset-x-0 bg-rose-950/75 py-0.5 text-center text-[8px] font-mono font-bold text-rose-400">
                                  CABIN BLOWUP
                                </div>
                              </div>
                            </div>

                            {/* Database Face Photo */}
                            <div className="space-y-1">
                              <div className="aspect-square bg-slate-900 rounded overflow-hidden border border-slate-800 relative">
                                <img 
                                  src={outcome.occupantMatchedFace.reference_face_image} 
                                  alt="Database face template" 
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute bottom-0 inset-x-0 bg-slate-950/75 py-0.5 text-center text-[8px] font-mono font-bold text-cyan-400">
                                  WANTED DOSSIER
                                </div>
                              </div>
                            </div>

                            {/* Floating occupant similarity */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-rose-950/95 border border-rose-500 text-rose-300 text-[9px] font-black font-mono px-1.5 py-0.5 rounded shadow-lg backdrop-blur-sm z-10 whitespace-nowrap">
                              {outcome.occupantMatchSimilarity}% FACE MATCH
                            </div>
                          </div>

                          <div className="p-2 bg-rose-500/5 rounded border border-rose-500/10 space-y-1 text-[11px]">
                            <div className="flex justify-between">
                              <span className="text-[10px] text-slate-400 font-mono">Suspect Name:</span>
                              <span className="font-bold text-rose-300">{outcome.occupantMatchedFace.candidate_name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[10px] text-slate-400 font-mono">Dossier ID:</span>
                              <span className="font-mono text-xs font-bold text-rose-400">{outcome.occupantMatchedFace.watchlist_id}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[10px] text-slate-400 font-mono">Case ID:</span>
                              <span className="font-mono text-xs text-slate-400">{outcome.occupantMatchedFace.case_id}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[10px] text-slate-400 font-mono">Priority:</span>
                              <span className="px-1 py-0.2 text-[9px] bg-red-950/50 border border-red-500/40 text-red-400 font-bold font-mono rounded uppercase">{outcome.occupantMatchedFace.risk_priority} RISK</span>
                            </div>
                            <div className="text-[10px] text-slate-400 italic pt-1 leading-normal border-t border-rose-950/30">
                              "{outcome.occupantAssessment}"
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Immediate jump action link to review alert */}
                  {!isCitizenMode && latestAlertId && (
                    <button
                      onClick={() => onNavigate('Police Review Panel', latestAlertId)}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded text-xs font-bold transition flex items-center justify-center gap-1.5 border border-slate-700"
                      id="view-alert-trigger-btn"
                    >
                      Open Police Review Panel
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : (
                // MATCH BELOW THRESHOLD or NO WATCHLIST ENTRY
                <div className="space-y-4">
                  {isCitizenMode ? (
                    <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-lg flex items-start gap-2.5 text-left font-mono">
                      <CheckCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-indigo-300 uppercase block leading-none">No immediate database match</span>
                        <p className="text-[9px] text-slate-500 leading-normal mt-1">
                          No direct stolen or wanted record detected. You can still report this to log its location and earn points!
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-brand-bg rounded border border-slate-850 space-y-1.5 text-center text-xs">
                      <ShieldCheck className="w-7 h-7 text-emerald-500 mx-auto mb-1" />
                      <h4 className="text-white font-bold uppercase text-[11px]">No Warning Triggered</h4>
                      <p className="text-[10px] text-slate-500 leading-normal font-mono">
                        Scan processed. Bounding checks approved but no registered watchlist targets exceeded the comparison parameters.
                      </p>
                    </div>
                  )}

                  <div className="space-y-1.5 p-2.5 bg-brand-bg/40 border border-slate-850 rounded text-xs text-slate-400 font-mono">
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                      <span>Database Match:</span>
                      <span className="text-slate-300 font-bold">CLEARED</span>
                    </div>
                    {scanMode === 'Face' ? (
                      <div className="flex justify-between">
                        <span>Max Match Score:</span>
                        <span className="text-slate-500">{outcome.similarityScore || 18}% (Req: {settings.faceThreshold}%)</span>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <span>Database check:</span>
                        <span className="text-slate-500">NOT_FOUND</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* CITIZEN SUBMISSION CONTROL SHEET (Only in Citizen Mode) */}
              {isCitizenMode && (
                <div className="border-t border-slate-850 pt-3.5 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-lg space-y-2">
                    <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-indigo-400">
                      <Shield className="w-4 h-4 text-indigo-400" />
                      CITIZEN DECISION CENTRE
                    </div>
                    <p className="text-[9.5px] text-slate-400 font-sans leading-normal">
                      Review the scan results and choose a citizen action. You can dismiss, save as a draft to your reports history to decide later, or escalate directly to police dispatch.
                    </p>
                  </div>

                  {/* Submission, Draft, and Dismissal Actions */}
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleCitizenAction('Dismiss')}
                        className="py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white font-mono uppercase text-[9px] font-black rounded border border-slate-800 hover:border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                        ✕ Dismiss Locally
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCitizenAction('Draft')}
                        className="py-2 bg-slate-900 hover:bg-slate-850 text-indigo-400 hover:text-indigo-300 font-mono uppercase text-[9px] font-black rounded border border-slate-800 hover:border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-indigo-400" />
                        📥 Send to History
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCitizenAction('Submit')}
                      className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-mono uppercase text-[10px] font-black rounded shadow-lg shadow-indigo-950/50 hover:shadow-indigo-950/70 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Send className="w-4 h-4 text-emerald-300" />
                      ⚡ Escalate & Send to Police
                    </button>
                  </div>
                  
                  <div className="text-center text-[8.5px] font-mono text-slate-500 leading-normal bg-slate-950/30 p-1.5 rounded border border-slate-900">
                    <div>Direct Escalation: <span className="text-indigo-400 font-bold">+250 pts</span> (Match) / <span className="text-cyan-400 font-bold">+50 pts</span></div>
                    <div>Local Dismissal: <span className="text-emerald-400 font-bold">+10 pts</span> | History Draft: <span className="text-slate-400 font-bold">Actions from History Tab</span></div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500 text-xs text-center" id="decision-empty-state">
              <Scan className="w-8 h-8 text-slate-700 mb-2" />
              <span className="font-mono text-[10px] uppercase font-bold text-slate-400">Pending Scanner Stream</span>
              <p className="text-[10px] text-slate-600 mt-1 max-w-[180px] leading-relaxed">
                {isCitizenMode ? "Select preset simulation scenario or upload a photo to initiate ANPR scan." : "Initiate a radar analysis scan in left column to compile matches."}
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
