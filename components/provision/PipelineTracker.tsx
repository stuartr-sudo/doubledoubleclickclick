'use client'

import type { PipelineStatus, LogEntry } from './ProvisionContext'
import type { PhaseResult } from './hooks/useProvision'

/* ═══════════════════════════════════════════════════════════
   PROPS
   ═══════════════════════════════════════════════════════════ */

interface PipelineTrackerProps {
  pipelineStatus: PipelineStatus | null
  logs: LogEntry[]
  provisionResult: {
    phase_results?: PhaseResult[]
    [key: string]: unknown
  } | null
}

/* ═══════════════════════════════════════════════════════════
   STATUS ICON HELPERS
   ═══════════════════════════════════════════════════════════ */

const phaseIcon: Record<string, string> = {
  success: '\u2713',   // green checkmark
  warning: '\u26A0',   // yellow warning
  error: '\u2717',     // red X
  skipped: '\u2014',   // gray dash
}

const pipelineStepIcon: Record<string, string> = {
  completed: '\u2713',
  running: '\u25CF',
  failed: '\u2717',
  skipped: '\u2014',
  pending: '\u25CB',
}

/* ═══════════════════════════════════════════════════════════
   INLINE STYLES (matching dc- admin UI patterns)
   ═══════════════════════════════════════════════════════════ */

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  card: {
    background: '#1a1a2e',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    overflow: 'hidden' as const,
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  cardHeaderTitle: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 600 as const,
    color: '#e0e0e0',
  },
  badge: {
    fontSize: '12px',
    background: 'rgba(255,255,255,0.08)',
    color: '#a0a0a0',
    padding: '2px 8px',
    borderRadius: '10px',
  },
  cardBody: {
    padding: '16px',
  },
  cardBodyFlush: {
    padding: 0,
  },

  // Progress bar
  progressBar: {
    height: '4px',
    background: 'rgba(255,255,255,0.06)',
    borderRadius: '2px',
    marginBottom: '12px',
    overflow: 'hidden' as const,
  },
  progressFill: {
    height: '100%',
    borderRadius: '2px',
    transition: 'width 0.3s ease',
  },
  progressRunning: { background: '#3b82f6' },
  progressCompleted: { background: '#22c55e' },
  progressFailed: { background: '#ef4444' },

  // Pipeline steps
  stageList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  stage: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#d0d0d0',
  },
  stageIcon: {
    width: '18px',
    textAlign: 'center' as const,
    flexShrink: 0,
  },
  stageDetail: {
    color: '#808080',
    fontSize: '12px',
  },
  spinnerInline: {
    display: 'inline-block',
    width: '14px',
    height: '14px',
    border: '2px solid rgba(59,130,246,0.3)',
    borderTopColor: '#3b82f6',
    borderRadius: '50%',
    animation: 'dc-spin 0.8s linear infinite',
  },

  // Phase results
  phaseRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    fontSize: '13px',
  },
  phaseIcon: {
    width: '20px',
    textAlign: 'center' as const,
    fontSize: '14px',
    flexShrink: 0,
  },
  phaseName: {
    flex: 1,
    color: '#d0d0d0',
  },
  phaseDuration: {
    color: '#707070',
    fontSize: '11px',
    minWidth: '50px',
    textAlign: 'right' as const,
  },
  phaseError: {
    color: '#f87171',
    fontSize: '12px',
    paddingLeft: '30px',
    paddingBottom: '6px',
  },

  // Status colors
  colorSuccess: { color: '#22c55e' },
  colorWarning: { color: '#eab308' },
  colorError: { color: '#ef4444' },
  colorSkipped: { color: '#6b7280' },

  // Log panel
  logScroll: {
    maxHeight: '260px',
    overflowY: 'auto' as const,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: '12px',
    lineHeight: '1.6',
  },
  logLine: {
    padding: '2px 16px',
    color: '#a0a0a0',
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
  },
  logError: {
    color: '#f87171',
  },
  logTimestamp: {
    color: '#555',
    marginRight: '8px',
    fontSize: '11px',
  },
  logEmpty: {
    padding: '16px',
    color: '#606060',
    fontStyle: 'italic' as const,
  },

  // Summary
  summary: {
    display: 'flex',
    gap: '16px',
    padding: '12px 16px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    fontSize: '13px',
  },
  summaryItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
} as const

/* ═══════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════ */

export function PipelineTracker({
  pipelineStatus,
  logs,
  provisionResult,
}: PipelineTrackerProps) {
  const phaseResults = provisionResult?.phase_results ?? []

  // Counts for summary
  const successCount = phaseResults.filter(
    (p) => p.status === 'success',
  ).length
  const warningCount = phaseResults.filter(
    (p) => p.status === 'warning',
  ).length
  const errorCount = phaseResults.filter(
    (p) => p.status === 'error',
  ).length
  const skippedCount = phaseResults.filter(
    (p) => p.status === 'skipped',
  ).length

  // Progress bar state
  const totalSteps = pipelineStatus?.total_steps ?? 0
  const completedSteps = pipelineStatus?.steps_completed?.length ?? 0
  const progressPct =
    totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0
  const pipelineState = pipelineStatus?.status ?? 'pending'
  const progressColor =
    pipelineState === 'failed'
      ? styles.progressFailed
      : pipelineState === 'completed'
        ? styles.progressCompleted
        : styles.progressRunning

  return (
    <div style={styles.wrapper}>
      {/* ── Phase Results (from provision response) ── */}
      {phaseResults.length > 0 && (
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardHeaderTitle}>Phase Results</h3>
            <span style={styles.badge}>{phaseResults.length} phases</span>
          </div>
          <div style={styles.cardBodyFlush}>
            {phaseResults.map((phase, i) => {
              const statusColor =
                phase.status === 'success'
                  ? styles.colorSuccess
                  : phase.status === 'warning'
                    ? styles.colorWarning
                    : phase.status === 'error'
                      ? styles.colorError
                      : styles.colorSkipped

              return (
                <div key={i}>
                  <div style={styles.phaseRow}>
                    <span style={{ ...styles.phaseIcon, ...statusColor }}>
                      {phaseIcon[phase.status] ?? '\u25CB'}
                    </span>
                    <span style={styles.phaseName}>
                      {formatPhaseName(phase.phase)}
                    </span>
                    <span style={styles.phaseDuration}>
                      {phase.duration_ms}ms
                    </span>
                  </div>
                  {phase.message && phase.status === 'error' && (
                    <div style={styles.phaseError}>{phase.message}</div>
                  )}
                  {phase.message && phase.status === 'warning' && (
                    <div style={{ ...styles.phaseError, color: '#eab308' }}>
                      {phase.message}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Summary row */}
            <div style={styles.summary}>
              <span style={{ ...styles.summaryItem, ...styles.colorSuccess }}>
                {'\u2713'} {successCount} success
              </span>
              {warningCount > 0 && (
                <span
                  style={{ ...styles.summaryItem, ...styles.colorWarning }}
                >
                  {'\u26A0'} {warningCount} warning
                </span>
              )}
              {errorCount > 0 && (
                <span style={{ ...styles.summaryItem, ...styles.colorError }}>
                  {'\u2717'} {errorCount} error
                </span>
              )}
              {skippedCount > 0 && (
                <span
                  style={{ ...styles.summaryItem, ...styles.colorSkipped }}
                >
                  {'\u2014'} {skippedCount} skipped
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Doubleclicker Pipeline Steps (live polling) ── */}
      {pipelineStatus && (
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardHeaderTitle}>Doubleclicker Steps</h3>
            <span style={styles.badge}>
              {completedSteps}/{totalSteps}
            </span>
          </div>
          <div style={styles.cardBody}>
            <div style={styles.progressBar}>
              <div
                style={{
                  ...styles.progressFill,
                  ...progressColor,
                  width: `${progressPct}%`,
                }}
              />
            </div>
            <div style={styles.stageList}>
              {pipelineStatus.steps_completed?.map((step, i) => (
                <div
                  key={i}
                  style={styles.stage}
                >
                  <span
                    style={{
                      ...styles.stageIcon,
                      ...(step.status === 'completed'
                        ? styles.colorSuccess
                        : step.status === 'failed'
                          ? styles.colorError
                          : styles.colorSkipped),
                    }}
                  >
                    {pipelineStepIcon[step.status] ?? '\u25CB'}
                  </span>
                  <span>{step.label || step.step}</span>
                  {step.detail && (
                    <span style={styles.stageDetail}>
                      &mdash; {step.detail}
                    </span>
                  )}
                </div>
              ))}
              {pipelineStatus.status === 'running' && (
                <div style={styles.stage}>
                  <span style={styles.spinnerInline} />
                  <span>{pipelineStatus.current_step}...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Event Log ── */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardHeaderTitle}>Event Log</h3>
          <span style={styles.badge}>{logs.length}</span>
        </div>
        <div style={styles.cardBodyFlush}>
          <div style={styles.logScroll}>
            {logs.length === 0 && (
              <p style={styles.logEmpty}>
                Waiting for provisioning to start...
              </p>
            )}
            {logs.map((log, i) => {
              const isError = log.message.includes('ERROR')
              return (
                <div
                  key={i}
                  style={{
                    ...styles.logLine,
                    ...(isError ? styles.logError : {}),
                  }}
                >
                  <span style={styles.logTimestamp}>
                    {formatTimestamp(log.timestamp)}
                  </span>
                  {log.message}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════ */

/** Converts snake_case phase names to Title Case labels. */
function formatPhaseName(phase: string): string {
  return phase
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Extracts HH:MM:SS from an ISO timestamp for compact log display. */
function formatTimestamp(ts: string): string {
  try {
    const d = new Date(ts)
    return d.toLocaleTimeString('en-AU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  } catch {
    return ts
  }
}
