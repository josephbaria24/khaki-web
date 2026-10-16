"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

const AdminNavContext = createContext({
  open: false,
  config: null,
  openMenu: () => {},
  closeMenu: () => {},
  setOpen: () => {},
  register: () => {},
  unregister: () => {},
});

export function AdminNavProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState(null);

  const openMenu = useCallback(() => setOpen(true), []);
  const closeMenu = useCallback(() => setOpen(false), []);

  const register = useCallback((next) => {
    setConfig((prev) => ({ ...(prev || {}), ...next }));
  }, []);

  const unregister = useCallback(() => {
    setOpen(false);
    setConfig(null);
  }, []);

  const value = useMemo(
    () => ({ open, config, openMenu, closeMenu, setOpen, register, unregister }),
    [open, config, openMenu, closeMenu, register, unregister]
  );

  return <AdminNavContext.Provider value={value}>{children}</AdminNavContext.Provider>;
}

export function useAdminNav() {
  return useContext(AdminNavContext);
}
