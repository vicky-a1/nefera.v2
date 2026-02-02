import { useNefera } from './state'
import { Badge, Button, Card, CardBody, CardHeader, Page, Select } from './ui'

function formatShort(value: string | number) {
  const d = new Date(value)
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function PrincipalReports() {
  const { state, dispatch } = useNefera()
  const reports = state.principal.reports
  const now = reports.reduce((max, r) => {
    const t = Date.parse(r.createdAt)
    if (Number.isNaN(t)) return max
    return Math.max(max, t)
  }, 0)
  const weekMs = 1000 * 60 * 60 * 24 * 7
  const recentCountsByClassId: Record<string, number> = {}
  for (const r of reports) {
    const classId = r.context?.classId
    if (!classId) continue
    const createdMs = Date.parse(r.createdAt)
    if (Number.isNaN(createdMs)) continue
    if (now - createdMs > weekMs) continue
    recentCountsByClassId[classId] = (recentCountsByClassId[classId] ?? 0) + 1
  }

  function isHighPriority(r: (typeof reports)[number]) {
    const severe = /(self-harm|suicide|weapon|assault)/i.test(r.type) || /(immediate danger|kill|die|hurt myself)/i.test(r.description)
    const classId = r.context?.classId
    const repeated = classId ? (recentCountsByClassId[classId] ?? 0) >= 3 : false
    return severe || repeated
  }

  const ordered = [...reports].sort((a, b) => {
    const p = Number(isHighPriority(b)) - Number(isHighPriority(a))
    if (p !== 0) return p
    return Date.parse(b.createdAt) - Date.parse(a.createdAt)
  })
  return (
    <Page emoji="🧾" title="Reports" subtitle="Safety and wellbeing reports.">
      <div className="grid gap-3">
        {ordered.map((r) => (
          <Card key={r.id}>
            <CardBody className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-base font-extrabold tracking-tight text-[rgb(var(--nefera-ink))]">{r.type}</div>
                <div className="flex flex-wrap items-center gap-2">
                  {isHighPriority(r) ? <Badge tone="danger">High priority</Badge> : null}
                  <Badge tone={r.status === 'resolved' ? 'ok' : r.status === 'reviewing' ? 'warn' : 'neutral'}>{r.status}</Badge>
                </div>
              </div>
              <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))]">{formatShort(r.createdAt)}</div>
              <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))]">
                {r.context?.school ? `School: ${r.context.school}` : null}
                {r.context?.className ? `${r.context?.school ? ' • ' : ''}Class: ${r.context.className}` : null}
                {r.context?.submittedBy ? `${r.context?.school || r.context?.className ? ' • ' : ''}Submitted by: ${r.context.submittedBy}` : null}
              </div>
              <div className="text-sm leading-6 text-[rgb(var(--nefera-muted))] whitespace-pre-wrap">{r.description}</div>
              <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))]">
                Anonymous: {r.anonymous ? 'Yes' : 'No'}
              </div>
              {!r.anonymous && r.context?.studentName ? (
                <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))]">Student: {r.context.studentName}</div>
              ) : null}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="min-w-56">
                  <Select
                    value={r.status}
                    onChange={(v) => dispatch({ type: 'reports/setStatus', reportId: r.id, status: v as 'received' | 'reviewing' | 'resolved' })}
                    options={[
                      { value: 'received', label: 'received' },
                      { value: 'reviewing', label: 'reviewing' },
                      { value: 'resolved', label: 'resolved' },
                    ]}
                  />
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => dispatch({ type: 'reports/setStatus', reportId: r.id, status: r.status === 'resolved' ? 'reviewing' : 'resolved' })}
                >
                  {r.status === 'resolved' ? 'Re-open' : 'Mark resolved'}
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
        {reports.length === 0 ? (
          <Card>
            <CardHeader emoji="🌿" title="No reports yet" subtitle="Reports will appear here as they are submitted." />
            <CardBody className="text-sm text-[rgb(var(--nefera-muted))]">This page helps leadership review and route follow-up.</CardBody>
          </Card>
        ) : null}
      </div>
    </Page>
  )
}
