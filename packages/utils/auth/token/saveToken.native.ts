import AsyncStorage from "@react-native-async-storage/async-storage";

export async function saveToken(accessToken: string, refreshToken: string) {
  await AsyncStorage.setItem("accessToken", accessToken);
  await AsyncStorage.setItem("refreshToken", refreshToken);
}
