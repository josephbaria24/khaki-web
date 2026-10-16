// Shared by web/ and mobile/. Edit here, then copy this folder to mobile/lib/dict.
import { CORE } from "./core.js";
import { TASKS } from "./tasks.js";
import { SYSTEM } from "./system.js";
import { SERVICES } from "./services.js";
import { ACCOUNT } from "./account.js";
import { ADMIN } from "./admin.js";
import { LANDING } from "./landing.js";
import { LEGAL } from "./legal.js";
import { TEAMS, TEAM_PATTERNS } from "./teams.js";
import { PATTERNS as BASE_PATTERNS } from "./patterns.js";

export const PATTERNS = [...TEAM_PATTERNS, ...BASE_PATTERNS];

export const PHRASES = [...CORE, ...TASKS, ...SYSTEM, ...SERVICES, ...ACCOUNT, ...ADMIN, ...LANDING, ...LEGAL, ...TEAMS];
