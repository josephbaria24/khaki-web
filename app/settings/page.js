"use client";

import AppShell from "@/components/AppShell";
import Container from "@/components/Container";
import ThemeToggle from "@/components/ThemeToggle";

export default function SettingsPage() {
  return (
    <AppShell>
      <Container className="py-6 lg:py-10">
        <h1 className="page-title">Settings</h1>
        <p className="page-sub max-w-2xl">Appearance and account preferences.</p>

        <section className="soft-card mt-8 max-w-xl p-5">
          <h2 className="text-sm font-bold text-foreground">Appearance</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose light, dark, or follow your device setting.
          </p>
          <ThemeToggle className="mt-4" />
        </section>
      </Container>
    </AppShell>
  );
}
