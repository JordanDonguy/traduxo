import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import AppText from "../AppText";
import { Lock, Mail } from "lucide-react-native";
import { useAuthHandlers } from "@traduxo/packages/hooks/auth/useAuthHandlers";
import { useAuth } from "@traduxo/packages/contexts/AuthContext";
import { useApp } from "@traduxo/packages/contexts/AppContext";
import { useTheme } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import LoadingSpinner from "./LoadingSpinner";

interface LoginProps {
  currentSubmenu: string;
  setCurrentSubmenu: React.Dispatch<React.SetStateAction<string | null>>
}

export default function Login({ currentSubmenu, setCurrentSubmenu }: LoginProps) {
  const { colors } = useTheme();
  const { setShowMenu } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { handleLogin, handleSignup, handleForgotPassword } = useAuthHandlers();
  const { refresh } = useAuth();

  const onSubmit = async () => {
    setError("");
    if (currentSubmenu === "Signup") {
      const success = await handleSignup(email, password, confirmPassword, setIsLoading, setError, refresh);
      if (success) {
        Toast.show({ type: "success", text1: "Successfully signed up! You can now login 🙂", text1Style: ({ fontSize: 14 }) })
        setCurrentSubmenu("Login");
      }
    } else {
      const success = await handleLogin(email, password, setError, setIsLoading, refresh);
      if (success) {
        setShowMenu(false);
        Toast.show({ type: "success", text1: "Successfully logged in! Welcome back 🙂", text1Style: ({ fontSize: 14 }) })
        refresh() // Refresh auth context
      };
    }
  };

  if (isLoading) return <LoadingSpinner paddingBottom="20" />

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 100 }}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid={true}
      extraScrollHeight={20}
    >

      {error ? <Text className="text-red-500 text-center mb-6">{error}</Text> : null}

      {/* Email Input */}
      <View className="py-2 rounded-xl mb-6">
        <View className="flex-row items-center mb-2">
          <Mail size={28} color={colors.text} />
          <AppText className="ml-2 text-xl">Email</AppText>
        </View>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor="#888"
          keyboardType="email-address"
          autoCapitalize="none"
          className="border border-zinc-400 p-4 rounded-md text-lg text-black dark:text-white"
        />
      </View>

      {/* Password Input */}
      <View className="py-2 rounded-xl mb-6">
        <View className="flex-row items-center mb-2">
          <Lock size={28} color={colors.text} />
          <AppText className="ml-2 text-xl">Password</AppText>
        </View>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="********"
          placeholderTextColor="#888"
          secureTextEntry
          className="border border-zinc-400 p-4 rounded-md text-lg text-black dark:text-white"
        />
      </View>

      {/* Confirm Password (signup only) */}
      {(currentSubmenu === "Signup") && (
        <View className="py-2 rounded-xl mb-6">
          <View className="flex-row items-center mb-2">
            <Lock size={28} color={colors.text} />
            <AppText className="ml-2 text-xl">Confirm Password</AppText>
          </View>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="********"
            placeholderTextColor="#888"
            secureTextEntry
            className="border border-zinc-400 p-4 rounded-md text-lg text-black dark:text-white"
          />
        </View>
      )}

      {/* Submit Button */}
      <TouchableOpacity className="bg-gray-200 dark:bg-zinc-800 rounded-full h-16 flex items-center justify-center mt-4 mb-6" onPress={onSubmit}>
        <AppText className="text-lg">{(currentSubmenu === "Signup") ? "Sign Up" : "Sign In"}</AppText>
      </TouchableOpacity>

      {/* Google OAuth Button */}
      {/* /!\ TO BE IMPLEMENTED -> google login */}
      <TouchableOpacity className="flex-row items-center justify-center bg-gray-200 dark:bg-zinc-800 h-16 rounded-full mb-6">
        <Image source={require("@/assets/images/google-logo.webp")} className="w-10 h-10 mr-4" />
        <AppText className="text-lg">Continue with Google</AppText>
      </TouchableOpacity>

      {/* Forgot Password */}
      {(currentSubmenu === "Login") && (
        <TouchableOpacity onPress={() => handleForgotPassword(email, setError, setIsLoading)}>
          <Text className="text-blue-500 text-center mb-6 underline text-lg">Forgot your password?</Text>
        </TouchableOpacity>
      )}

      {/* Switch Login/Signup */}
      <AppText className="text-center text-lg pb-6">
        {(currentSubmenu === "Signup") ? "Already have an account? " : "No account? "}
        <Text
          className="text-blue-500 underline"
          onPress={() =>
            setCurrentSubmenu(prev => (prev === "Signup" ? "Login" : "Signup"))
          }
        >
          {currentSubmenu === "Login" ? "Sign Up" : "Login"}
        </Text>

      </AppText>
    </KeyboardAwareScrollView>
  );
}
