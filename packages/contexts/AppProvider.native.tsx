import { ReactNode } from "react";
import { AppProviderBase } from "@traduxo/packages/contexts/AppContext";
import Toast from "react-native-toast-message";

export default function AppProvider({ children }: { children: ReactNode }) {
  return (
    <AppProviderBase>
      {children}
      <Toast />
    </AppProviderBase>
  );
}
