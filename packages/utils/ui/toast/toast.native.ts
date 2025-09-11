import Toast from "react-native-toast-message";

export const toast = {
  success: (msg: string) => Toast.show({ type: "success", text1: msg }),
  error: (msg: string) => Toast.show({ type: "error", text1: msg }),
};
