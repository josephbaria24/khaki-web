"use client";

import { AuthProvider } from "@/lib/AuthContext";
import AppFrame from "@/components/AppFrame";
import ThemeProvider from "@/components/ThemeProvider";
import ToastProvider from "@/components/ToastProvider";

export default function Providers({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <AppFrame>{children}</AppFrame>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
