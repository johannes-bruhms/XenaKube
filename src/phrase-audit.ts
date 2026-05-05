import type { PhrasePlan } from './phrase-plan.js';

export type PhraseEchoKind = 'noteon' | 'noteoff' | 'bendstep' | 'expr' | 'panic';
export type PhraseAuditReason = 'complete' | 'stolen' | 'timeout' | 'first-note-timeout' | 'panic';
export type PhraseAuditStatus = 'ok' | 'fail' | 'stolen';

export interface PhraseEchoEvent {
  kind: PhraseEchoKind;
  planId?: number | null;
  tMs?: number;
  isCompanion?: boolean;
}

export interface PhraseAuditCounts {
  noteOnCount: number;
  noteOffCount: number;
  bendStepCount: number;
  companionNoteOnCount: number;
  exprCount: number;
}

export interface PhraseAuditResult {
  planId: number;
  complex: number;
  face: string;
  status: PhraseAuditStatus;
  reason: PhraseAuditReason;
  elapsedMs: number;
  firstNoteOnMs: number | null;
  expectedFirstNoteOnMs: number | null;
  expected: PhraseAuditCounts;
  actual: PhraseAuditCounts;
  failures: string[];
  warnings: string[];
  summary: string;
}

export interface PhraseEchoAuditorOptions {
  now?: () => number;
  firstNoteFailMs?: number;
  completionGraceMs?: number;
  keepClosedMs?: number;
  strictCounts?: boolean;
}

interface AuditRecord {
  plan: PhrasePlan;
  openedAt: number;
  expectedEndMs: number;
  expected: PhraseAuditCounts;
  actual: PhraseAuditCounts;
  firstNoteOnMs: number | null;
  firstNoteFailureReported: boolean;
  closedAt: number | null;
}

const DEFAULT_FIRST_NOTE_FAIL_MS = 250;
const DEFAULT_COMPLETION_GRACE_MS = 750;
const DEFAULT_KEEP_CLOSED_MS = 2000;

export class PhraseEchoAuditor {
  private now: () => number;
  private firstNoteFailMs: number;
  private completionGraceMs: number;
  private keepClosedMs: number;
  private strictCounts: boolean;
  private pending = new Map<number, AuditRecord>();
  private recentlyClosed = new Map<number, number>();

  constructor(options: PhraseEchoAuditorOptions = {}) {
    this.now = options.now ?? Date.now;
    this.firstNoteFailMs = options.firstNoteFailMs ?? DEFAULT_FIRST_NOTE_FAIL_MS;
    this.completionGraceMs = options.completionGraceMs ?? DEFAULT_COMPLETION_GRACE_MS;
    this.keepClosedMs = options.keepClosedMs ?? DEFAULT_KEEP_CLOSED_MS;
    this.strictCounts = options.strictCounts ?? false;
  }

  reset(reason: PhraseAuditReason = 'panic'): PhraseAuditResult[] {
    const results = this.closeAll(reason);
    this.pending.clear();
    this.recentlyClosed.clear();
    return results;
  }

  startTurn(plans: PhrasePlan[]): PhraseAuditResult[] {
    const results = this.poll(this.now());
    results.push(...this.closeAll('stolen'));
    for (const plan of plans) this.register(plan);
    return results;
  }

  register(plan: PhrasePlan): void {
    this.pending.set(plan.id, {
      plan,
      openedAt: plan.createdAt,
      expectedEndMs: expectedEndMs(plan),
      expected: {
        noteOnCount: plan.expected.noteOnCount,
        noteOffCount: plan.expected.noteOffCount,
        bendStepCount: plan.expected.bendStepCount,
        companionNoteOnCount: plan.expected.companionNoteOnCount,
        exprCount: 0,
      },
      actual: {
        noteOnCount: 0,
        noteOffCount: 0,
        bendStepCount: 0,
        companionNoteOnCount: 0,
        exprCount: 0,
      },
      firstNoteOnMs: null,
      firstNoteFailureReported: false,
      closedAt: null,
    });
  }

  recordEcho(event: PhraseEchoEvent): PhraseAuditResult[] {
    const planId = event.planId ?? 0;
    if (planId <= 0) return [];
    const record = this.pending.get(planId);
    if (!record) return [];
    const eventNow = event.tMs ?? this.now();

    if (event.kind === 'noteon') {
      record.actual.noteOnCount++;
      if (event.isCompanion === true) {
        record.actual.companionNoteOnCount++;
      } else if (record.firstNoteOnMs == null) {
        record.firstNoteOnMs = Math.max(0, Math.round(eventNow - record.openedAt));
        const expectedFirst = record.plan.expected.firstNoteOnMs;
        if (
          expectedFirst != null &&
          record.firstNoteOnMs > expectedFirst + this.firstNoteFailMs
        ) {
          return [this.close(planId, 'first-note-timeout', eventNow)];
        }
      }
    } else if (event.kind === 'noteoff') {
      record.actual.noteOffCount++;
    } else if (event.kind === 'bendstep') {
      record.actual.bendStepCount++;
    } else if (event.kind === 'expr') {
      record.actual.exprCount++;
    } else if (event.kind === 'panic') {
      return this.reset('panic');
    }

    return this.poll(eventNow);
  }

  poll(now = this.now()): PhraseAuditResult[] {
    this.pruneClosed(now);
    const results: PhraseAuditResult[] = [];
    for (const record of Array.from(this.pending.values())) {
      const firstDeadline = record.openedAt +
        (record.plan.expected.firstNoteOnMs ?? 0) +
        this.firstNoteFailMs;
      if (
        !record.firstNoteFailureReported &&
        record.expected.noteOnCount > 0 &&
        record.firstNoteOnMs == null &&
        now >= firstDeadline
      ) {
        record.firstNoteFailureReported = true;
        results.push(this.close(record.plan.id, 'first-note-timeout', now));
        continue;
      }

      const completionDeadline = record.openedAt + record.expectedEndMs + this.completionGraceMs;
      if (now >= completionDeadline) {
        results.push(this.close(record.plan.id, 'complete', now));
      }
    }
    return results.filter(Boolean);
  }

  pendingCount(): number {
    return this.pending.size;
  }

  private closeAll(reason: PhraseAuditReason): PhraseAuditResult[] {
    const now = this.now();
    const results: PhraseAuditResult[] = [];
    for (const id of Array.from(this.pending.keys())) {
      results.push(this.close(id, reason, now));
    }
    return results;
  }

  private close(planId: number, reason: PhraseAuditReason, now = this.now()): PhraseAuditResult {
    const record = this.pending.get(planId);
    if (!record) throw new Error(`Phrase audit record ${planId} is not pending`);
    this.pending.delete(planId);
    record.closedAt = now;
    this.recentlyClosed.set(planId, now);
    return this.resultFor(record, reason, now);
  }

  private resultFor(record: AuditRecord, reason: PhraseAuditReason, now: number): PhraseAuditResult {
    const failures: string[] = [];
    const warnings: string[] = [];
    const expectedFirst = record.plan.expected.firstNoteOnMs;
    const isPanic = reason === 'panic';

    if (!isPanic && record.expected.noteOnCount > 0 && record.firstNoteOnMs == null) {
      failures.push(`missing first noteon`);
    } else if (
      !isPanic &&
      record.firstNoteOnMs != null &&
      expectedFirst != null &&
      record.firstNoteOnMs > expectedFirst + this.firstNoteFailMs
    ) {
      failures.push(`first noteon late actual=${record.firstNoteOnMs}ms expected=${expectedFirst}ms`);
    }

    if (reason !== 'stolen' && !isPanic && this.strictCounts) {
      if (record.actual.noteOnCount < record.expected.noteOnCount) {
        failures.push(`noteon count ${record.actual.noteOnCount}/${record.expected.noteOnCount}`);
      }
      if (record.actual.bendStepCount < record.expected.bendStepCount) {
        failures.push(`bendstep count ${record.actual.bendStepCount}/${record.expected.bendStepCount}`);
      }
      if (record.actual.companionNoteOnCount < record.expected.companionNoteOnCount) {
        failures.push(`companion count ${record.actual.companionNoteOnCount}/${record.expected.companionNoteOnCount}`);
      }
    }

    if (reason !== 'stolen' && !isPanic && !this.strictCounts) {
      if (record.expected.bendStepCount > 0 && record.actual.bendStepCount === 0) {
        failures.push(`missing all planned bendsteps`);
      }
      if (record.expected.companionNoteOnCount === 0 && record.actual.companionNoteOnCount > 0) {
        failures.push(`unexpected companion count ${record.actual.companionNoteOnCount}`);
      }
      if (record.actual.noteOnCount < record.expected.noteOnCount) {
        warnings.push(`shadow noteon drift ${record.actual.noteOnCount}/${record.expected.noteOnCount}`);
      }
      if (record.actual.bendStepCount < record.expected.bendStepCount) {
        warnings.push(`shadow bendstep drift ${record.actual.bendStepCount}/${record.expected.bendStepCount}`);
      }
      if (record.actual.companionNoteOnCount < record.expected.companionNoteOnCount) {
        warnings.push(`shadow companion drift ${record.actual.companionNoteOnCount}/${record.expected.companionNoteOnCount}`);
      }
    }

    if (record.actual.noteOnCount > record.expected.noteOnCount) {
      warnings.push(`extra noteons ${record.actual.noteOnCount}/${record.expected.noteOnCount}`);
    }
    if (record.actual.bendStepCount > record.expected.bendStepCount) {
      warnings.push(`extra bendsteps ${record.actual.bendStepCount}/${record.expected.bendStepCount}`);
    }
    if (record.actual.companionNoteOnCount > record.expected.companionNoteOnCount) {
      warnings.push(`extra companions ${record.actual.companionNoteOnCount}/${record.expected.companionNoteOnCount}`);
    }

    const status: PhraseAuditStatus =
      failures.length > 0 ? 'fail' : reason === 'stolen' || isPanic ? 'stolen' : 'ok';
    const elapsedMs = Math.max(0, Math.round(now - record.openedAt));
    const result: PhraseAuditResult = {
      planId: record.plan.id,
      complex: record.plan.complex,
      face: record.plan.face ?? '-',
      status,
      reason,
      elapsedMs,
      firstNoteOnMs: record.firstNoteOnMs,
      expectedFirstNoteOnMs: expectedFirst,
      expected: { ...record.expected },
      actual: { ...record.actual },
      failures,
      warnings,
      summary: '',
    };
    result.summary = phraseAuditSummary(result);
    return result;
  }

  private pruneClosed(now: number): void {
    for (const [planId, closedAt] of Array.from(this.recentlyClosed.entries())) {
      if (now - closedAt > this.keepClosedMs) this.recentlyClosed.delete(planId);
    }
  }
}

export function phraseAuditSummary(result: PhraseAuditResult): string {
  const first = result.firstNoteOnMs == null ? '-' : `${result.firstNoteOnMs}ms`;
  const expectedFirst = result.expectedFirstNoteOnMs == null ? '-' : `${result.expectedFirstNoteOnMs}ms`;
  const counts =
    `noteons=${result.actual.noteOnCount}/${result.expected.noteOnCount} ` +
    `bends=${result.actual.bendStepCount}/${result.expected.bendStepCount} ` +
    `companions=${result.actual.companionNoteOnCount}/${result.expected.companionNoteOnCount}`;
  const issue = result.failures.length > 0
    ? ` fail=${result.failures.join('; ')}`
    : result.warnings.length > 0
      ? ` warn=${result.warnings.join('; ')}`
      : '';
  return `P${result.planId} C${result.complex} ${result.status.toUpperCase()} reason=${result.reason} first=${first}/${expectedFirst} ${counts}${issue}`;
}

function expectedEndMs(plan: PhrasePlan): number {
  return plan.events.reduce((max, event) => Math.max(max, event.tMs), plan.expected.releaseMs);
}
