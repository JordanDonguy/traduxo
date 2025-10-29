import { useState, useEffect, useCallback, useRef } from "react";
import {
  useAudioRecorder,
  useAudioRecorderState,
  AudioModule,
  setAudioModeAsync,
} from "expo-audio";
import * as FileSystem from "expo-file-system/legacy";
import { Alert } from "react-native";

const voiceRecordingOptions = {
  extension: ".m4a",
  sampleRate: 16000,
  numberOfChannels: 1,
  bitRate: 64000,
  isMeteringEnabled: false,
  android: {
    extension: ".m4a",
    outputFormat: "mpeg4" as const,
    audioEncoder: "aac" as const,
    sampleRate: 16000,
  },
  ios: {
    extension: ".m4a",
    audioQuality: 10,
    sampleRate: 16000,
    bitRate: 64000,
    numberOfChannels: 1,
  },
};


export default function useVoiceRecorder() {
  // Create audio recorder instance with specified options
  const audioRecorder = useAudioRecorder(voiceRecordingOptions);
  const recorderState = useAudioRecorderState(audioRecorder);
  const [error, setError] = useState<string | null>(null);
  const recordingTimeout = useRef<NodeJS.Timeout | null>(null);


  // --------------------------------------------------------------------
  // Request microphone permission and configure audio playback/recording
  // --------------------------------------------------------------------
  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert("Permission to access microphone was denied");
        return;
      }

      // Allow recording even in silent mode
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
    })();
  }, []);


  // ---------------------------------------
  // -------- Start recording audio --------
  // ---------------------------------------
  const startRecording = useCallback(async () => {
    try {
      setError(null); // reset any previous error
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch (err) {
      console.error("Error starting recording:", err);
      setError("Failed to start recording");
    }
  }, [audioRecorder, recorderState.isRecording]);


  // ---------------------------------------------
  // Stop recording and return Base64 audio string
  // ---------------------------------------------
  const stopRecording = useCallback(async (): Promise<string | null> => {
    try {
      // Clear any pending auto-stop timeout
      if (recordingTimeout.current) {
        clearTimeout(recordingTimeout.current);
        recordingTimeout.current = null;
      }

      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      if (!uri) return null;

      // Read audio file and convert to Base64
      let audioBase64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      // Clean up data URI prefix and whitespace
      audioBase64 = audioBase64
        .replace(/^data:audio\/[a-z]+;base64,/, "")
        .replace(/\s/g, "");

      return audioBase64;
    } catch (err) {
      console.error("Error stopping recording:", err);
      setError("Failed to stop recording");
      return null;
    }
  }, [audioRecorder]);


  // -------------------------------------
  // Cancel recording without saving audio
  // -------------------------------------
  const cancelRecording = useCallback(async () => {
    try {
      // Clear timeout if any
      if (recordingTimeout.current) {
        clearTimeout(recordingTimeout.current);
        recordingTimeout.current = null;
      }
      // Stop recorder if still recording
      if (recorderState.isRecording) {
        await audioRecorder.stop();
      }
    } catch (err) {
      console.warn("Error canceling recording:", err);
    }
  }, [audioRecorder, recorderState.isRecording]);

  return {
    isRecording: recorderState.isRecording,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}

