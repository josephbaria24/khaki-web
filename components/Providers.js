"use client";

import { AuthProvider } from "@/lib/AuthContext";
import { AdminNavProvider } from "@/lib/AdminNavContext";
import { AdminPreviewProvider } from "@/lib/AdminPreviewContext";
import AppFrame from "@/components/AppFrame";
import LanguageProvider from "@/components/LanguageProvider";
import ThemeProvider from "@/components/ThemeProvider";
import ToastProvider from "@/components/ToastProvider";
import "@/lib/installApp";

export default function Providers({ children }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <AdminPreviewProvider>
            <AdminNavProvider>
              <ToastProvider>
                <AppFrame>{children}</AppFrame>
              </ToastProvider>
            </AdminNavProvider>
          </AdminPreviewProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
