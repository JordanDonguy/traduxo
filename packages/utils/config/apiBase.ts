/* istanbul ignore file */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_PLATFORM === "react-native"
    ? process.env.EXPO_PUBLIC_API_BASE_URL ?? ""
    : process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
