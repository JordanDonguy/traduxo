import { ReactNode } from "react";
import { AppProviderBase } from "@traduxo/packages/contexts/AppContext";
// For RN: add e.g. react-native-toast, styled-components, etc.

export default function AppProvider({ children }: { children: ReactNode }) {
  return (
    <AppProviderBase>
      {children}
      {/* Replace ToastContainer with RN toast solution */}
    </AppProviderBase>
  );
}
