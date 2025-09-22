import AsyncStorage from "@react-native-async-storage/async-storage";

export async function clearToken() {
  await AsyncStorage.removeItem("accessToken");
  await AsyncStorage.removeItem("refreshToken");
}
