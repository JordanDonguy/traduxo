import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import AppText from "../AppText";
import { Lock } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { useChangePassword } from "@traduxo/packages/hooks/auth/useChangePassword";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "@react-navigation/native";

type ChangePasswordProps = {
  isCredentials: boolean | undefined;
};

export default function ChangePassword({ isCredentials }: ChangePasswordProps) {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const { isLoading, error, handleSubmit } = useChangePassword({
    isCredentials,
    onSuccess: (msg) => {
      Toast.show({ type: "success", text1: msg });
      navigation.navigate("Home" as never);
    },
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const onSubmit = () => {
    handleSubmit({ currentPassword, password, confirmPassword });
  };

  return (
    <KeyboardAwareScrollView
      showsVerticalScrollIndicator={false}
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 100 }}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid={true}
      extraScrollHeight={20}
    >

      {isLoading && (
        <View className="absolute inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      <View className={`${isLoading ? "opacity-60" : "opacity-100"} flex-col gap-2`}>

        {error && <Text className="text-red-500 text-center text-lg">{error}</Text>}

        {isCredentials && (
          <View className="py-2 rounded-xl mb-6">
            <View className="flex-row items-center mb-2">
              <Lock size={28} color={colors.text} />
              <AppText className="ml-2 text-xl">Current password</AppText>
            </View>
            <TextInput
              placeholder="********"
              placeholderTextColor="#aaa"
              secureTextEntry
              className="border border-zinc-400 p-4 rounded-md text-lg text-black dark:text-white"
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
          </View>
        )}

        <View className="py-2 rounded-xl mb-6">
          <View className="flex-row items-center mb-2">
            <Lock size={28} color={colors.text} />
            <AppText className="ml-2 text-xl">{isCredentials ? "New password" : "Password"}</AppText>
          </View>
          <TextInput
            placeholder="********"
            placeholderTextColor="#aaa"
            secureTextEntry
            className="border border-zinc-400 p-4 rounded-md text-lg text-black dark:text-white"
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <View className="py-2 rounded-xl mb-6">
          <View className="flex-row items-center gap-2 mb-2">
            <Lock size={28} color={colors.text} />
            <AppText className="ml-2 text-xl">Confirm password</AppText>
          </View>
          <TextInput
            placeholder="********"
            placeholderTextColor="#aaa"
            secureTextEntry
            className="border border-zinc-400 p-4 rounded-md text-lg text-black dark:text-white"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>

        <TouchableOpacity
          disabled={isLoading}
          onPress={onSubmit}
          className="bg-gray-200 dark:bg-zinc-800 rounded-full h-16 flex items-center justify-center mt-4 mb-6"
        >
          <AppText className="text-lg">
            {isCredentials ? "Change password" : "Create password"}
          </AppText>
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  );
}
