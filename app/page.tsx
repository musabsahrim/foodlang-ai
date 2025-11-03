"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useAppStore } from "@/lib/store"
import { api } from "@/lib/api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DollarSign,
  FileText,
  Upload,
  Camera,
  Lock,
  Copy,
  Loader2,
  CloudUpload,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  LogOut,
  Clock,
  Heart,
  StopCircle,
} from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export default function FoodLangAI() {
  const { toast } = useToast()
  const { costTracker, updateCost, loadCostFromBackend } = useAppStore()
  const [activeTab, setActiveTab] = useState("text")

  // Text translation state
  const [inputText, setInputText] = useState("")
  const [translatedText, setTranslatedText] = useState("")
  const [detectedLanguage, setDetectedLanguage] = useState<"arabic" | "english" | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)
  const [showResult, setShowResult] = useState(false)

  const [showCostBreakdown, setShowCostBreakdown] = useState(false)

  // Upload image state
  const [ocrMethod, setOcrMethod] = useState("gpt4")
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedText, setExtractedText] = useState("")
  const [imageTranslation, setImageTranslation] = useState("")
  const [imageDetectedLanguage, setImageDetectedLanguage] = useState<"arabic" | "english" | null>(null)
  const [showImageResult, setShowImageResult] = useState(false)

  // Camera capture state - debugged version
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null) // Changed from `stream` state to `streamRef`
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isCameraOn, setIsCameraOn] = useState(false) // Changed from `isCameraActive`
  const [error, setError] = useState<string | null>(null) // Changed from `cameraError`

  // Glossary state
  const [glossaryFile, setGlossaryFile] = useState<File | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [validationResult, setValidationResult] = useState<{
    valid: boolean
    entries?: number
    preview?: Array<{ english: string; arabic: string }>
    error?: string
  } | null>(null)
  const [showUploadConfirm, setShowUploadConfirm] = useState(false)
  const [showRollbackConfirm, setShowRollbackConfirm] = useState(false)
  const [selectedRollbackId, setSelectedRollbackId] = useState<number | null>(null)
  const [sessionTimeLeft, setSessionTimeLeft] = useState(1800) // 30 minutes in seconds

  // Admin login state
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [loginError, setLoginError] = useState("")

  // Usage statistics state
  const [usageStats, setUsageStats] = useState<any>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const [showUsageDetails, setShowUsageDetails] = useState(false)

  // Mock data
  const glossaryInfo = {
    totalEntries: 1247,
    lastUpdated: "2024-01-15 14:30:00",
    fileSize: 2.4,
  }

  const updateHistory = [
    { id: 1, date: "2024-01-15 14:30", entries: 1247, updatedBy: "admin", action: "Upload" },
    { id: 2, date: "2024-01-10 09:15", entries: 1180, updatedBy: "admin", action: "Upload" },
    { id: 3, date: "2024-01-05 16:45", entries: 1150, updatedBy: "admin", action: "Upload" },
    { id: 4, date: "2023-12-28 11:20", entries: 1100, updatedBy: "admin", action: "Upload" },
    { id: 5, date: "2023-12-20 13:00", entries: 1050, updatedBy: "admin", action: "Upload" },
  ]

  // Load cost data on mount
  useEffect(() => {
    loadCostFromBackend()
  }, [loadCostFromBackend])

  // Cleanup on unmount for camera stream
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        // Changed from `stream`
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, []) // Removed `stream` from dependency array as it's now a ref

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter in text area = Translate
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && activeTab === "text" && inputText.trim()) {
        e.preventDefault()
        handleTranslate()
      }
      // Esc = Close modals
      if (e.key === "Escape") {
        setShowCostBreakdown(false)
        setShowUploadConfirm(false)
        setShowRollbackConfirm(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [activeTab, inputText])

  // Load usage statistics when logged in
  useEffect(() => {
    if (isLoggedIn) {
      loadUsageStatistics()
    }
  }, [isLoggedIn])

  // Session timer
  useEffect(() => {
    if (!isLoggedIn) return

    const timer = setInterval(() => {
      setSessionTimeLeft((prev) => {
        if (prev <= 1) {
          setIsLoggedIn(false)
          setUsername("")
          setPassword("")
          clearInterval(timer)
          toast({
            title: "Session Expired",
            description: "Your session has expired. Please log in again.",
            variant: "destructive",
          })
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isLoggedIn, toast])

  const handleLogin = async () => {
    setLoginError("")
    setIsLoggingIn(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Mock authentication (username: admin, password: admin123)
    if (username === "admin" && password === "admin123") {
      setIsLoggedIn(true)
      setSessionTimeLeft(1800) // Reset timer
      toast({
        title: "Login Successful",
        description: "Welcome to the admin panel!",
        className: "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-900",
      })
    } else {
      setLoginError("Invalid username or password")
      toast({
        title: "Login Failed",
        description: "Invalid username or password",
        variant: "destructive",
      })
    }

    setIsLoggingIn(false)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setUsername("")
    setPassword("")
    setSessionTimeLeft(1800)
    setUsageStats(null)
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
      className: "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-900",
    })
  }

  const loadUsageStatistics = async () => {
    if (!isLoggedIn) return
    
    setIsLoadingStats(true)
    try {
      // Mock token for now - in real implementation, this would come from login
      const mockToken = "mock-jwt-token"
      const stats = await api.admin.getUsageStatistics(mockToken)
      setUsageStats(stats)
    } catch (error) {
      console.error("Failed to load usage statistics:", error)
      toast({
        title: "Error",
        description: "Failed to load usage statistics",
        variant: "destructive",
      })
    } finally {
      setIsLoadingStats(false)
    }
  }

  const handleGlossaryFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.name.endsWith(".xlsx")) {
      setGlossaryFile(file)
      setValidationResult(null)
    }
  }

  const handleGlossaryDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.name.endsWith(".xlsx")) {
      setGlossaryFile(file)
      setValidationResult(null)
    }
  }

  const handleValidateFile = async () => {
    if (!glossaryFile) return

    setIsValidating(true)
    setValidationResult(null)

    // Simulate validation
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Mock validation result
    setValidationResult({
      valid: true,
      entries: 1350,
      preview: [
        { english: "Flour", arabic: "دقيق" },
        { english: "Sugar", arabic: "سكر" },
        { english: "Salt", arabic: "ملح" },
        { english: "Vegetable Oil", arabic: "زيت نباتي" },
        { english: "Water", arabic: "ماء" },
      ],
    })

    setIsValidating(false)
    toast({
      title: "Validation Successful",
      description: "File validated successfully with 1350 entries.",
      className: "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-900",
    })
  }

  const handleUploadGlossary = async () => {
    setShowUploadConfirm(false)
    setIsUploading(true)
    setUploadProgress(0)

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 10
      })
    }, 200)

    await new Promise((resolve) => setTimeout(resolve, 2500))

    setIsUploading(false)
    setGlossaryFile(null)
    setValidationResult(null)

    toast({
      title: "Upload Successful",
      description: "Glossary uploaded and index rebuilt successfully!",
      className: "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-900",
    })
  }

  const handleRollback = async (id: number) => {
    setShowRollbackConfirm(false)

    // Simulate rollback
    await new Promise((resolve) => setTimeout(resolve, 1000))

    toast({
      title: "Rollback Successful",
      description: `Successfully rolled back to version ${id}`,
      className: "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-900",
    })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleTranslate = async () => {
    if (!inputText.trim()) return

    setIsTranslating(true)
    setShowResult(false)

    try {
      const response = await fetch(`${API_BASE_URL}/api/translate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: inputText,
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      // Set detected language and translation from API response
      setDetectedLanguage(data.detected_language)
      setTranslatedText(data.translated_text)

      // Update session cost if cost is provided
      if (data.cost_estimate && data.tokens_used) {
        updateCost(data.cost_estimate, data.tokens_used)
      }

      setShowResult(true)
      toast({
        title: "Translation Complete",
        description: "Your text has been translated successfully.",
        className: "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-900",
      })
    } catch (error) {
      console.error("Translation error:", error)
      toast({
        title: "Translation Failed",
        description: "Failed to translate text. Please check your backend connection.",
        variant: "destructive",
      })
    } finally {
      setIsTranslating(false)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(translatedText)
    toast({
      title: "Copied!",
      description: "Translation copied to clipboard.",
      className: "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-900",
    })
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string)
        setShowImageResult(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string)
        setShowImageResult(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleExtractAndTranslate = async () => {
    if (!uploadedImage) return

    setIsProcessing(true)
    setShowImageResult(false)

    try {
      // Convert base64 to blob
      const response = await fetch(uploadedImage)
      const blob = await response.blob()

      // Create form data
      const formData = new FormData()
      formData.append("file", blob, "uploaded-image.jpg")
      formData.append("ocr_method", ocrMethod === "gpt4" ? "gpt-vision" : "tesseract")

      // Call backend API
      const apiResponse = await fetch(`${API_BASE_URL}/api/ocr`, {
        method: "POST",
        body: formData,
      })

      if (!apiResponse.ok) {
        throw new Error(`API error: ${apiResponse.status}`)
      }

      const data = await apiResponse.json()

      // Set extracted text and translation from API response
      setExtractedText(data.extracted_text)
      setImageDetectedLanguage(data.detected_language)
      setImageTranslation(data.translated_text)

      // Update session cost if cost is provided
      if (data.cost_estimate && data.tokens_used) {
        updateCost(data.cost_estimate, data.tokens_used)
      }

      setShowImageResult(true)
      toast({
        title: "Processing Complete",
        description: "Text extracted and translated successfully.",
        className: "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-900",
      })
    } catch (error) {
      console.error("OCR error:", error)
      toast({
        title: "Processing Failed",
        description: "Failed to process image. Please check your backend connection.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleProcessAnother = () => {
    setUploadedImage(null)
    setShowImageResult(false)
    setExtractedText("")
    setImageTranslation("")
  }

  const handleCopyExtracted = async () => {
    await navigator.clipboard.writeText(extractedText)
    toast({
      title: "Copied!",
      description: "Extracted text copied to clipboard.",
      className: "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-900",
    })
  }

  const handleCopyImageTranslation = async () => {
    await navigator.clipboard.writeText(imageTranslation)
    toast({
      title: "Copied!",
      description: "Translation copied to clipboard.",
      className: "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-900",
    })
  }

  // Camera functions - debugged version
  const startCamera = useCallback(async () => {
    // useCallback added as per original, but streamRef is stable
    try {
      setError(null) // Changed from setCameraError
      // setIsVideoReady(false) // Removed as isVideoReady is no longer used

      // Request camera access
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })

      console.log("Camera stream obtained:", mediaStream)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream

        // Wait for video metadata to load
        // Removed onloadedmetadata and play() promise handling as it's handled directly below
        videoRef.current
          .play() // Directly play the stream
          .then(() => {
            console.log("Video playing")
            // setIsVideoReady(true) // Removed
          })
          .catch((err) => {
            console.error("Play error:", err)
            setError("Failed to play video stream") // Changed from setCameraError
          })
      }

      streamRef.current = mediaStream // Changed from setStream
      setIsCameraOn(true) // Changed from setIsCameraActive
    } catch (err: any) {
      console.error("Camera error:", err)

      let errorMessage = "Failed to access camera. "

      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMessage += "Please allow camera permissions in your browser settings."
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errorMessage += "No camera found on this device."
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        errorMessage += "Camera is already in use by another application."
      } else {
        errorMessage += err.message || "Unknown error occurred."
      }

      setError(errorMessage) // Changed from setCameraError
      setIsCameraOn(false) // Changed from setIsCameraActive
      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }, [toast]) // Removed dependencies that are no longer relevant

  const stopCamera = useCallback(() => {
    // useCallback added
    if (streamRef.current) {
      // Changed from `stream`
      streamRef.current.getTracks().forEach((track) => {
        track.stop()
        console.log("Track stopped:", track.kind)
      })
      streamRef.current = null // Changed from setStream(null)
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsCameraOn(false) // Changed from setIsCameraActive
    // setIsVideoReady(false) // Removed
  }, []) // Removed `stream` dependency

  const capturePhoto = useCallback(() => {
    // useCallback added
    const video = videoRef.current
    const canvas = canvasRef.current

    // if (!video || !canvasRef.current || !isVideoReady) { // Removed isVideoReady check
    if (!video || !canvas) {
      setError("Video not ready. Please wait a moment and try again.") // Changed from setCameraError
      toast({
        title: "Not Ready",
        description: "Video not ready. Please wait a moment and try again.",
        variant: "destructive",
      })
      return
    }

    try {
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      console.log("Capturing:", {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
      })

      const ctx = canvas.getContext("2d")
      if (ctx) {
        // Draw current video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Convert to base64 image
        const imageData = canvas.toDataURL("image/jpeg", 0.8)
        setCapturedImage(imageData)
        stopCamera() // This now correctly stops the stream via streamRef

        console.log("Photo captured successfully")
        toast({
          title: "Photo Captured",
          description: "Photo captured successfully!",
          className: "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-900",
        })
      }
    } catch (err) {
      console.error("Capture error:", err)
      setError("Failed to capture photo. Please try again.") // Changed from setCameraError
      toast({
        title: "Capture Failed",
        description: "Failed to capture photo. Please try again.",
        variant: "destructive",
      })
    }
  }, [stopCamera, toast]) // Removed isVideoReady dependency

  const retake = useCallback(() => {
    // useCallback added
    setCapturedImage(null)
    startCamera()
  }, [startCamera])

  const handleCameraExtractAndTranslate = async () => {
    // Renamed from handleExtract
    if (!capturedImage) return

    setIsProcessing(true)

    try {
      // Convert base64 to blob
      const response = await fetch(capturedImage)
      const blob = await response.blob()

      // Create form data
      const formData = new FormData()
      formData.append("file", blob, "camera-capture.jpg")
      formData.append("ocr_method", "gpt-vision")

      // Call backend API
      const apiResponse = await fetch(`${API_BASE_URL}/api/ocr`, {
        method: "POST",
        body: formData,
      })

      if (!apiResponse.ok) {
        throw new Error(`API error: ${apiResponse.status}`)
      }

      const data = await apiResponse.json()

      // Set extracted text and translation from API response
      setExtractedText(data.extracted_text)
      setImageDetectedLanguage(data.detected_language)
      setImageTranslation(data.translated_text)

      // Update session cost if cost is provided
      if (data.cost_estimate && data.tokens_used) {
        updateCost(data.cost_estimate, data.tokens_used)
      }

      setShowImageResult(true)
      toast({
        title: "Processing Complete",
        description: "Text extracted and translated successfully.",
        className: "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-900",
      })
    } catch (error) {
      console.error("Translation error:", error)
      setError("Failed to translate image. Please try again.")
      toast({
        title: "Translation Failed",
        description: "Failed to translate image. Please check your backend connection.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-3 py-3 sm:px-4 sm:py-4">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl">🥗</span>
                <h1 className="text-xl font-bold text-foreground sm:text-2xl">FoodLang AI</h1>
              </div>
              <p className="text-xs text-muted-foreground sm:text-sm">Arabic ↔ English Food Packaging Translator</p>
            </div>
            
            {/* Cost Tracker Badge */}
            <Badge
              variant="secondary"
              className="cursor-pointer transition-all hover:bg-secondary/80"
              onClick={() => setShowCostBreakdown(true)}
            >
              <DollarSign className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm font-semibold">
                ${costTracker.sessionCost.toFixed(4)}
              </span>
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto flex-1 px-3 py-4 sm:px-4 sm:py-8">
        <Card className="mx-auto max-w-4xl">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 gap-1 p-1">
              <TabsTrigger
                value="text"
                className="flex items-center gap-1 px-2 text-xs transition-all sm:gap-2 sm:px-3 sm:text-sm"
              >
                <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Text Translation</span>
                <span className="sm:hidden">Text</span>
              </TabsTrigger>
              <TabsTrigger
                value="upload"
                className="flex items-center gap-1 px-2 text-xs transition-all sm:gap-2 sm:px-3 sm:text-sm"
              >
                <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Upload Image</span>
                <span className="sm:hidden">Upload</span>
              </TabsTrigger>
              <TabsTrigger
                value="camera"
                className="flex items-center gap-1 px-2 text-xs transition-all sm:gap-2 sm:px-3 sm:text-sm"
              >
                <Camera className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Camera Capture</span>
                <span className="sm:hidden">Camera</span>
              </TabsTrigger>
              <TabsTrigger
                value="admin"
                className="flex items-center gap-1 px-2 text-xs transition-all sm:gap-2 sm:px-3 sm:text-sm"
              >
                <Lock className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Admin Panel</span>
                <span className="sm:hidden">Admin</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="p-4 sm:p-6">
              <div className="space-y-4 sm:space-y-6">
                {/* Input Section */}
                <div className="space-y-3">
                  <Textarea
                    placeholder="Enter Arabic or English text to translate..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    rows={6}
                    className="resize-none text-sm sm:text-base"
                  />
                  <div className="flex items-center justify-between">
                    <Button
                      onClick={handleTranslate}
                      disabled={!inputText.trim() || isTranslating}
                      className="w-full rounded-lg bg-[#14b8a6] transition-all hover:bg-[#0d9488] sm:w-auto sm:px-8"
                    >
                      {isTranslating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Translating...
                        </>
                      ) : (
                        "Translate"
                      )}
                    </Button>
                    <span className="hidden text-xs text-muted-foreground md:inline">Ctrl/Cmd + Enter</span>
                  </div>
                </div>

                {isTranslating && (
                  <Card className="border shadow-sm">
                    <div className="space-y-3 p-4 sm:p-6">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </Card>
                )}

                {/* Result Section */}
                {showResult && translatedText && !isTranslating ? (
                  <Card
                    className={`border shadow-sm transition-all duration-300 ${showResult ? "animate-in fade-in slide-in-from-bottom-4" : ""}`}
                  >
                    <div className="p-4 sm:p-6">
                      {/* Result Header */}
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <h3 className="text-base font-semibold sm:text-lg">Translation Result</h3>
                          <Badge
                            variant="secondary"
                            className={
                              detectedLanguage === "arabic"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                            }
                          >
                            {detectedLanguage === "arabic" ? "Arabic" : "English"}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleCopy}
                          className="h-8 w-8 transition-all hover:bg-accent"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Translated Text */}
                      <p
                        className="text-base leading-relaxed sm:text-lg"
                        dir={detectedLanguage === "arabic" ? "rtl" : "ltr"}
                      >
                        {translatedText}
                      </p>
                    </div>
                  </Card>
                ) : (
                  !isTranslating && (
                    <div className="flex min-h-[150px] items-center justify-center rounded-lg border border-dashed sm:min-h-[200px]">
                      <p className="text-sm text-muted-foreground sm:text-base">Enter text above to get started</p>
                    </div>
                  )
                )}
              </div>
            </TabsContent>

            <TabsContent value="upload" className="p-4 sm:p-6">
              <div className="space-y-6">
                {/* OCR Method Selector */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">OCR Method</Label>
                  <RadioGroup value={ocrMethod} onValueChange={setOcrMethod} className="space-y-3">
                    <div className="flex items-center space-x-3 rounded-lg border p-4 transition-all hover:bg-accent/50">
                      <RadioGroupItem value="gpt4" id="gpt4" />
                      <Label htmlFor="gpt4" className="flex flex-1 cursor-pointer items-center justify-between">
                        <span>GPT-4 Vision (Recommended)</span>
                        <Badge className="bg-[#14b8a6] hover:bg-[#0d9488]">More Accurate</Badge>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 rounded-lg border p-4 transition-all hover:bg-accent/50">
                      <RadioGroupItem value="tesseract" id="tesseract" />
                      <Label htmlFor="tesseract" className="flex flex-1 cursor-pointer items-center justify-between">
                        <span>Tesseract OCR</span>
                        <Badge variant="secondary">Free</Badge>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Upload Section */}
                {!uploadedImage && !showImageResult && (
                  <div className="space-y-3">
                    <Label
                      htmlFor="image-upload"
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      className="flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/10 transition-colors hover:border-muted-foreground/50 hover:bg-muted/20"
                    >
                      <CloudUpload className="mb-4 h-12 w-12 text-muted-foreground" />
                      <p className="mb-2 text-center text-base font-medium">
                        Drag & drop image here or click to browse
                      </p>
                      <p className="text-sm text-muted-foreground">Accepts: .jpg, .jpeg, .png</p>
                    </Label>
                    <input
                      id="image-upload"
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                )}

                {/* Image Preview */}
                {uploadedImage && !showImageResult && (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <img
                        src={uploadedImage || "/placeholder.svg"}
                        alt="Uploaded preview"
                        className="max-w-full rounded-lg border shadow-sm"
                        style={{ maxWidth: "600px" }}
                      />
                    </div>
                    <Button
                      onClick={handleExtractAndTranslate}
                      disabled={isProcessing}
                      className="w-full rounded-lg bg-[#14b8a6] transition-all hover:bg-[#0d9488]"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Extract & Translate"
                      )}
                    </Button>
                  </div>
                )}

                {isProcessing && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="border shadow-sm">
                      <div className="space-y-3 p-6">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </Card>
                    <Card className="border shadow-sm">
                      <div className="space-y-3 p-6">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </Card>
                  </div>
                )}

                {/* Results Section */}
                {showImageResult && !isProcessing && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Extracted Text Card */}
                      <Card className="border shadow-sm">
                        <div className="p-6">
                          <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold">Extracted Text</h3>
                              <Badge
                                variant="secondary"
                                className={
                                  imageDetectedLanguage === "arabic"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                    : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                                }
                              >
                                {imageDetectedLanguage === "arabic" ? "Arabic" : "English"}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={handleCopyExtracted}
                              className="h-8 w-8 transition-all hover:bg-accent"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <p
                            className="text-base leading-relaxed"
                            dir={imageDetectedLanguage === "arabic" ? "rtl" : "ltr"}
                          >
                            {extractedText}
                          </p>
                        </div>
                      </Card>

                      {/* Translation Card */}
                      <Card className="border shadow-sm">
                        <div className="p-6">
                          <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold">Translation</h3>
                              <Badge
                                variant="secondary"
                                className={
                                  imageDetectedLanguage === "english"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                    : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                                }
                              >
                                {imageDetectedLanguage === "english" ? "Arabic" : "English"}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={handleCopyImageTranslation}
                              className="h-8 w-8 transition-all hover:bg-accent"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <p
                            className="text-base leading-relaxed"
                            dir={imageDetectedLanguage === "english" ? "rtl" : "ltr"}
                          >
                            {imageTranslation}
                          </p>
                        </div>
                      </Card>
                    </div>

                    {/* Process Another Button */}
                    <Button
                      onClick={handleProcessAnother}
                      variant="outline"
                      className="w-full rounded-lg bg-transparent transition-all"
                    >
                      Process Another Image
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="camera" className="p-4 sm:p-6">
              {/* Camera Tab Content - Replaced with debugged version */}
              <div className="mx-auto max-w-4xl space-y-4">
                <Card className="overflow-hidden">
                  {/* Video/Image Display */}
                  <div className="relative w-full bg-gray-900" style={{ minHeight: "400px" }}>
                    {/* Video Element */}
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="h-full w-full"
                      style={{
                        display: isCameraOn && !capturedImage ? "block" : "none", // Show video only when camera is on and no image is captured
                        minHeight: "400px",
                        objectFit: "cover",
                      }}
                    />

                    {/* Captured Image */}
                    {capturedImage && (
                      <img
                        src={capturedImage || "/placeholder.svg"}
                        alt="Captured"
                        className="h-auto w-full"
                        style={{ minHeight: "400px", objectFit: "contain" }} // Contain to preserve aspect ratio
                      />
                    )}

                    {/* Placeholder */}
                    {!isCameraOn && !capturedImage && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                        <Camera size={64} className="mb-4" />
                        <p className="text-lg">Click Start Camera below</p>
                      </div>
                    )}

                    {/* Hidden canvas for capture */}
                    <canvas ref={canvasRef} style={{ display: "none" }} />
                  </div>

                  {/* Error Display */}
                  {error && (
                    <div className="border-t border-red-200 bg-red-50 p-4">
                      <p className="text-sm text-red-700">{error}</p>
                      <button onClick={() => setError(null)} className="mt-1 text-xs text-red-600 underline">
                        Dismiss
                      </button>
                    </div>
                  )}

                  {/* Controls */}
                  <div className="space-y-3 border-t bg-white p-4">
                    {!isCameraOn && !capturedImage && (
                      <Button onClick={startCamera} className="w-full bg-[#14b8a6] hover:bg-[#0d9488]" size="lg">
                        <Camera className="mr-2" size={20} />
                        Start Camera
                      </Button>
                    )}

                    {isCameraOn && (
                      <div className="flex gap-2">
                        <Button onClick={capturePhoto} className="flex-1 bg-[#14b8a6] hover:bg-[#0d9488]" size="lg">
                          <Camera className="mr-2" size={20} />
                          Capture Photo
                        </Button>
                        <Button onClick={stopCamera} variant="outline" size="lg">
                          <StopCircle className="mr-2" size={20} />
                          Stop
                        </Button>
                      </div>
                    )}

                    {capturedImage && (
                      <div className="flex gap-2">
                        <Button
                          onClick={handleCameraExtractAndTranslate} // Use the renamed handler
                          className="flex-1 bg-[#14b8a6] hover:bg-[#0d9488]"
                          size="lg"
                        >
                          Extract & Translate
                        </Button>
                        <Button onClick={retake} variant="outline" size="lg">
                          <RotateCcw className="mr-2" size={20} />
                          Retake
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Browser Console Instructions */}
                <Card className="border-yellow-200 bg-yellow-50 p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>⚠️ Still seeing black screen?</strong> Open browser console (F12) and check for error
                    messages. Look for "Stream obtained" and "Video dimensions" in the console logs.
                  </p>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="admin" className="p-4 sm:p-6">
              {!isLoggedIn ? (
                <div className="flex min-h-[500px] items-center justify-center">
                  <Card className="w-full max-w-md border-[#f97316]/20 shadow-lg">
                    <div className="p-8">
                      <div className="mb-6 flex flex-col items-center gap-3">
                        <div className="rounded-full bg-[#f97316]/10 p-4">
                          <Lock className="h-8 w-8 text-[#f97316]" />
                        </div>
                        <h2 className="text-2xl font-bold">Admin Login</h2>
                        <p className="text-center text-sm text-muted-foreground">
                          Enter your credentials to access the admin panel
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="username">Username</Label>
                          <Input
                            id="username"
                            type="text"
                            placeholder="Enter username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                          />
                        </div>

                        {loginError && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{loginError}</AlertDescription>
                          </Alert>
                        )}

                        <Button
                          onClick={handleLogin}
                          disabled={!username || !password || isLoggingIn}
                          className="w-full bg-[#f97316] transition-all hover:bg-[#ea580c]"
                        >
                          {isLoggingIn ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Logging in...
                            </>
                          ) : (
                            "Login"
                          )}
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Session Timer and Logout */}
                  <div className="flex items-center justify-between rounded-lg border border-[#f97316]/20 bg-[#f97316]/5 p-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[#f97316]" />
                      <span className="text-sm font-medium">Session expires in: {formatTime(sessionTimeLeft)}</span>
                    </div>
                    <Button
                      onClick={handleLogout}
                      variant="outline"
                      size="sm"
                      className="border-[#f97316] bg-transparent text-[#f97316] transition-all hover:bg-[#f97316] hover:text-white"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </div>

                  <Card className="border-[#f97316]/20">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-[#f97316]">API Usage & Costs</h3>
                        <Button
                          onClick={loadUsageStatistics}
                          variant="ghost"
                          size="sm"
                          disabled={isLoadingStats}
                          className="text-[#f97316] hover:bg-[#f97316]/10"
                        >
                          {isLoadingStats ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RotateCcw className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      
                      {usageStats ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                            <span className="text-sm font-medium">Total Requests:</span>
                            <span className="text-sm font-bold">{usageStats.total_requests.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                            <span className="text-sm font-medium">Total Tokens:</span>
                            <span className="text-sm font-bold">{usageStats.total_tokens.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between rounded-lg bg-[#f97316]/10 p-3">
                            <span className="text-sm font-semibold">Total Cost:</span>
                            <span className="text-lg font-bold text-[#f97316]">${usageStats.total_cost.toFixed(4)}</span>
                          </div>
                          <Button
                            onClick={() => setShowUsageDetails(true)}
                            variant="outline"
                            className="w-full mt-3"
                          >
                            View Detailed Statistics
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-8">
                          <div className="text-center">
                            <DollarSign className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">
                              {isLoadingStats ? "Loading statistics..." : "Click refresh to load statistics"}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Section 1: Current Glossary Info */}
                  <Card className="border-[#f97316]/20">
                    <div className="p-6">
                      <h3 className="mb-4 text-lg font-semibold text-[#f97316]">Current Glossary</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                          <span className="text-sm font-medium">Total Entries:</span>
                          <span className="text-sm font-bold">{glossaryInfo.totalEntries} entries</span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                          <span className="text-sm font-medium">Last Updated:</span>
                          <span className="text-sm">{glossaryInfo.lastUpdated}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                          <span className="text-sm font-medium">File Size:</span>
                          <span className="text-sm">{glossaryInfo.fileSize} MB</span>
                        </div>
                      </div>
                      <Button className="mt-4 w-full bg-[#f97316] transition-all hover:bg-[#ea580c]">
                        <Download className="mr-2 h-4 w-4" />
                        Download Current Glossary
                      </Button>
                    </div>
                  </Card>

                  {/* Section 2: Upload New Glossary */}
                  <Card className="border-[#f97316]/20">
                    <div className="p-6">
                      <h3 className="mb-4 text-lg font-semibold text-[#f97316]">Update Glossary</h3>

                      {/* File Upload */}
                      {!glossaryFile && (
                        <div className="space-y-3">
                          <Label
                            htmlFor="glossary-upload"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleGlossaryDrop}
                            className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#f97316]/25 bg-[#f97316]/5 transition-colors hover:border-[#f97316]/50 hover:bg-[#f97316]/10"
                          >
                            <CloudUpload className="mb-4 h-12 w-12 text-[#f97316]" />
                            <p className="mb-2 text-center text-base font-medium">
                              Drag & drop Excel file here or click to browse
                            </p>
                            <p className="text-sm text-muted-foreground">Accepts: .xlsx only</p>
                          </Label>
                          <input
                            id="glossary-upload"
                            type="file"
                            accept=".xlsx"
                            onChange={handleGlossaryFileSelect}
                            className="hidden"
                          />
                        </div>
                      )}

                      {/* File Selected */}
                      {glossaryFile && !validationResult && (
                        <div className="space-y-4">
                          <Alert>
                            <FileText className="h-4 w-4" />
                            <AlertDescription>
                              Selected file: <strong>{glossaryFile.name}</strong>
                            </AlertDescription>
                          </Alert>
                          <div className="flex gap-3">
                            <Button
                              onClick={() => setGlossaryFile(null)}
                              variant="outline"
                              className="flex-1 transition-all"
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleValidateFile}
                              disabled={isValidating}
                              className="flex-1 bg-[#f97316] transition-all hover:bg-[#ea580c]"
                            >
                              {isValidating ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Validating...
                                </>
                              ) : (
                                "Validate File"
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Validation Result */}
                      {validationResult && (
                        <div className="space-y-4">
                          {validationResult.valid ? (
                            <>
                              <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
                                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                <AlertDescription className="text-green-800 dark:text-green-200">
                                  Valid: {validationResult.entries} valid entries found
                                </AlertDescription>
                              </Alert>

                              {/* Preview Table */}
                              <div className="rounded-lg border">
                                <div className="bg-muted/50 p-3">
                                  <h4 className="text-sm font-semibold">Preview (First 5 rows)</h4>
                                </div>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>English</TableHead>
                                      <TableHead>Arabic</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {validationResult.preview?.map((row, idx) => (
                                      <TableRow key={idx}>
                                        <TableCell>{row.english}</TableCell>
                                        <TableCell dir="rtl">{row.arabic}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>

                              {/* Upload Button */}
                              {!isUploading ? (
                                <Button
                                  onClick={() => setShowUploadConfirm(true)}
                                  className="w-full bg-[#f97316] transition-all hover:bg-[#ea580c]"
                                >
                                  Upload & Rebuild Index
                                </Button>
                              ) : (
                                <div className="space-y-2">
                                  <Progress value={uploadProgress} className="h-2" />
                                  <p className="text-center text-sm text-muted-foreground">
                                    Uploading... {uploadProgress}%
                                  </p>
                                </div>
                              )}
                            </>
                          ) : (
                            <Alert variant="destructive">
                              <XCircle className="h-4 w-4" />
                              <AlertDescription>{validationResult.error}</AlertDescription>
                            </Alert>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Section 3: Update History */}
                  <Card className="border-[#f97316]/20">
                    <div className="p-6">
                      <h3 className="mb-4 text-lg font-semibold text-[#f97316]">Recent Updates</h3>
                      <div className="rounded-lg border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Entries</TableHead>
                              <TableHead>Updated By</TableHead>
                              <TableHead>Action</TableHead>
                              <TableHead className="text-right">Rollback</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {updateHistory.map((update) => (
                              <TableRow key={update.id}>
                                <TableCell className="font-medium">{update.date}</TableCell>
                                <TableCell>{update.entries}</TableCell>
                                <TableCell>{update.updatedBy}</TableCell>
                                <TableCell>
                                  <Badge variant="secondary">{update.action}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    onClick={() => {
                                      setSelectedRollbackId(update.id)
                                      setShowRollbackConfirm(true)
                                    }}
                                    variant="ghost"
                                    size="sm"
                                    className="text-[#f97316] transition-all hover:bg-[#f97316]/10 hover:text-[#f97316]"
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </main>

      <footer className="border-t border-border bg-card py-4 sm:py-6">
        <div className="container mx-auto px-3 sm:px-4">
          <p className="text-center text-xs text-muted-foreground sm:text-sm">
            Powered by OpenAI GPT-4o-mini • Built with <Heart className="inline h-3 w-3 text-red-500 sm:h-4 sm:w-4" />{" "}
            for Food Safety
          </p>
        </div>
      </footer>

      <Dialog open={showCostBreakdown} onOpenChange={setShowCostBreakdown}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cost Breakdown</DialogTitle>
            <DialogDescription>Detailed breakdown of API usage and costs</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <span className="text-sm font-medium">Total API Calls:</span>
              <span className="text-sm font-bold">{costTracker.totalCalls.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <span className="text-sm font-medium">Embedding Tokens:</span>
              <span className="text-sm font-bold">{costTracker.embeddingTokens.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <span className="text-sm font-medium">Completion Tokens:</span>
              <span className="text-sm font-bold">{costTracker.completionTokens.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-[#14b8a6]/10 p-3">
              <span className="text-sm font-semibold">Session Cost:</span>
              <span className="text-lg font-bold text-[#14b8a6]">${costTracker.sessionCost.toFixed(4)}</span>
            </div>
            <div className="text-xs text-muted-foreground text-center">
              Pricing: $0.020/1M embedding tokens • $0.150/1M completion tokens
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowCostBreakdown(false)} className="w-full">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showUploadConfirm} onOpenChange={setShowUploadConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Glossary Upload</DialogTitle>
            <DialogDescription>
              This will replace the current glossary with the new file. All existing entries will be overwritten. This
              action cannot be undone without a rollback.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={handleUploadGlossary} className="bg-[#f97316] transition-all hover:bg-[#ea580c]">
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRollbackConfirm} onOpenChange={setShowRollbackConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Rollback</DialogTitle>
            <DialogDescription>
              Are you sure you want to rollback to this version? The current glossary will be replaced with the selected
              version.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRollbackConfirm(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedRollbackId && handleRollback(selectedRollbackId)}
              className="bg-[#f97316] transition-all hover:bg-[#ea580c]"
            >
              Rollback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showUsageDetails} onOpenChange={setShowUsageDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detailed Usage Statistics</DialogTitle>
            <DialogDescription>
              Comprehensive breakdown of API usage, costs, and recent activity
            </DialogDescription>
          </DialogHeader>
          
          {usageStats && (
            <div className="space-y-6 py-4">
              {/* Overview Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-[#f97316]">{usageStats.total_requests}</div>
                  <div className="text-sm text-muted-foreground">Total Requests</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-[#f97316]">{usageStats.total_tokens.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Total Tokens</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-[#f97316]">${usageStats.total_cost.toFixed(4)}</div>
                  <div className="text-sm text-muted-foreground">Total Cost</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-[#f97316]">${usageStats.current_session.total_cost.toFixed(4)}</div>
                  <div className="text-sm text-muted-foreground">Session Cost</div>
                </div>
              </div>

              {/* Endpoint Breakdown */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Endpoint Breakdown</h4>
                <div className="space-y-2">
                  {Object.entries(usageStats.endpoint_breakdown).map(([endpoint, stats]: [string, any]) => (
                    <div key={endpoint} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <div className="font-medium">{endpoint}</div>
                        <div className="text-sm text-muted-foreground">
                          {stats.requests} requests • {stats.tokens.toLocaleString()} tokens
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">${stats.cost.toFixed(4)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Recent Activity</h4>
                <div className="max-h-60 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Endpoint</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Tokens</TableHead>
                        <TableHead>Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usageStats.recent_logs.slice().reverse().map((log: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="text-xs">
                            {new Date(log.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-xs">{log.endpoint}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {log.request_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">{log.tokens_used.toLocaleString()}</TableCell>
                          <TableCell className="text-xs">${log.cost.toFixed(6)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setShowUsageDetails(false)} className="w-full">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  )
}
