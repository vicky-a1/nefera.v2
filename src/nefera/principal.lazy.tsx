import { useNefera } from './state'
import { Badge, Card, CardBody, CardHeader, Page } from './ui'

function formatShort(value: string | number) {
  const d = new Date(value)
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function PrincipalReports() {
  const { state } = useNefera()
  const reports = state.principal.reports
  return (
    <Page emoji="🧾" title="Reports" subtitle="Safety and wellbeing reports.">
      <div className="grid gap-3">
        {reports.map((r) => (
          <Card key={r.id}>
            <CardBody className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-base font-extrabold tracking-tight text-[rgb(var(--nefera-ink))]">{r.type}</div>
                <Badge tone={r.status === 'resolved' ? 'ok' : r.status === 'reviewing' ? 'warn' : 'neutral'}>{r.status}</Badge>
              </div>
              <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))]">{formatShort(r.createdAt)}</div>
              <div className="text-sm leading-6 text-[rgb(var(--nefera-muted))] whitespace-pre-wrap">{r.description}</div>
              <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))]">
                Anonymous: {r.anonymous ? 'Yes' : 'No'}
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
