/* istanbul ignore file */
export const API_BASE_URL: string =
  process.env.PLATFORM === "react-native"
    ? process.env.API_BASE_URL ?? ""      // RN env (set via react-native-config or similar)
    : process.env.NEXT_PUBLIC_API_BASE_URL ?? ""; // Next.js public env
