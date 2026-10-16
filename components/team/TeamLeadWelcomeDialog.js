"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/store";
import {
  isTeamLeadAssignedNotice,
  isTeamLeadWelcomeSeen,
  markTeamLeadWelcomeSeen,
  TEAM_LEAD_PROFILE_HREF,
  teamNameFromLeadNotice,
} from "@/lib/teamLeadNotice";

export default function TeamLeadWelcomeDialog() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [note, setNote] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setNote(null);
      return undefined;
    }
    return api.notifications.subscribe((list) => {
      const hit = (list || []).find(
        (row) => isTeamLeadAssignedNotice(row) && !isTeamLeadWelcomeSeen(row)
      );
      setNote(hit || null);
    });
  }, [isAuthenticated, user?.id]);

  if (!mounted || !note || typeof document === "undefined") return null;

  const teamName = teamNameFromLeadNotice(note);

  const dismiss = () => {
    markTeamLeadWelcomeSeen(note);
    setNote(null);
  };

  const seeDetails = () => {
    markTeamLeadWelcomeSeen(note);
    setNote(null);
    router.push(TEAM_LEAD_PROFILE_HREF);
  };

  return createPortal(
    <div className="team-lead-welcome-backdrop" role="presentation" onClick={dismiss}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="team-lead-welcome-title"
        className="team-lead-welcome-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="team-lead-welcome-burst" aria-hidden>
          <span className="team-lead-spark spark-1" />
          <span className="team-lead-spark spark-2" />
          <span className="team-lead-spark spark-3" />
          <span className="team-lead-spark spark-4" />
          <span className="team-lead-spark spark-5" />
          <span className="team-lead-spark spark-6" />
          <div className="team-lead-welcome-badge">
            <span className="team-lead-welcome-crown">★</span>
            <span className="team-lead-welcome-mark">TL</span>
          </div>
        </div>

        <p className="team-lead-welcome-kicker">Congratulations</p>
        <h2 id="team-lead-welcome-title" className="team-lead-welcome-title">
          You&apos;re now Team Lead
        </h2>
        <p className="team-lead-welcome-team" data-no-translate>
          {teamName}
        </p>
        <p className="team-lead-welcome-body">
          Open your Rider Team card to share the invite code and approve riders who want to join.
        </p>

        <div className="team-lead-welcome-actions">
          <button type="button" className="team-lead-welcome-primary" onClick={seeDetails}>
            See details
          </button>
          <button type="button" className="team-lead-welcome-secondary" onClick={dismiss}>
            Later
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
