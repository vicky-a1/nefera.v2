import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { type Feeling, feelingLabel, getTodayISO, makeId, useAuth, useNefera } from './state'
import { Badge, Button, Card, CardBody, CardHeader, ChartLegend, Chip, Divider, DonutChart, LineSpark, MiniBar, Page, TextArea } from './ui'

function formatShort(value: string | number) {
  const d = new Date(value)
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function useFirstVisitHint(key: string) {
  const [dismissed, setDismissed] = useState(false)
  const seen = useMemo(() => {
    try {
      return !!window.localStorage.getItem(key)
    } catch {
      return true
    }
  }, [key])
  const show = !dismissed && !seen
  const dismiss = () => {
    try {
      window.localStorage.setItem(key, '1')
    } catch {
      void 0
    }
    setDismissed(true)
  }
  return { show, dismiss }
}

export function StudentReports() {
  const { state } = useNefera()
  const reportsEnabled = state.schoolConfig.features.reports
  const checkIns = state.student.checkIns
  const hasReportData = checkIns.length > 0
  const reports = state.student.incidents.filter((r) => r.context?.submittedBy === 'student' || !r.context?.submittedBy)
  const emergency = state.schoolConfig.emergencyContact
  const hasEmergency = !!(emergency.title || emergency.phone || emergency.email)
  const emergencyCard = hasEmergency ? (
    <Card>
      <CardHeader emoji="☎️" title="Emergency contact" subtitle="If you need urgent help, contact a trusted adult." />
      <CardBody className="space-y-2">
        {emergency.title ? <div className="text-sm font-extrabold text-[rgb(var(--nefera-ink))]">{emergency.title}</div> : null}
        {emergency.phone ? (
          <div className="text-sm text-[rgb(var(--nefera-muted))]">
            Phone:{' '}
            <a className="font-semibold text-[rgb(var(--nefera-brand))]" href={`tel:${emergency.phone}`}>
              {emergency.phone}
            </a>
          </div>
        ) : null}
        {emergency.email ? (
          <div className="text-sm text-[rgb(var(--nefera-muted))]">
            Email:{' '}
            <a className="font-semibold text-[rgb(var(--nefera-brand))]" href={`mailto:${emergency.email}`}>
              {emergency.email}
            </a>
          </div>
        ) : null}
      </CardBody>
    </Card>
  ) : null

  const last7 = useMemo(() => {
    const base = new Date(getTodayISO())
    const days: string[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(base)
      d.setDate(d.getDate() - i)
      days.push(d.toISOString().slice(0, 10))
    }
    return days
  }, [])

  const last30 = useMemo(() => {
    const base = new Date(getTodayISO())
    const days: string[] = []
    for (let i = 0; i < 30; i++) {
      const d = new Date(base)
      d.setDate(d.getDate() - i)
      days.push(d.toISOString().slice(0, 10))
    }
    return days.reverse()
  }, [])

  const checkInByDay = useMemo(() => {
    const map = new Map<string, (typeof checkIns)[number]>()
    for (const c of checkIns) {
      const day = c.createdAt.slice(0, 10)
      const prev = map.get(day)
      if (!prev || prev.createdAt < c.createdAt) map.set(day, c)
    }
    return map
  }, [checkIns])

  const weekly = useMemo(() => {
    const counts: Record<Feeling, number> = { happy: 0, neutral: 0, flat: 0, worried: 0, sad: 0 }
    for (const day of last7) {
      const c = checkInByDay.get(day)
      if (!c) continue
      counts[c.feeling]++
    }
    return (['happy', 'neutral', 'flat', 'worried', 'sad'] as Feeling[]).map((f) => ({
      label: feelingLabel(f),
      value: counts[f],
      color: `rgb(var(--nefera-feeling-${f}))`,
    }))
  }, [checkInByDay, last7])

  const trend = useMemo(() => {
    const baseMap: Record<Feeling, number> = { happy: 4, neutral: 3, flat: 2, worried: 2, sad: 1 }
    const initial = { lastValue: 2.6, values: [] as number[] }
    return last30.reduce((acc, day) => {
      const c = checkInByDay.get(day)
      const next = c ? baseMap[c.feeling] : acc.lastValue
      return { lastValue: next, values: [...acc.values, next] }
    }, initial).values
  }, [checkInByDay, last30])

  const stressors = useMemo(() => {
    const buckets: Record<string, number> = {}
    function bump(k: string) {
      buckets[k] = (buckets[k] ?? 0) + 1
    }

    function categorize(text: string) {
      const v = text.toLowerCase()
      if (/(exam|test|homework|assignment|deadline|grade|school work|schoolwork|stud)/.test(v)) return 'Studies'
      if (/(sleep|tired|energy|bed|wake)/.test(v)) return 'Sleep issues'
      if (/(friend|social|classmate|left out|alone|group)/.test(v)) return 'Social concerns'
      if (/(screen|phone|social media|media|tv)/.test(v)) return 'Screen time & Comparison'
      if (/(family|mom|dad|parent|guardian|home)/.test(v)) return 'Family-related Concerns'
      return 'Other'
    }

    for (const day of last7) {
      const c = checkInByDay.get(day)
      if (!c) continue
      for (const s of (c.answers.mainSelections ?? []).filter(Boolean)) bump(categorize(String(s)))
      const other = String(c.answers.mainSelectionsOther ?? '').trim()
      if (other) bump(categorize(other))
      if (typeof c.answers.flatSleepLastNight === 'string') bump(categorize(c.answers.flatSleepLastNight))
      if (typeof c.answers.worriedMadeHard === 'string') bump(categorize(c.answers.worriedMadeHard))
      if (typeof c.answers.sadHardToEnjoy === 'string') bump(categorize(c.answers.sadHardToEnjoy))
    }

    return Object.entries(buckets)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, value]) => ({ label, value }))
  }, [checkInByDay, last7])

  const max = Math.max(1, ...stressors.map((s) => s.value))

  const overview = useMemo(() => {
    const counts = { positive: 0, neutral: 0, stressed: 0, down: 0 }
    for (const day of last7) {
      const c = checkInByDay.get(day)
      if (!c) continue
      if (c.feeling === 'happy') counts.positive++
      else if (c.feeling === 'neutral') counts.neutral++
      else if (c.feeling === 'worried') counts.stressed++
      else counts.down++
    }
    const total = counts.positive + counts.neutral + counts.stressed + counts.down
    const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0)
    return { ...counts, total, pct }
  }, [checkInByDay, last7])

  return (
    <Page emoji="📊" title="Activity reports" subtitle="A calm view of patterns — not judgement.">
      {!reportsEnabled ? (
        <>
          <Card>
            <CardHeader emoji="🔒" title="Reports are unavailable" subtitle="Your school has disabled reports right now." />
            <CardBody className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm leading-6 text-[rgb(var(--nefera-muted))]">You can still do a check-in, journal, or use other tools.</div>
              <Link to="/student/dashboard">
                <Button size="sm" variant="secondary">
                  Back
                </Button>
              </Link>
            </CardBody>
          </Card>
          {emergencyCard ? <div className="mt-4">{emergencyCard}</div> : null}
        </>
      ) : (
        <>
          {!hasReportData ? (
            <Card className="mb-4">
              <CardHeader emoji="🌱" title="No report data yet" subtitle="Start with a quick check-in. We’ll build patterns over time." />
              <CardBody className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm leading-6 text-[rgb(var(--nefera-muted))]">
                  Once you do a few check-ins, you’ll see trends here. One minute a day is enough.
                </div>
                <Link to="/student/check-in">
                  <Button>Do a check-in</Button>
                </Link>
              </CardBody>
            </Card>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0">
              <CardHeader emoji="🍩" title="Weekly feeling distribution" subtitle="Last 7 days." />
              <CardBody>
                {!hasReportData ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-48 rounded-2xl border border-white/70 bg-white/55" />
                    <div className="h-4 w-44 rounded-full bg-black/10" />
                    <div className="h-4 w-64 rounded-full bg-black/10" />
                  </div>
                ) : (
                  <div className="grid gap-5 md:grid-cols-2 md:items-center">
                    <div className="grid place-items-center rounded-2xl border border-white/70 bg-white/55 p-6 shadow-lg shadow-black/5">
                      <DonutChart size={176} stroke={18} segments={weekly} />
                    </div>
                    <div className="space-y-4">
                      <ChartLegend segments={weekly} />
                      <div className="rounded-2xl border border-white/70 bg-white/55 p-4 text-sm text-[rgb(var(--nefera-muted))] shadow-lg shadow-black/5">
                        <div className="grid gap-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[rgb(var(--nefera-ink))]">Positive days</span>
                            <span>
                              {overview.positive} days ({overview.pct(overview.positive)}%)
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[rgb(var(--nefera-ink))]">Neutral days</span>
                            <span>
                              {overview.neutral} days ({overview.pct(overview.neutral)}%)
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[rgb(var(--nefera-ink))]">Stressed days</span>
                            <span>
                              {overview.stressed} days ({overview.pct(overview.stressed)}%)
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[rgb(var(--nefera-ink))]">Down days</span>
                            <span>
                              {overview.down} days ({overview.pct(overview.down)}%)
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="grid gap-3">
                        {weekly.map((s) => (
                          <div key={s.label} className="space-y-2">
                            <div className="flex items-center justify-between text-sm font-semibold text-[rgb(var(--nefera-muted))]">
                              <span className="flex items-center gap-2 text-[rgb(var(--nefera-ink))]">
                                <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                                {s.label}
                              </span>
                              <span>{s.value}</span>
                            </div>
                            <MiniBar value={s.value} max={Math.max(...weekly.map((x) => x.value))} color={s.color} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
            <Card className="transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0">
              <CardHeader emoji="📈" title="Monthly feeling trends" subtitle="How your days have been trending." />
              <CardBody>
                {!hasReportData ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-40 w-full rounded-2xl border border-white/70 bg-white/55" />
                    <div className="h-4 w-64 rounded-full bg-black/10" />
                  </div>
                ) : (
                  <>
                    <LineSpark values={trend} width={520} height={160} className="w-full" />
                    <div className="mt-4 rounded-2xl border border-white/70 bg-white/55 p-4 text-sm leading-6 text-[rgb(var(--nefera-muted))] shadow-lg shadow-black/5">
                      Higher line = more energy and ease.
                    </div>
                  </>
                )}
              </CardBody>
            </Card>
            <Card className="md:col-span-2 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0">
              <CardHeader emoji="🧠" title="Top stressors" subtitle="What shows up most often." />
              <CardBody className="grid gap-3 md:grid-cols-2">
                {!hasReportData ? (
                  <>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="animate-pulse rounded-2xl border border-white/70 bg-white/55 p-6 shadow-lg shadow-black/5">
                        <div className="h-4 w-40 rounded-full bg-black/10" />
                        <div className="mt-3 h-2 w-full rounded-full bg-black/10" />
                      </div>
                    ))}
                  </>
                ) : stressors.length ? (
                  stressors.map((s) => (
                    <div key={s.label} className="rounded-2xl border border-white/70 bg-white/55 p-6 shadow-lg shadow-black/5">
                      <div className="flex items-center justify-between text-base font-extrabold tracking-tight text-[rgb(var(--nefera-ink))]">
                        <span>{s.label}</span>
                        <span className="text-[rgb(var(--nefera-muted))]">{s.value}</span>
                      </div>
                      <div className="mt-3">
                        <MiniBar value={s.value} max={max} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/70 bg-white/55 p-6 text-sm text-[rgb(var(--nefera-muted))] shadow-lg shadow-black/5">
                    Do a few check-ins to see what shows up most often.
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader emoji="🧾" title="Submitted reports" subtitle="Your submitted incident reports." />
              <CardBody className="grid gap-2">
                {reports.slice(0, 10).map((r) => (
                  <div key={r.id} className="rounded-2xl border border-[rgb(var(--nefera-border))] bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-extrabold text-[rgb(var(--nefera-ink))]">{r.type}</div>
                      <Badge tone={r.status === 'resolved' ? 'ok' : r.status === 'reviewing' ? 'warn' : 'neutral'}>{r.status}</Badge>
                    </div>
                    <div className="mt-1 text-xs font-semibold text-[rgb(var(--nefera-muted))]">{formatShort(r.createdAt)}</div>
                  </div>
                ))}
                {reports.length === 0 ? (
                  <div className="rounded-2xl border border-white/70 bg-white/60 p-4 text-sm text-[rgb(var(--nefera-muted))]">
                    No submitted reports yet.
                  </div>
                ) : null}
              </CardBody>
            </Card>
            {emergencyCard}
          </div>
        </>
      )}
    </Page>
  )
}

export function StudentOpenCircle() {
  const { state, dispatch } = useNefera()
  const { user } = useAuth()
  const [body, setBody] = useState('')
  const [anon, setAnon] = useState(true)
  const [comment, setComment] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  const studentId = state.parent.children[0]?.id ?? state.teacher.students[0]?.id ?? 'stu_1'
  const studentGrade =
    state.teacher.students.find((s) => s.id === studentId)?.grade ??
    state.parent.children.find((c) => c.id === studentId)?.grade ??
    ''
  const studentClassId = state.teacher.classes.find((c) => c.studentIds.includes(studentId))?.id ?? ''
  const openCircleVisibility = state.schoolConfig.openCircle.visibility
  const canAccessOpenCircle =
    state.schoolConfig.features.openCircle &&
    openCircleVisibility !== 'off' &&
    (openCircleVisibility === 'school'
      ? true
      : openCircleVisibility === 'class'
        ? state.schoolConfig.openCircle.allowedClassIds.length === 0 || state.schoolConfig.openCircle.allowedClassIds.includes(studentClassId)
      : openCircleVisibility === 'grade'
        ? state.schoolConfig.openCircle.allowedGrades.length === 0 || state.schoolConfig.openCircle.allowedGrades.includes(studentGrade)
        : openCircleVisibility === 'groups'
          ? state.schoolConfig.openCircle.allowedGroupIds.length === 0 ||
            state.student.groups.some((g) => g.joined && state.schoolConfig.openCircle.allowedGroupIds.includes(g.id))
          : true)

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 320)
    return () => window.clearTimeout(t)
  }, [])

  const openCircleHint = useFirstVisitHint('nefera_hint_open_circle_v1')

  if (!canAccessOpenCircle) {
    return (
      <Page emoji="🫶" title="Open Circle" subtitle="A friendly feed. Post anonymously or with your name.">
        <Card>
          <CardHeader emoji="🔒" title="Open Circle is unavailable" subtitle="Your school has limited access right now." />
          <CardBody className="space-y-4">
            <div className="text-sm leading-6 text-[rgb(var(--nefera-muted))]">
              If you need support, try journaling, check in with a trusted adult, or send a message to school staff.
            </div>
            <Link to="/student/dashboard">
              <Button size="sm" variant="secondary">
                Okay
              </Button>
            </Link>
          </CardBody>
        </Card>
      </Page>
    )
  }

  return (
    <Page emoji="🫶" title="Open Circle" subtitle="A friendly feed. Post anonymously or with your name.">
      <div className="space-y-4">
        {openCircleHint.show ? (
          <Card>
            <CardHeader emoji="💡" title="First time here?" subtitle="Try a small share. Keep it kind. Anonymous is always okay." />
            <CardBody className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm leading-6 text-[rgb(var(--nefera-muted))]">If you’re not ready to post, you can scroll and just read.</div>
              <Button size="sm" variant="secondary" onClick={openCircleHint.dismiss}>
                Okay
              </Button>
            </CardBody>
          </Card>
        ) : null}
        <Card>
          <CardHeader emoji="💬" title="Create post" subtitle="Keep it kind. Be gentle with yourself and others." />
          <CardBody className="space-y-4">
            <TextArea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              hint="A small check-in counts. If you’re sharing something sensitive, consider talking to a trusted adult too."
            />
            <Divider />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Chip selected={anon} onClick={() => setAnon(true)}>
                  Anonymous
                </Chip>
                <Chip selected={!anon} onClick={() => setAnon(false)}>
                  Named
                </Chip>
              </div>
              <Button
                disabled={!body.trim()}
                onClick={() => {
                  dispatch({
                    type: 'student/addPost',
                    post: {
                      id: makeId('post'),
                      createdAt: new Date().toISOString(),
                      authorName: user?.name ?? 'Student',
                      anonymous: anon,
                      body: body.trim(),
                      likes: [],
                      comments: [],
                    },
                  })
                  setBody('')
                }}
              >
                Post
              </Button>
            </div>
          </CardBody>
        </Card>
        <div className="grid gap-4">
          {loading ? (
            <>
              {Array.from({ length: 2 }).map((_, i) => (
                <Card key={`sk_${i}`}>
                  <CardBody className="animate-pulse space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="h-4 w-40 rounded-full bg-black/10" />
                      <div className="h-6 w-20 rounded-full bg-black/10" />
                    </div>
                    <div className="h-4 w-full rounded-full bg-black/10" />
                    <div className="h-4 w-5/6 rounded-full bg-black/10" />
                    <div className="h-9 w-32 rounded-2xl bg-black/10" />
                  </CardBody>
                </Card>
              ))}
            </>
          ) : null}
          {!loading && state.student.openCircle.length === 0 ? (
            <Card>
              <CardHeader emoji="🌈" title="No posts yet" subtitle="Start the circle with something small and kind." />
              <CardBody className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm leading-6 text-[rgb(var(--nefera-muted))]">
                  Share a win, ask for tips, or write what you’re feeling. You can post anonymously.
                </div>
                <Button
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                >
                  Write the first post
                </Button>
              </CardBody>
            </Card>
          ) : null}
          {state.student.openCircle.map((p) => (
            <Card key={p.id}>
              <CardBody className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-[rgb(var(--nefera-ink))]">
                      {p.anonymous ? 'Anonymous' : p.authorName}{' '}
                      <span className="ml-2 text-xs font-semibold text-[rgb(var(--nefera-muted))]">{formatShort(p.createdAt)}</span>
                    </div>
                  </div>
                  <Badge>{p.anonymous ? '🫥 Anonymous' : '🙂 Named'}</Badge>
                </div>
                <div className="text-sm text-[rgb(var(--nefera-ink))] whitespace-pre-wrap">{p.body}</div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => dispatch({ type: 'student/toggleLikePost', postId: p.id, userId: user?.id ?? 'like_1' })}>
                    ❤️ {p.likes.length}
                  </Button>
                  <Badge>{p.comments.length} comments</Badge>
                </div>
                <Divider />
                <div className="space-y-2">
                  {p.comments.map((c) => (
                    <div key={c.id} className="rounded-3xl border border-[rgb(var(--nefera-border))] bg-white p-3">
                      <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))]">
                        {c.authorName} • {formatShort(c.createdAt)}
                      </div>
                      <div className="mt-1 text-sm text-[rgb(var(--nefera-ink))]">{c.body}</div>
                    </div>
                  ))}
                  <div className="flex items-end gap-2">
                    <textarea
                      value={comment[p.id] ?? ''}
                      onChange={(e) => setComment((m) => ({ ...m, [p.id]: e.target.value }))}
                      className="min-h-11 flex-1 resize-none rounded-2xl border border-[rgb(var(--nefera-border))] bg-white px-4 py-3 text-sm outline-none ring-[rgba(98,110,255,0.22)] focus:ring-4"
                    />
                    <Button
                      size="sm"
                      disabled={!comment[p.id]?.trim()}
                      onClick={() => {
                        const text = (comment[p.id] ?? '').trim()
                        if (!text) return
                        dispatch({
                          type: 'student/addComment',
                          postId: p.id,
                          comment: { id: makeId('c'), createdAt: new Date().toISOString(), authorName: user?.name ?? 'Student', body: text },
                        })
                        setComment((m) => ({ ...m, [p.id]: '' }))
                      }}
                    >
                      Comment
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </Page>
  )
}
