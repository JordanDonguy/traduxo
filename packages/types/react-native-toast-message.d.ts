declare module "react-native-toast-message" {
  import { FunctionComponent } from "react";
  import { ViewProps } from "react-native";

  type ToastType = "success" | "error" | "info";

  export interface ToastConfig {
    type?: ToastType;
    text1?: string;
    text2?: string;
    position?: "top" | "bottom";
    visibilityTime?: number;
    autoHide?: boolean;
    onShow?: () => void;
    onHide?: () => void;
    onPress?: () => void;
  }

  interface ToastComponent extends FunctionComponent<ViewProps> {
    show: (config: ToastConfig) => void;
    hide: () => void;
  }

  const Toast: ToastComponent;

  export default Toast;
}
