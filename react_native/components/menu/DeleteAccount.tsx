import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import AppText from "../AppText";
import { useDeleteAccount } from "@traduxo/packages/hooks/auth/useDeleteAccount";
import { useApp } from "@traduxo/packages/contexts/AppContext";
import { useAuth } from "@traduxo/packages/contexts/AuthContext";
import Toast from "react-native-toast-message";
import LoadingSpinner from "./LoadingSpinner";

export default function DeleteAccount() {
  const { setShowMenu, setCurrentSubmenu } = useApp();
  const { refresh } = useAuth();

  const { deleteAccount, isLoading } = useDeleteAccount({
    onSuccess: () => {
      Toast.show({ type: "success", text1: "Your account has been deleted" });
      setShowMenu(false);
      refresh();
    },
    onError: (msg) => {
      Toast.show({ type: "error", text1: msg });
    },
  });

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      {isLoading && (
        <View className="absolute inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <LoadingSpinner />
        </View>
      )}

      <View className={`${isLoading ? "opacity-60" : "opacity-100"} flex-col gap-8 px-2 rounded-lg`}>
        <AppText className="text-xl text-center py-8">
          Are you sure you want to delete your account?
        </AppText>

        <View className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          <TouchableOpacity
            onPress={() => setCurrentSubmenu(null)}
            className="h-20 border dark:border-white rounded-full flex items-center justify-center mb-4"
          >
            <AppText className="text-center text-xl">Cancel</AppText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={deleteAccount}
            className="h-20 rounded-full bg-red-500 dark:bg-red-600 flex items-center justify-center"
          >
            <AppText className="text-center text-xl">Yes</AppText>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
