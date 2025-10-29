import { useEffect, useRef } from "react";
import { TouchableOpacity } from "react-native";
import { Mic, CircleStop } from "lucide-react-native";
import useVoiceRecorder from "@/hooks/useVoiceRecorder";
import { useTheme } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import StopIcon from "./StopIcon";

export default function VoiceInputButton({ handleTranslate }: { handleTranslate: (audioBase64?: string) => Promise<void> }) {
  const {
    isRecording,
    error,
    startRecording,
    stopRecording,
    cancelRecording
  } = useVoiceRecorder();

  const { colors } = useTheme();

  // Ref to manage auto-stop timeout
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Start/stop recording handler
  const handleRecording = async () => {
    // If it is recording -> stop recording and send audio to Gemini
    if (isRecording) {
      // Stop timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      // Stop recording and send audio to Gemini
      const audioBase64 = await stopRecording();
      handleTranslate(audioBase64 || undefined);

    } else {
      // Start recording
      await startRecording();

      // Auto-stop after 10s
      timeoutRef.current = setTimeout(async () => {
        const audioBase64 = await stopRecording();
        Toast.show({ type: "info", text1: "Voice recordings are 10 seconds max", text1Style: { fontSize: 14 } });
        handleTranslate(audioBase64 || undefined);
      }, 10000);
    }
  };

  // Cleanup and cancel voice recognition if component unmounts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      cancelRecording();
    };
  }, []);

  // Show a toast error if there's an error
  useEffect(() => {
    if (error) {
      Toast.show({ type: "error", text1: error, text1Style: { fontSize: 14 } })
    }
  }, [error]);


  return (
    <TouchableOpacity
      onPress={handleRecording}
      accessibilityLabel={isRecording ? "Stop voice input" : "Start voice input"}
      activeOpacity={0.7}
      className="w-12 h-full pr-2 rounded-full flex justify-center items-center active:opacity-70"
    >
      {!isRecording ? (
        <Mic size={28} color={colors.text} />
      ) : (
        <StopIcon />
      )}
    </TouchableOpacity>
  )
}
