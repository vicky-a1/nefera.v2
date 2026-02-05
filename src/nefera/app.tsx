import React, { Suspense, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, Outlet, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  type AgeGroup,
  type Feeling,
  type Role,
  type SleepHoursBucket,
  type StudentCheckIn,
  type StudentCheckInAnswers,
  feelingEmoji,
  feelingLabel,
  getTodayISO,
  makeId,
  useAuth,
  useNefera,
} from './state'
import logo from '@/assets/nefera-logo.png'
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  ChartLegend,
  ChartCard,
  ChecklistGroup,
  Divider,
  DonutChart,
  IconButton,
  Input,
  LineSpark,
  FeelingButton,
  MiniBar,
  Modal,
  Page,
  ProgressBar,
  Section,
  Select,
  StatPill,
  StepperHeader,
  Stars,
  Tabs,
  TextArea,
  TileCard,
  Toast,
  cx,
  flagLabel,
  flagTone,
  useCountdown,
} from './ui'

const APP_NAME = 'Nefera'
const TAGLINE = 'Smart care for aspiring mind'

const feelingPalette = {
  happy: { color: 'rgb(var(--nefera-feeling-happy))', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.22)', ring: 'rgba(34,197,94,0.14)' },
  neutral: { color: 'rgb(var(--nefera-feeling-neutral))', bg: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.20)', ring: 'rgba(59,130,246,0.12)' },
  flat: { color: 'rgb(var(--nefera-feeling-flat))', bg: 'rgba(156,163,175,0.10)', border: 'rgba(156,163,175,0.22)', ring: 'rgba(156,163,175,0.12)' },
  worried: { color: 'rgb(var(--nefera-feeling-worried))', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.22)', ring: 'rgba(245,158,11,0.12)' },
  sad: { color: 'rgb(var(--nefera-feeling-sad))', bg: 'rgba(244,63,94,0.12)', border: 'rgba(244,63,94,0.22)', ring: 'rgba(244,63,94,0.12)' },
} satisfies Record<Feeling, { color: string; bg: string; border: string; ring: string }>

const roles: Array<{ role: Role; label: string; emoji: string; blurb: string }> = [
  { role: 'student', label: 'Student', emoji: '🎒', blurb: 'Daily check-ins, journals, habits, and support.' },
  { role: 'teacher', label: 'Teacher', emoji: '🧑‍🏫', blurb: 'Class feeling overview, broadcasts, and observations.' },
  { role: 'parent', label: 'Parent', emoji: '👪', blurb: 'Child wellbeing overview and gentle check-ins.' },
  { role: 'counselor', label: 'Counselor', emoji: '🧠', blurb: 'Flagged students, questionnaires, and crisis actions.' },
  { role: 'principal', label: 'Principal', emoji: '🏫', blurb: 'School-wide insights and reports.' },
  { role: 'admin', label: 'Admin', emoji: '🛠️', blurb: 'School settings and configuration requests.' },
]

type NavItem = { to: string; label: string; emoji: string }

function navForRole(role: Role): NavItem[] {
  switch (role) {
    case 'student':
      return [
        { to: '/student/dashboard', label: 'Home', emoji: '🏡' },
        { to: '/student/check-in', label: 'Check-in', emoji: '💛' },
        { to: '/student/journal/write', label: 'Journal', emoji: '📝' },
        { to: '/student/inbox', label: 'Inbox', emoji: '💬' },
        { to: '/student/profile', label: 'Profile', emoji: '🙋' },
      ]
    case 'teacher':
      return [
        { to: '/teacher/dashboard', label: 'Home', emoji: '🏡' },
        { to: '/teacher/broadcast', label: 'Broadcast', emoji: '📣' },
        { to: '/teacher/students', label: 'Students', emoji: '🧑‍🎓' },
        { to: '/teacher/profile', label: 'Profile', emoji: '🙋' },
      ]
    case 'parent':
      return [
        { to: '/parent/dashboard', label: 'Home', emoji: '🏡' },
        { to: '/parent/message', label: 'Message', emoji: '💌' },
        { to: '/parent/checklist', label: 'Checklist', emoji: '✅' },
        { to: '/parent/profile', label: 'Profile', emoji: '🙋' },
      ]
    case 'counselor':
      return [
        { to: '/counselor/dashboard', label: 'Home', emoji: '🏡' },
        { to: '/counselor/flags', label: 'Flags', emoji: '🚩' },
        { to: '/counselor/reports', label: 'Reports', emoji: '🧾' },
        { to: '/counselor/broadcast', label: 'Broadcast', emoji: '📣' },
        { to: '/counselor/profile', label: 'Profile', emoji: '🙋' },
      ]
    case 'principal':
      return [
        { to: '/principal/dashboard', label: 'Home', emoji: '🏡' },
        { to: '/principal/reports', label: 'Reports', emoji: '🧾' },
        { to: '/principal/broadcast', label: 'Broadcast', emoji: '📣' },
        { to: '/principal/admin-approvals', label: 'Approvals', emoji: '✅' },
        { to: '/principal/profile', label: 'Profile', emoji: '🙋' },
      ]
    case 'admin':
      return [
        { to: '/admin/dashboard', label: 'Home', emoji: '🏡' },
        { to: '/admin/config', label: 'Config', emoji: '⚙️' },
        { to: '/admin/profile', label: 'Profile', emoji: '🙋' },
      ]
  }
}

function roleHome(role: Role) {
  return `/${role}/dashboard`
}

function isActivePath(pathname: string, target: string) {
  if (pathname === target) return true
  return pathname.startsWith(target + '/')
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

function AppShell() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const nav = navForRole(user?.role ?? 'student')
  const activeItem = nav.find((n) => isActivePath(location.pathname, n.to))
  const active = activeItem?.to
  const activeLabel = activeItem?.label ?? APP_NAME

  useEffect(() => {
    document.documentElement.dataset.role = user?.role ?? 'guest'
  }, [user?.role])

  return (
    <div className="min-h-screen">
      <div className="hidden md:flex">
        <aside className="fixed left-0 top-0 h-screen w-72 border-r border-white/60 bg-[radial-gradient(900px_520px_at_20%_0%,rgba(98,110,255,0.14),transparent_55%),radial-gradient(900px_520px_at_80%_30%,rgba(62,197,200,0.12),transparent_55%),rgba(255,255,255,0.70)] backdrop-blur">
          <div className="px-6 pt-6">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Nefera Logo" className="h-12 w-auto object-contain" />
              <div className="min-w-0">
                <div className="truncate text-lg font-extrabold tracking-tight text-[rgb(var(--nefera-ink))]">{APP_NAME}</div>
                <div className="mt-0.5 truncate text-xs font-semibold text-[rgb(var(--nefera-muted))]">{TAGLINE}</div>
              </div>
            </div>
          </div>
          <div className="mt-6 px-4">
            <div className="rounded-2xl border border-white/70 bg-white/70 p-3 shadow-lg shadow-black/5">
              <div className="flex items-center gap-3">
                <Avatar name={user?.name ?? 'Guest'} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-extrabold text-[rgb(var(--nefera-ink))]">{user?.name ?? 'Guest'}</div>
                  <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))]">{user?.role.toUpperCase()}</div>
                </div>
                <IconButton label="Logout" onClick={logout} className="ml-auto">
                  <span className="text-lg">🚪</span>
                </IconButton>
              </div>
            </div>
          </div>
          <nav className="mt-4 px-3">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cx(
                  'mt-1 flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-lg shadow-transparent transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-black/5 active:translate-y-0 active:scale-[0.99]',
                  active === item.to
                    ? 'border-white/70 bg-white/75 text-[rgb(var(--nefera-ink))]'
                    : 'border-transparent text-[rgb(var(--nefera-muted))] hover:border-white/60 hover:bg-white/55',
                )}
              >
                <span className="text-lg">{item.emoji}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>
        <main className="ml-72 w-full">
          <Outlet />
        </main>
      </div>

      <div className="md:hidden">
        <div
          className="sticky top-0 z-30 border-b border-[rgb(var(--nefera-border))] bg-white"
          style={{ height: 'calc(3.5rem + env(safe-area-inset-top))', paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="mx-auto w-full max-w-[480px] px-3">
            <div className="grid h-14 grid-cols-[1fr_auto_1fr] items-center gap-2">
              <div className="flex items-center">
                <img src={logo} alt="Nefera Logo" className="h-9 w-auto object-contain" />
              </div>
              <div className="truncate text-center text-sm font-extrabold tracking-tight text-[rgb(var(--nefera-ink))]">{activeLabel}</div>
              <div className="flex items-center justify-end gap-2">
                <Link to={`/${user?.role ?? 'student'}/profile`}>
                  <IconButton label="Profile">
                    <span className="text-lg">🙋</span>
                  </IconButton>
                </Link>
                <IconButton label="Logout" onClick={logout}>
                  <span className="text-lg">🚪</span>
                </IconButton>
              </div>
            </div>
          </div>
        </div>
        <main className="pb-[calc(4rem+env(safe-area-inset-bottom))]">
          <Outlet />
        </main>
        <div
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-[rgb(var(--nefera-border))] bg-white"
          style={{ height: 'calc(4rem + env(safe-area-inset-bottom))', paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="mx-auto grid h-16 max-w-[480px] grid-cols-4 gap-1 px-3">
            {nav.slice(0, 4).map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cx(
                  'flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold text-[rgb(var(--nefera-muted))] transition-all duration-200 ease-out active:translate-y-px',
                  active === item.to
                    ? 'bg-[rgba(98,110,255,0.14)] text-[rgb(var(--nefera-ink))]'
                    : 'hover:bg-black/5',
                )}
              >
                <div className="text-xl leading-none">{item.emoji}</div>
                <div className="leading-none">{item.label}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function RequireAuth({ children, role }: { children: React.ReactNode; role?: Role }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to={`/welcome?from=${encodeURIComponent(location.pathname)}`} replace />
  if (role && user.role !== role) return <Navigate to={roleHome(user.role)} replace />
  return <>{children}</>
}

function WelcomePage() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-16">
        <div className="mb-10 flex justify-center">
          <img src={logo} alt="Nefera Logo" className="h-24 w-auto object-contain" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/55 px-3 py-1 text-xs font-semibold text-[rgb(var(--nefera-ink))] shadow-lg shadow-black/5">
              <img src={logo} alt="Nefera Logo" className="h-5 w-auto object-contain" />
              <span>Calm, supportive, school-ready</span>
            </div>
            <div className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight text-[rgb(var(--nefera-ink))] md:text-5xl">
              {APP_NAME}
            </div>
            <div className="mt-3 text-lg font-semibold text-[rgb(var(--nefera-muted))]">{TAGLINE}</div>
            <div className="mt-5 max-w-xl text-sm leading-6 text-[rgb(var(--nefera-muted))]">
              A multi-role mental wellbeing platform for real school life: quick check-ins, gentle journaling, clear insights, and safer support.
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-2">
              <Link to="/role">
                <Button>Get started</Button>
              </Link>
              <Link to="/role">
                <Button variant="ghost">Explore roles</Button>
              </Link>
            </div>
          </div>
          <Card className="overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-extrabold text-[rgb(var(--nefera-ink))]">Today’s overview</div>
                  <div className="mt-1 text-xs text-[rgb(var(--nefera-muted))]">A calm snapshot of what matters today.</div>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/70 bg-white/70 text-2xl shadow-lg shadow-black/5">
                  🌊
                </div>
              </div>
              <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                <Card className="border-[rgba(98,110,255,0.18)]">
                  <CardBody className="space-y-2">
                      <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))]">Weekly feeling distribution</div>
                    <div className="flex items-center gap-4">
                      {(() => {
                        const segments = [
                          { label: 'Happy', value: 28, color: 'rgb(var(--nefera-feeling-happy))' },
                          { label: 'Neutral', value: 22, color: 'rgb(var(--nefera-feeling-neutral))' },
                          { label: 'Flat', value: 14, color: 'rgb(var(--nefera-feeling-flat))' },
                          { label: 'Worried', value: 16, color: 'rgb(var(--nefera-feeling-worried))' },
                          { label: 'Sad', value: 10, color: 'rgb(var(--nefera-feeling-sad))' },
                        ]
                        return (
                          <>
                            <DonutChart size={92} stroke={12} segments={segments} />
                            <div className="space-y-1.5 text-xs font-semibold text-[rgb(var(--nefera-muted))]">
                              {segments.slice(0, 3).map((s) => (
                                <div key={s.label} className="flex items-center gap-2">
                                  <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                                  <span>{s.label}</span>
                                </div>
                              ))}
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  </CardBody>
                </Card>
                <Card className="border-[rgba(62,197,200,0.18)]">
                  <CardBody className="space-y-2">
                    <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))]">Monthly trend</div>
                    <LineSpark values={[2, 3, 3.2, 2.9, 3.3, 3.7, 3.4, 3.9, 3.6, 3.8]} width={240} height={86} />
                  </CardBody>
                </Card>
              </div>
              <Divider className="my-5" />
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-[rgb(var(--nefera-muted))]">Pick a role, then explore dashboards and flows.</div>
                <Link to="/role">
                  <Button size="sm">Choose role</Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function RoleSelectPage() {
  const { selectedRole, selectRole, user } = useAuth()
  if (user) return <Navigate to={roleHome(user.role)} replace />
  return (
    <Page>
      <div className="mb-8 text-center">
        <img src={logo} alt="Nefera Logo" className="mx-auto h-24 w-auto object-contain" />
        <div className="mt-4 text-3xl font-extrabold tracking-tight text-[rgb(var(--nefera-ink))] md:text-4xl">Choose your role</div>
        <div className="mt-2 text-sm font-semibold text-[rgb(var(--nefera-muted))]">{APP_NAME} adapts the experience for each role.</div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {roles.map((r) => (
          <button
            key={r.role}
            type="button"
            onClick={() => selectRole(r.role)}
            className={cx(
              'rounded-2xl border bg-white/55 p-6 text-left shadow-lg shadow-black/5 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/80 hover:shadow-xl active:translate-y-0 active:scale-[0.99]',
              selectedRole === r.role ? 'border-white/70 ring-4 ring-[rgba(98,110,255,0.14)]' : 'border-white/70',
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-base font-extrabold text-[rgb(var(--nefera-ink))]">
                  <span className="text-xl">{r.emoji}</span>
                  <span>{r.label}</span>
                </div>
                <div className="mt-2 text-sm leading-6 text-[rgb(var(--nefera-muted))]">{r.blurb}</div>
              </div>
              {selectedRole === r.role ? <Badge tone="ok">Selected</Badge> : <Badge>Tap</Badge>}
            </div>
          </button>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Link to="/login">
          <Button disabled={!selectedRole}>Continue</Button>
        </Link>
        <Link to="/welcome">
          <Button variant="ghost">Back</Button>
        </Link>
      </div>
    </Page>
  )
}

function LoginPage() {
  const { selectedRole, login, user } = useAuth()
  const [name, setName] = useState('')
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const navigate = useNavigate()
  const [search] = useSearchParams()

  if (user) return <Navigate to={roleHome(user.role)} replace />
  return (
    <Page>
      <div className="mb-8 text-center">
        <img src={logo} alt="Nefera Logo" className="mx-auto h-24 w-auto object-contain" />
        <div className="mt-4 text-3xl font-extrabold tracking-tight text-[rgb(var(--nefera-ink))] md:text-4xl">Login</div>
        <div className="mt-2 text-sm font-semibold text-[rgb(var(--nefera-muted))]">Sign in to continue.</div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <CardHeader
            title="Sign in"
            subtitle={selectedRole ? `Role: ${selectedRole.toUpperCase()}` : 'Pick a role to continue.'}
            right={
              <Link to="/role" className="text-sm font-semibold text-[rgb(var(--nefera-brand))]">
                Change
              </Link>
            }
          />
          <CardBody className="space-y-3">
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="School ID / Email" value={id} onChange={(e) => setId(e.target.value)} />
            <Input label="Password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
            <div className="pt-2">
              <Button
                className="w-full"
                disabled={!selectedRole}
                onClick={() => {
                  login(name || (selectedRole ? selectedRole[0].toUpperCase() + selectedRole.slice(1) : 'Guest'))
                  const from = search.get('from')
                  navigate(from || roleHome(selectedRole ?? 'student'), { replace: true })
                }}
              >
                Continue
              </Button>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="What you can do" subtitle="Core tools for students, families, and staff." />
          <CardBody className="space-y-3 text-sm text-[rgb(var(--nefera-muted))]">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-black/5 text-lg">🧠</div>
              <div>
                <div className="font-extrabold text-[rgb(var(--nefera-ink))]">Daily check-ins</div>
                <div>Age-based questionnaires with gentle guidance.</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-black/5 text-lg">📊</div>
              <div>
                <div className="font-extrabold text-[rgb(var(--nefera-ink))]">Charts & patterns</div>
                <div>Weekly distribution, trends, and top stressors.</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-black/5 text-lg">🫶</div>
              <div>
                <div className="font-extrabold text-[rgb(var(--nefera-ink))]">Support workflows</div>
                <div>Broadcasts, inbox messages, and safety reporting.</div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </Page>
  )
}

function RoleEntry() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/welcome" replace />
  return <Navigate to={roleHome(user.role)} replace />
}

function StudentDashboard() {
  const { user } = useAuth()
  const { state } = useNefera()
  const navigate = useNavigate()
  const feelingHint = useFirstVisitHint('nefera_hint_feeling_checkin_v1')
  const dayStreak = streakFromISODateList(state.student.checkIns.map((c) => c.createdAt.slice(0, 10)))
  const journalStreak = streakFromISODateList(state.student.journal.map((j) => j.dateKey))
  const studentId = state.parent.children[0]?.id ?? state.teacher.students[0]?.id ?? 'stu_1'
  const studentGrade = state.teacher.students.find((s) => s.id === studentId)?.grade ?? ''
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

  const last7CheckIns = useMemo(() => {
    const byDay = new Map<string, StudentCheckIn>()
    for (const c of state.student.checkIns) {
      const day = c.createdAt.slice(0, 10)
      if (!last7.includes(day)) continue
      const prev = byDay.get(day)
      if (!prev || prev.createdAt < c.createdAt) byDay.set(day, c)
    }
    return last7.map((d) => byDay.get(d)).filter(Boolean) as StudentCheckIn[]
  }, [last7, state.student.checkIns])

  const weeklySegments = useMemo(() => {
    const counts: Record<Feeling, number> = { happy: 0, neutral: 0, flat: 0, worried: 0, sad: 0 }
    for (const c of last7CheckIns) counts[c.feeling]++
    return (['happy', 'neutral', 'flat', 'worried', 'sad'] as Feeling[]).map((f) => ({
      label: feelingLabel(f),
      value: counts[f],
      color: `rgb(var(--nefera-feeling-${f}))`,
    }))
  }, [last7CheckIns])

  const topStressors = useMemo(() => {
    const buckets: Record<string, number> = {
      Studies: 0,
      'Sleep issues': 0,
      'Social concerns': 0,
      'Screen time & Comparison': 0,
      'Family-Related Concerns': 0,
      Other: 0,
    }

    function bump(label: string) {
      buckets[label] = (buckets[label] ?? 0) + 1
    }

    function categorize(text: string) {
      const v = text.toLowerCase()
      if (/(exam|test|homework|assignment|deadline|grade|school work|schoolwork|stud)/.test(v)) return 'Studies'
      if (/(sleep|tired|energy|bed|wake)/.test(v)) return 'Sleep issues'
      if (/(friend|social|classmate|left out|alone|group)/.test(v)) return 'Social concerns'
      if (/(screen|phone|social media|media|tv)/.test(v)) return 'Screen time & Comparison'
      if (/(family|mom|dad|parent|guardian|home)/.test(v)) return 'Family-Related Concerns'
      return 'Other'
    }

    for (const c of last7CheckIns) {
      const sels = (c.answers.mainSelections ?? []).filter(Boolean)
      for (const s of sels) bump(categorize(s))
      const other = String(c.answers.mainSelectionsOther ?? '').trim()
      if (other) bump(categorize(other))
      if (typeof c.answers.flatSleepLastNight === 'string') bump(categorize(c.answers.flatSleepLastNight))
      if (typeof c.answers.worriedMadeHard === 'string') bump(categorize(c.answers.worriedMadeHard))
      if (typeof c.answers.sadHardToEnjoy === 'string') bump(categorize(c.answers.sadHardToEnjoy))
    }

    return Object.entries(buckets)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k, v]) => ({ k, v }))
  }, [last7CheckIns])

  const totalActiveDays = useMemo(() => {
    const days = new Set<string>()
    state.student.checkIns.forEach((x) => days.add(x.createdAt.slice(0, 10)))
    state.student.journal.forEach((x) => days.add(x.dateKey))
    state.student.sleepLogs.forEach((x) => days.add(x.createdAt.slice(0, 10)))
    return days.size
  }, [state.student.checkIns, state.student.journal, state.student.sleepLogs])
  const positiveMessageWords = useMemo(() => {
    const text = state.schoolConfig.positiveMessage.text.trim()
    return text ? text.split(/\s+/).filter(Boolean) : []
  }, [state.schoolConfig.positiveMessage.text])
  const positiveMessageText = useMemo(() => {
    const max = Math.max(1, state.schoolConfig.positiveMessage.maxWords)
    return positiveMessageWords.slice(0, max).join(' ')
  }, [positiveMessageWords, state.schoolConfig.positiveMessage.maxWords])

  return (
    <Page
      title={`Hi ${user?.name ?? 'there'}`}
      subtitle="Start with a one-minute check-in."
      right={
        user?.role === 'student' && state.schoolConfig.positiveMessage.enabled && positiveMessageText ? (
          <div className="w-80">
            <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-lg shadow-black/5">
              <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))]">Message from school</div>
              <div className="mt-1 text-sm font-extrabold text-[rgb(var(--nefera-ink))] whitespace-pre-wrap">{positiveMessageText}</div>
            </div>
          </div>
        ) : null
      }
    >
      <Card className="mb-4">
        <CardBody className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Link to="/student/profile">
              <Avatar name={user?.name ?? 'Guest'} />
            </Link>
            <div className="min-w-0">
              <div className="truncate text-sm font-extrabold text-[rgb(var(--nefera-ink))]">{user?.name ?? 'Guest'}</div>
              <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))]">Student</div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="rounded-2xl border border-[rgb(var(--nefera-border))] bg-white p-3 text-center shadow-none md:border-white/70 md:bg-white/70 md:shadow-lg md:shadow-black/5">
              <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))]">Day streak</div>
              <div className="mt-1 text-lg font-extrabold text-[rgb(var(--nefera-ink))]">{dayStreak}</div>
            </div>
            <div className="rounded-2xl border border-[rgb(var(--nefera-border))] bg-white p-3 text-center shadow-none md:border-white/70 md:bg-white/70 md:shadow-lg md:shadow-black/5">
              <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))]">Active days</div>
              <div className="mt-1 text-lg font-extrabold text-[rgb(var(--nefera-ink))]">{totalActiveDays}</div>
            </div>
            <div className="rounded-2xl border border-[rgb(var(--nefera-border))] bg-white p-3 text-center shadow-none md:border-white/70 md:bg-white/70 md:shadow-lg md:shadow-black/5">
              <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))]">Journal streak</div>
              <div className="mt-1 text-lg font-extrabold text-[rgb(var(--nefera-ink))]">{journalStreak}</div>
            </div>
          </div>
        </CardBody>
      </Card>
      <Card>
        <CardBody className="space-y-4">
          {feelingHint.show ? (
            <div className="flex items-start justify-between gap-4 rounded-2xl border border-[rgb(var(--nefera-border))] bg-white p-4 shadow-none md:border-white/70 md:bg-white/70 md:shadow-lg md:shadow-black/5">
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-[rgb(var(--nefera-ink))]">Tip</div>
                <div className="mt-1 text-sm leading-6 text-[rgb(var(--nefera-muted))]">
                  Tap a face to start. There’s no “right” answer — we’re just noticing patterns.
                </div>
              </div>
              <Button size="sm" variant="secondary" onClick={feelingHint.dismiss}>
                Got it
              </Button>
            </div>
          ) : null}
          <Section title="Daily check-in" subtitle="How are you feeling today?" />
          <div className="grid grid-cols-3 gap-3">
            {(['happy', 'neutral', 'flat', 'worried', 'sad'] as Feeling[]).map((f) => (
              <div key={f} className="text-center">
                <FeelingButton
                  to={`/student/check-in/${f}`}
                  emoji={feelingEmoji(f)}
                  label={feelingLabel(f)}
                  color={feelingPalette[f].color}
                  background={feelingPalette[f].bg}
                  borderColor={feelingPalette[f].border}
                  ringColor={feelingPalette[f].ring}
                  className="mx-auto h-16 w-16"
                />
                <div className="mt-3 text-xs font-extrabold tracking-tight text-[rgb(var(--nefera-ink))]">{feelingLabel(f)}</div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
      <div className="mt-5 space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
        <Card>
          <CardBody className="space-y-4">
            <Section title="Your space" subtitle="Gentle tools designed for real school days." />
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => navigate('/student/journal/write')}>Write Journal</Button>
              <Button onClick={() => navigate('/student/journal/past')}>View Past Journals</Button>
              <Button onClick={() => navigate('/student/peer-input')}>Peer Observation</Button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {[
                { to: '/student/journal/write', title: 'Write journal', icon: '📝', desc: 'Write it out, softly.' },
                { to: '/student/journal/past', title: 'Past journals', icon: '📚', desc: 'Look back with kindness.' },
                ...(state.schoolConfig.features.reports ? [{ to: '/student/reports', title: 'Reports', icon: '📊', desc: 'Patterns over time.' }] : []),
                { to: '/student/habits', title: 'Habits', icon: '🔥', desc: 'Tiny routines, big wins.' },
                { to: '/student/soul-space', title: 'Soul Space', icon: '🌿', desc: 'Calm tools on demand.' },
                ...(canAccessOpenCircle ? [{ to: '/student/open-circle', title: 'Open Circle', icon: '🌍', desc: 'A kind community feed.' }] : []),
                ...(state.schoolConfig.features.reports ? [{ to: '/student/report-incident', title: 'Report', icon: '🛡️', desc: 'Speak up safely.' }] : []),
              ].map((x) => (
                <TileCard key={x.to} to={x.to} icon={x.icon} title={x.title} description={x.desc} />
              ))}
            </div>
          </CardBody>
        </Card>
        <div className="grid gap-4">
          {(() => {
            return (
              <>
                <ChartCard title="Weekly feeling distribution" subtitle="Last 7 days">
                  <div className="grid place-items-center rounded-2xl border border-[rgb(var(--nefera-border))] bg-white p-6 shadow-none md:border-white/70 md:bg-white/55 md:shadow-lg md:shadow-black/5">
                    <DonutChart size={168} stroke={18} segments={weeklySegments} />
                  </div>
                  <ChartLegend segments={weeklySegments} />
                </ChartCard>
                <ChartCard title="Top stressors" subtitle="This week">
                  <div className="space-y-3">
                    {topStressors.length ? (
                      topStressors.map((x) => (
                        <div key={x.k} className="space-y-2">
                          <div className="flex items-center justify-between text-sm font-semibold text-[rgb(var(--nefera-muted))]">
                            <span className="text-[rgb(var(--nefera-ink))]">{x.k}</span>
                            <span>{x.v}</span>
                          </div>
                          <MiniBar value={x.v} max={Math.max(...topStressors.map((t) => t.v))} />
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-white/70 bg-white/55 p-4 text-sm text-[rgb(var(--nefera-muted))] shadow-lg shadow-black/5">
                        Check in a few times to see what’s showing up most.
                      </div>
                    )}
                  </div>
                </ChartCard>
              </>
            )
          })()}
        </div>
      </div>
    </Page>
  )
}

function StudentCheckInEntry() {
  return <Navigate to="/student/dashboard" replace />
}

function StudentCheckInFlow() {
  const { state, dispatch } = useNefera()
  const params = useParams()
  const navigate = useNavigate()
  const feeling = (params.feeling as Feeling | undefined) ?? 'neutral'
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<StudentCheckInAnswers>({})

  const ageGroup: AgeGroup = state.student.ageGroup ?? '11-17'
  const studentId = state.parent.children[0]?.id ?? state.teacher.students[0]?.id ?? 'stu_1'

  type Step =
    | { kind: 'multi'; key: keyof StudentCheckInAnswers; title: string; subtitle?: string; items: string[]; otherKey?: keyof StudentCheckInAnswers }
    | { kind: 'single'; key: keyof StudentCheckInAnswers; title: string; subtitle?: string; options: string[] }
    | { kind: 'stars'; key: keyof StudentCheckInAnswers; title: string; subtitle?: string; max: number }

  const flow = useMemo(() => {
    const byFeeling = {
      happy: {
        '6-10': {
          pageSubtitle: 'What made you smile today?',
          steps: [
            {
              kind: 'multi',
              key: 'mainSelections',
              title: 'What made you smile today?',
              subtitle: 'Tap all that fit',
              items: [
                'Did great in school',
                'Played with friends',
                'Felt happy inside',
                'Slept well / had energy',
                'Finished something hard',
                'Felt happy for no big reason',
                'Did a fun game or drawing',
                'Helped a parent or friend',
                'Other',
              ],
              otherKey: 'mainSelectionsOther',
            },
            { kind: 'stars', key: 'happyStars', title: 'How strong was your happy feeling?', max: 5 },
            { kind: 'single', key: 'happyWhen', title: 'When did you feel happiest?', options: ['Morning', 'During school', 'After school', 'Night'] },
            { kind: 'single', key: 'happyWho', title: 'Who or what helped you feel happy?', options: ['Friend', 'Family', 'Teacher', 'Game/toy', 'Class', 'No one / nothing specific'] },
            { kind: 'single', key: 'happyHelp', title: 'Did feeling happy help your day?', options: ['School felt easier', 'Play felt more fun', 'Both felt better', 'No change'] },
            { kind: 'single', key: 'happyWantMore', title: 'Do you want more of this tomorrow?', options: ['Yes', 'Maybe', 'Not sure'] },
          ] satisfies Step[],
          closing: 'Nice sharing. Take one slow breath, smile a little, and remember one good moment.',
        },
        '11-17': {
          pageSubtitle: 'What made you feel happy today?',
          steps: [
            {
              kind: 'multi',
              key: 'mainSelections',
              title: 'What made you feel happy today?',
              subtitle: 'Tap all that fit',
              items: [
                'Got good grades/test score',
                'Hung out with friends',
                'Felt proud of my work/effort',
                'Slept well / had energy',
                'Made progress on goals',
                'Felt good for no big reason',
                'Enjoyed gaming/hobby',
                'Helped someone',
                'Other',
              ],
              otherKey: 'mainSelectionsOther',
            },
            { kind: 'stars', key: 'happyStars', title: 'How strong was your happy feeling?', max: 5 },
            { kind: 'single', key: 'happyWhen', title: 'When did you feel happiest?', options: ['Morning', 'During school', 'After school', 'Evening/night'] },
            { kind: 'single', key: 'happyWho', title: 'Who or what helped you feel happy?', options: ['Friend', 'Family', 'Teacher', 'Game/hobby', 'School / class', 'Nothing specific'] },
            { kind: 'single', key: 'happyHelp', title: 'Did feeling happy help your day?', options: ['School felt easier', 'Free time felt better', 'Both felt better', 'No change'] },
            { kind: 'single', key: 'happyWantMore', title: 'Do you want more of this tomorrow?', options: ['Yes', 'Maybe', 'Not sure'] },
          ] satisfies Step[],
          closing: 'Nice sharing. Notice one good thing and take one slow breath.',
        },
      },
      neutral: {
        '6-10': {
          pageSubtitle: 'How was your day today?',
          steps: [
            {
              kind: 'multi',
              key: 'mainSelections',
              title: "You chose 'okay'. What was your day like?",
              subtitle: 'Tap all that fit',
              items: ['A normal school day', 'A little boring', 'Waiting for something fun', 'Some good, some bad', 'A busy day', 'Other'],
              otherKey: 'mainSelectionsOther',
            },
            { kind: 'single', key: 'neutralDayLike', title: 'Overall, your day felt like…', options: ['A little boring', 'Just normal', 'Not sure', 'Okay'] },
            { kind: 'single', key: 'neutralAnyFun', title: 'Was there any fun today?', options: ['Yes, with friends', 'Yes, in class', 'Yes, at home', 'Not really'] },
            { kind: 'single', key: 'neutralLessFunBecause', title: 'Did anything make the day less fun?', options: ['Tired', 'Bored', 'Not interested', 'No'] },
            { kind: 'single', key: 'neutralSchoolWork', title: 'How was schoolwork today?', options: ['Easy', 'Okay', 'Hard to listen'] },
            { kind: 'single', key: 'neutralFriends', title: 'How was it with friends today?', options: ['Played together', 'Sometimes alone', 'Mostly alone'] },
          ] satisfies Step[],
          closing: 'Okay days are normal. Pick one small thing you want to enjoy tomorrow.',
        },
        '11-17': {
          pageSubtitle: 'How was your day today?',
          steps: [
            {
              kind: 'multi',
              key: 'mainSelections',
              title: "You chose 'okay'. How would you describe your day?",
              subtitle: 'Tap all that fit',
              items: ['A normal school day', 'A bit boring', 'Waiting for something', 'Mixed good and bad moments', 'Busy but okay', 'Other'],
              otherKey: 'mainSelectionsOther',
            },
            { kind: 'single', key: 'neutralDayLike', title: 'Overall, your day felt like…', options: ['A little boring', 'Just normal', 'Not sure', 'Okay'] },
            { kind: 'single', key: 'neutralAnyFun', title: 'Was there any good moment today?', options: ['Yes, with friends', 'Yes, in class', 'Yes, at home', 'Not really'] },
            { kind: 'single', key: 'neutralLessFunBecause', title: 'Did anything make the day less fun?', options: ['Tired', 'Bored', 'Not interested', 'No'] },
            { kind: 'single', key: 'neutralSchoolWork', title: 'How was schoolwork today?', options: ['Easy to focus', 'Okay to focus', 'Hard to focus'] },
            { kind: 'single', key: 'neutralFriends', title: 'How was it with classmates?', options: ['Felt included', 'Sometimes alone', 'Mostly alone'] },
          ] satisfies Step[],
          closing: 'Normal days happen. Pick one small good thing to look forward to tomorrow.',
        },
      },
      flat: {
        '6-10': {
          pageSubtitle: "Feeling low energy? What's making it hard?",
          steps: [
            {
              kind: 'multi',
              key: 'mainSelections',
              title: "You chose 'flat'. What made your day feel low energy?",
              subtitle: 'Tap all that fit',
              items: [
                "Didn't sleep well",
                'Too much homework',
                'Thinking too much',
                'Wanted to be alone',
                'Too much TV/phone',
                'No energy to play',
                'Felt blank or numb',
                'Other',
              ],
              otherKey: 'mainSelectionsOther',
            },
            { kind: 'single', key: 'flatWhen', title: 'When did the flat feeling happen?', options: ['All day', 'Sometimes', 'A little bit'] },
            { kind: 'single', key: 'flatFunNotFun', title: "What didn't feel fun today?", options: ['Games', 'Friends', 'School stuff', 'Reading', 'Nothing was fun', 'Other'] },
            { kind: 'single', key: 'flatTiredWhere', title: 'Where did you feel tired?', options: ['Body', 'Head', 'Both', 'Not tired'] },
            { kind: 'single', key: 'flatWithOtherKids', title: 'How was it around other kids?', options: ['Wanted to play', 'Stayed quiet', 'Wanted to be alone'] },
            { kind: 'single', key: 'flatSleepLastNight', title: 'How was your sleep last night?', options: ['Good', 'Okay', 'Bad'] },
          ] satisfies Step[],
          closing: 'Low energy days happen. Try a stretch and 3 slow breaths.',
        },
        '11-17': {
          pageSubtitle: "Feeling low energy? What's making it hard?",
          steps: [
            {
              kind: 'multi',
              key: 'mainSelections',
              title: "You chose 'flat'. What made your day feel low energy?",
              subtitle: 'Tap all that fit',
              items: [
                "Didn't sleep well",
                'Too much homework/assignments',
                'Overthinking things',
                'Social tiredness',
                'Too much phone/screen time',
                'No motivation',
                'Felt blank or low energy',
                'Other',
              ],
              otherKey: 'mainSelectionsOther',
            },
            { kind: 'single', key: 'flatWhen', title: 'When did the flat feeling happen?', options: ['Most of the day', 'Some parts of the day', 'Only a short time'] },
            { kind: 'single', key: 'flatFunNotFun', title: "What didn't feel fun today?", options: ['Games', 'Hanging with friends', 'School subjects', 'Reading', 'Nothing felt fun', 'Other'] },
            { kind: 'single', key: 'flatTiredWhere', title: 'Where did you feel tired?', options: ['Body', 'Head (hard to think)', 'Both', 'Not tired'] },
            { kind: 'single', key: 'flatWithOtherKids', title: 'How was it around other people?', options: ['Wanted to join', 'Stayed quiet / kept distance', 'Felt okay being alone'] },
            { kind: 'single', key: 'flatSleepLastNight', title: 'How was your sleep last night?', options: ['Good', 'Okay', 'Poor'] },
          ] satisfies Step[],
          closing: 'Low energy days are normal. Try: stand up, stretch, and take 3 slow breaths.',
        },
      },
      worried: {
        '6-10': {
          pageSubtitle: "Feeling worried? What's on your mind?",
          steps: [
            {
              kind: 'multi',
              key: 'mainSelections',
              title: "You chose 'worried'. What worried you today?",
              subtitle: 'Tap all that fit',
              items: ['School test/homework', 'Friends fight', 'Family things', 'Feel sick/tired', 'Night scared', 'Other'],
              otherKey: 'mainSelectionsOther',
            },
            { kind: 'single', key: 'worriedHowBig', title: 'How big was the worry?', options: ['A little', 'Medium', 'Very big'] },
            { kind: 'single', key: 'worriedWhen', title: 'When did you feel worried?', options: ['All day', 'Morning / school', 'Night', 'Sometimes'] },
            {
              kind: 'multi',
              key: 'worriedBodyFeel',
              title: 'How did your body feel?',
              subtitle: 'Tap all that fit',
              items: ['Heart fast', 'Tummy funny', 'Hard breathe', 'Hands shaky', 'Nothing', 'Other'],
              otherKey: 'worriedBodyFeelOther',
            },
            { kind: 'single', key: 'worriedMadeHard', title: 'What did worry make harder?', options: ['Schoolwork', 'Talking to friends', 'Play / free time', 'Nothing'] },
            { kind: 'single', key: 'worriedYouDid', title: 'When you felt worried, you…', options: ['Told someone', 'Kept it to myself'] },
          ] satisfies Step[],
          closing: 'Thanks for sharing. Try this: breathe in 1-2-3, breathe out 1-2-3-4. Do it 3 times.',
          coping: ['🎧 5-minute breathing exercise (guided audio)', '📝 Brain dump (free-form journaling space)', '🚶 Quick walk (activity suggestion)'],
        },
        '11-17': {
          pageSubtitle: "Feeling worried? What's on your mind?",
          steps: [
            {
              kind: 'multi',
              key: 'mainSelections',
              title: "You chose 'worried'. What made you worried today?",
              subtitle: 'Tap all that fit',
              items: ['Exams/tests/deadlines', 'Friends/social issues', 'Family matters', 'Health/feeling unwell', 'Sleep problems', 'Future worries', 'Social media pressure', 'Other'],
              otherKey: 'mainSelectionsOther',
            },
            { kind: 'single', key: 'worriedHowBig', title: 'How big was the worry?', options: ['Small', 'Medium', 'Very big'] },
            { kind: 'single', key: 'worriedWhen', title: 'When did you feel worried?', options: ['All day', 'Morning / school', 'Night', 'Sometimes'] },
            {
              kind: 'multi',
              key: 'worriedBodyFeel',
              title: 'How did your body feel?',
              subtitle: 'Tap all that fit',
              items: ['Heart fast', 'Tummy funny', 'Hard breathe', 'Hands shaky', 'Nothing', 'sweaty', 'Other'],
              otherKey: 'worriedBodyFeelOther',
            },
            { kind: 'single', key: 'worriedMadeHard', title: 'What did worry make harder?', options: ['Schoolwork', 'Talking to others', 'Enjoying free time', 'Nothing'] },
            { kind: 'single', key: 'worriedYouDid', title: 'When you felt worried, you…', options: ['Talked to someone', 'Kept it inside'] },
          ] satisfies Step[],
          closing: 'Thanks for sharing. Try this: breathe in 1-2-3, breathe out 1-2-3-4. Do it 3 times.',
          coping: ['🎧 5-minute breathing exercise (guided audio)', '📝 Brain dump (free-form journaling space)', '🚶 Quick walk (activity suggestion)'],
        },
      },
      sad: {
        '6-10': {
          pageSubtitle: "Feeling sad? What's happening?",
          steps: [
            {
              kind: 'multi',
              key: 'mainSelections',
              title: "You chose 'sad'. What made you feel sad today?",
              subtitle: 'Tap all that fit',
              items: ['Wanted to cry', 'Games not fun', 'Very very tired', "Can't think at school", 'Feel bad about me', 'Miss someone', 'Feel alone', 'Other'],
              otherKey: 'mainSelectionsOther',
            },
            { kind: 'single', key: 'sadHowBig', title: 'How big was the sad feeling?', options: ['A little', 'Medium', 'Very big'] },
            { kind: 'single', key: 'sadWhen', title: 'When did you feel sad?', options: ['Only a short time', 'Sometimes', 'Most of the day'] },
            { kind: 'single', key: 'sadHardToEnjoy', title: 'Was it hard to enjoy things today?', options: ['No, still enjoyed things', 'A little hard', 'Very hard'] },
            { kind: 'single', key: 'sadWantToBe', title: 'What did you want most?', options: ['Be with friends', 'Be alone', 'Either was okay'] },
            { kind: 'single', key: 'sadHeadSaid', title: 'What did your head say?', options: ['I did bad', 'Nobody likes me', "I'm not good", 'Nothing', 'Other'] },
          ] satisfies Step[],
          closing: 'Thanks for telling the truth. Try: hand on heart, hug your arms, 3 slow breaths.',
        },
        '11-17': {
          pageSubtitle: "Feeling sad? What's happening?",
          steps: [
            {
              kind: 'multi',
              key: 'mainSelections',
              title: "You chose 'sad'. What made you feel sad today?",
              subtitle: 'Tap all that fit',
              items: ['Felt sad/wanted to cry', 'No fun in games/hobbies', 'Very tired/low energy', 'Hard to focus/concentrate', 'Felt bad about myself', 'Missed someone important', 'Felt alone/left out', 'Other serious reason'],
              otherKey: 'mainSelectionsOther',
            },
            { kind: 'single', key: 'sadHowBig', title: 'How big was the sad feeling?', options: ['A little', 'Medium', 'Very big'] },
            { kind: 'single', key: 'sadWhen', title: 'When did you feel sad?', options: ['Only a short time', 'Sometimes', 'Most of the day'] },
            { kind: 'single', key: 'sadHardToEnjoy', title: 'What was harder to enjoy?', options: ['Games / hobbies', 'Talking to people', 'Schoolwork', 'I still enjoyed things'] },
            { kind: 'single', key: 'sadWantToBe', title: 'When you felt sad, you wanted to…', options: ['Be with people', 'Be alone', 'Either was okay'] },
            { kind: 'single', key: 'sadHeadSaid', title: 'What did your thoughts say?', options: ['I did something wrong', 'Nobody likes me', "I'm not good enough", 'Nothing specific', 'Other'] },
          ] satisfies Step[],
          closing: 'Thanks for sharing. Try: hand on heart, hug your arms, 3 slow breaths.',
        },
      },
    } as const

    const group = ageGroup === '6-10' ? '6-10' : '11-17'
    const cfg = byFeeling[feeling][group]
    return cfg
  }, [ageGroup, feeling])

  const steps = flow.steps
  const current = steps[step]

  const canContinue = useMemo(() => {
    if (!current) return false
    const v = answers[current.key]
    if (current.kind === 'stars') return typeof v === 'number' && v > 0
    if (current.kind === 'single') return typeof v === 'string' && v.trim().length > 0
    if (current.kind === 'multi') return Array.isArray(v) ? v.length > 0 : false
    return false
  }, [answers, current])

  function setAnswer(key: keyof StudentCheckInAnswers, value: unknown) {
    setAnswers((a) => ({ ...a, [key]: value }))
  }

  function renderQuestion(title: string, subtitle?: string) {
    return (
      <div className="space-y-1">
        <div className="text-base font-extrabold leading-7 tracking-tight text-[rgb(var(--nefera-ink))] md:text-sm md:leading-6">{title}</div>
        {subtitle ? <div className="text-sm leading-6 text-[rgb(var(--nefera-muted))] md:text-sm md:leading-6">{subtitle}</div> : null}
      </div>
    )
  }

  function renderCurrent() {
    if (!current) return null
    if (current.kind === 'stars') {
      const v = (answers[current.key] as number | undefined) ?? 0
      return (
        <div className="space-y-5">
          {renderQuestion(current.title)}
          <div className="rounded-2xl border border-[rgb(var(--nefera-border))] bg-white p-4 shadow-none md:border-white/70 md:bg-white/70 md:p-5 md:shadow-lg md:shadow-black/5">
            <Stars value={v} onChange={(n) => setAnswer(current.key, n)} max={current.max} />
          </div>
        </div>
      )
    }
    if (current.kind === 'single') {
      const v = (answers[current.key] as string | undefined) ?? ''
      return (
        <div className="space-y-5">
          {renderQuestion(current.title, current.subtitle)}
          <div className="rounded-2xl border border-[rgb(var(--nefera-border))] bg-white p-2 shadow-none md:border-white/70 md:bg-white/70 md:p-3 md:shadow-lg md:shadow-black/5">
            <Tabs value={v} onChange={(nv) => setAnswer(current.key, nv)} tabs={current.options.map((o) => ({ value: o, label: o }))} />
          </div>
        </div>
      )
    }
    const selected = ((answers[current.key] as string[] | undefined) ?? []).filter(Boolean)
    const values = Object.fromEntries(current.items.map((it) => [it, selected.includes(it)])) as Record<string, boolean>
    return (
      <div className="space-y-5">
        {renderQuestion(current.title, current.subtitle)}
        <div className="space-y-3">
          {current.items.map((it) => (
            <label
              key={it}
              className="flex w-full items-start gap-3 rounded-2xl border border-[rgb(var(--nefera-border))] bg-white px-4 py-4 shadow-sm shadow-black/5 transition-colors md:hover:bg-white/85"
            >
              <input
                type="checkbox"
                checked={!!values[it]}
                onChange={(e) => {
                  const checked = e.target.checked
                  setAnswer(
                    current.key,
                    checked ? Array.from(new Set([...selected, it])) : selected.filter((x) => x !== it),
                  )
                }}
                className="mt-0.5 h-5 w-5 accent-[rgb(var(--nefera-brand))]"
              />
              <div className="text-[15px] font-semibold leading-6 text-[rgb(var(--nefera-ink))] md:text-sm md:leading-6">{it}</div>
            </label>
          ))}
        </div>
        {current.otherKey && selected.includes('Other') ? (
          <Input
            label="Other"
            value={String(answers[current.otherKey] ?? '')}
            onChange={(e) => setAnswer(current.otherKey!, e.target.value)}
          />
        ) : null}
      </div>
    )
  }

  function onSubmit() {
    const createdAt = new Date().toISOString()
    const now = Date.now()
    const todayKey = createdAt.slice(0, 10)

    dispatch({
      type: 'student/addCheckIn',
      checkIn: { id: makeId('chk'), createdAt, studentId, feeling, ageGroup, answers },
    })

    const lines: string[] = []
    for (const s of steps) {
      const v = answers[s.key]
      if (s.kind === 'stars') {
        const n = typeof v === 'number' ? v : 0
        if (n > 0) lines.push(`${s.title}: ${n}/${s.max}`)
        continue
      }
      if (s.kind === 'single') {
        const t = typeof v === 'string' ? v.trim() : ''
        if (t) lines.push(`${s.title}: ${t}`)
        continue
      }

      const raw = Array.isArray(v) ? v.filter((x) => typeof x === 'string').map((x) => String(x).trim()).filter(Boolean) : []
      if (!raw.length) continue

      const resolved =
        s.otherKey && raw.includes('Other')
          ? [
              ...raw.filter((x) => x !== 'Other'),
              String(answers[s.otherKey] ?? '').trim() || 'Other',
            ].filter(Boolean)
          : raw

      if (resolved.length) lines.push(`${s.title}: ${resolved.join(', ')}`)
    }

    dispatch({
      type: 'student/addJournal',
      payload: {
        id: makeId('jrnl'),
        title: `${feelingEmoji(feeling)} ${feelingLabel(feeling)}`,
        content: lines.join('\n'),
        createdAt: now,
        dateKey: todayKey,
      },
    })

    const shouldCoping = state.schoolConfig.features.copingTools && (feeling === 'worried' || feeling === 'sad')
    navigate(shouldCoping ? `/student/coping?feeling=${encodeURIComponent(feeling)}` : '/student/sleep', { replace: true })
  }

  return (
    <Page emoji={feelingEmoji(feeling)} title={`${feelingLabel(feeling)} check-in`} subtitle={flow.pageSubtitle}>
      <div className="space-y-4">
        <StepperHeader
          title={`Question ${step + 1}`}
          subtitle={current?.title}
          step={step + 1}
          total={steps.length}
          left={
            <FeelingButton
              disabled
              selected
              emoji={feelingEmoji(feeling)}
              label={feelingLabel(feeling)}
              color={feelingPalette[feeling].color}
              background={feelingPalette[feeling].bg}
              borderColor={feelingPalette[feeling].border}
              ringColor={feelingPalette[feeling].ring}
              className="h-12 w-12"
            />
          }
        />

        <Card key={String(current?.key ?? step)} className="animate-[nefera-fade-up_220ms_ease-out]">
          <CardBody className="space-y-4">
            {renderCurrent()}
            <Divider />
            <div className="hidden items-center justify-between gap-2 md:flex">
              <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
                Back
              </Button>
              {step < steps.length - 1 ? (
                <Button disabled={!canContinue} onClick={() => setStep((s) => s + 1)}>
                  Next
                </Button>
              ) : (
                <Button disabled={!canContinue} onClick={onSubmit}>
                  Submit
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 md:hidden">
        <div className="mx-auto w-full max-w-[480px] px-3">
          <div className="border-t border-[rgb(var(--nefera-border))] bg-white px-3 py-3">
            <div className="grid grid-cols-2 gap-2">
              <Button className="h-14 w-full" variant="secondary" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
                Back
              </Button>
              {step < steps.length - 1 ? (
                <Button className="h-14 w-full" disabled={!canContinue} onClick={() => setStep((s) => s + 1)}>
                  Next
                </Button>
              ) : (
                <Button className="h-14 w-full" disabled={!canContinue} onClick={onSubmit}>
                  Submit
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Page>
  )
}

function StudentCopingTools() {
  const { state } = useNefera()
  const navigate = useNavigate()
  const [search] = useSearchParams()
  const [toast, setToast] = useState<{ open: boolean; message: string }>({ open: false, message: '' })
  const feeling = (search.get('feeling') as Feeling | null) ?? 'worried'

  useEffect(() => {
    if (!state.schoolConfig.features.copingTools) return
    const t = window.setTimeout(() => navigate('/student/sleep', { replace: true }), 12000)
    return () => window.clearTimeout(t)
  }, [navigate, state.schoolConfig.features.copingTools])

  if (!state.schoolConfig.features.copingTools) return <Navigate to="/student/sleep" replace />

  const suggestions =
    feeling === 'sad'
      ? [
          { title: 'Grounding', body: 'Name 3 things you see, 2 you can touch, 1 you can hear.' },
          { title: 'Tiny step', body: 'Pick one small task (2 minutes). Start, then stop.' },
          { title: 'Reach out', body: 'Message a trusted adult if you feel unsafe or overwhelmed.' },
        ]
      : [
          { title: 'Breathing', body: 'In 1-2-3, out 1-2-3-4. Repeat 5 times.' },
          { title: 'Body reset', body: 'Drop your shoulders, unclench your jaw, relax your hands.' },
          { title: 'Name the worry', body: 'Write one sentence: “I’m worried about ___.”' },
        ]

  return (
    <Page emoji="🌿" title="Coping tools" subtitle="A small reset before the next step.">
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {suggestions.map((s) => (
            <Card key={s.title} className="transition hover:bg-black/5">
              <CardHeader emoji="✨" title={s.title} subtitle="Try this once." />
              <CardBody className="space-y-4">
                <div className="text-sm leading-6 text-[rgb(var(--nefera-muted))]">{s.body}</div>
                <Divider />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setToast({ open: true, message: `Saved: ${s.title}` })
                    window.setTimeout(() => navigate('/student/sleep', { replace: true }), 800)
                  }}
                >
                  I tried this
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
        <Card>
          <CardBody className="flex justify-end">
            <Button onClick={() => navigate('/student/sleep', { replace: true })}>Continue to sleep tracker 🌙</Button>
          </CardBody>
        </Card>
      </div>
      <Toast open={toast.open} message={toast.message} onClose={() => setToast({ open: false, message: '' })} />
    </Page>
  )
}

function StudentSleepTracker() {
  const { state, dispatch } = useNefera()
  const navigate = useNavigate()
  const [bucket, setBucket] = useState<SleepHoursBucket | ''>('')
  const [toast, setToast] = useState(false)
  const studentId = state.parent.children[0]?.id ?? state.teacher.students[0]?.id ?? 'stu_1'

  function onSave() {
    if (!bucket) return
    dispatch({ type: 'student/addSleepLog', log: { id: makeId('sleep'), createdAt: new Date().toISOString(), studentId, hoursBucket: bucket } })
    setToast(true)
    window.setTimeout(() => navigate('/student/dashboard', { replace: true }), 250)
  }

  return (
    <Page emoji="🌙" title="Sleep tracker" subtitle="How was your sleep last night?">
      <div className="space-y-4">
        <Card>
          <CardBody className="space-y-4">
            <Section title='Question' subtitle='"How was your sleep last night?"' />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {([
                { label: '1–4 hours', value: '1-4' },
                { label: '5 hours', value: '5' },
                { label: '6 hours', value: '6' },
                { label: '7 hours', value: '7' },
                { label: '8+ hours', value: '8+' },
              ] as const).map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setBucket(o.value)}
                  className={cx(
                    'grid h-16 w-full place-items-center rounded-full border border-[rgb(var(--nefera-border))] bg-white text-sm font-extrabold text-[rgb(var(--nefera-ink))] shadow-none transition-all duration-200 ease-out active:translate-y-0 md:border-white/70 md:bg-white/70 md:shadow-lg md:shadow-black/5 md:hover:-translate-y-0.5 md:hover:bg-white/85 md:hover:shadow-xl md:hover:shadow-black/10',
                    bucket === o.value ? 'ring-4 ring-[rgba(98,110,255,0.22)]' : '',
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <Divider />
            <div className="hidden justify-end md:flex">
              <Button disabled={!bucket} onClick={onSave}>
                Submit
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 md:hidden">
        <div className="mx-auto w-full max-w-[480px] px-3">
          <div className="border-t border-[rgb(var(--nefera-border))] bg-white px-3 py-3">
            <div className="grid gap-2">
              <Button className="h-14 w-full" disabled={!bucket} onClick={onSave}>
                Submit
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Toast open={toast} message="Sleep logged." onClose={() => setToast(false)} />
    </Page>
  )
}

function formatShort(value: string | number) {
  const d = new Date(value)
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function uniqueDates(isoList: string[]) {
  return Array.from(new Set(isoList)).sort().reverse()
}

function streakFromISODateList(isoDates: string[]) {
  const uniq = uniqueDates(isoDates)
  if (uniq.length === 0) return 0
  let streak = 0
  const start = new Date(getTodayISO())
  for (let i = 0; i < 366; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    if (uniq.includes(key)) streak++
    else break
  }
  return streak
}

function lastDaysISO(count: number) {
  const base = new Date(getTodayISO())
  const days: string[] = []
  for (let i = 0; i < count; i++) {
    const d = new Date(base)
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

function latestCheckInByDay(checkIns: StudentCheckIn[]) {
  const map = new Map<string, StudentCheckIn>()
  for (const c of checkIns) {
    const day = c.createdAt.slice(0, 10)
    const prev = map.get(day)
    if (!prev || prev.createdAt < c.createdAt) map.set(day, c)
  }
  return map
}

function collectAnswerText(answers: StudentCheckInAnswers) {
  const out: string[] = []
  for (const [, v] of Object.entries(answers)) {
    if (typeof v === 'string') {
      const t = v.trim()
      if (t) out.push(t)
    } else if (Array.isArray(v) && v.every((x) => typeof x === 'string')) {
      for (const s of v) {
        const t = s.trim()
        if (t) out.push(t)
      }
    }
  }
  return out
}

function wellbeingThemeCounts(checkIns: StudentCheckIn[]) {
  const counts: Record<string, number> = {}
  function bump(k: string) {
    counts[k] = (counts[k] ?? 0) + 1
  }

  function themesForText(text: string) {
    const v = text.toLowerCase()
    const themes: string[] = []
    if (/(self[-\s]?harm|suicide|kill myself|die|cutting|overdose)/.test(v)) themes.push('Self-harm/Suicide')
    if (/(bully|bullying|harass|harassment|threat|assault)/.test(v)) themes.push('Bullying/Safety')
    if (/(exam|test|homework|assignment|deadline|grade|school work|schoolwork|study)/.test(v)) themes.push('Studies')
    if (/(sleep|tired|energy|bed|wake|insomnia|nightmare)/.test(v)) themes.push('Sleep')
    if (/(friend|social|classmate|left out|alone|group|relationship)/.test(v)) themes.push('Social')
    if (/(family|mom|dad|parent|guardian|home)/.test(v)) themes.push('Family')
    if (/(sick|ill|pain|headache|stomach|tummy)/.test(v)) themes.push('Health')
    return themes.length ? themes : ['Other']
  }

  for (const c of checkIns) {
    const texts = collectAnswerText(c.answers)
    for (const t of texts) {
      for (const theme of themesForText(t)) bump(theme)
    }
  }
  return counts
}

function wellbeingSignals(checkIns: StudentCheckIn[], sleepLogs: { createdAt: string; hoursBucket?: SleepHoursBucket }[]) {
  const last7 = lastDaysISO(7)
  const byDay = latestCheckInByDay(checkIns)
  const last7CheckIns = last7.map((d) => byDay.get(d)).filter(Boolean) as StudentCheckIn[]
  const counts = wellbeingThemeCounts(last7CheckIns)
  const themes = Object.entries(counts)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([k, v]): { label: string; tone: 'neutral' | 'warn' | 'danger' } => ({
      label: `${k} (${v})`,
      tone: k === 'Self-harm/Suicide' ? 'danger' : k === 'Bullying/Safety' ? 'danger' : v >= 3 ? 'warn' : 'neutral',
    }))

  const negativeDays = last7CheckIns.filter((c) => c.feeling === 'sad' || c.feeling === 'worried').length
  const lowSleepDays = sleepLogs.filter((s) => last7.includes(s.createdAt.slice(0, 10)) && (s.hoursBucket === '1-4' || s.hoursBucket === '5')).length

  const patterns = [
    negativeDays >= 3 ? { label: `Repeated worried/sad days (${negativeDays}/7)`, tone: negativeDays >= 5 ? 'danger' : 'warn' } : null,
    lowSleepDays >= 2 ? { label: `Low sleep days (${lowSleepDays}/7)`, tone: lowSleepDays >= 4 ? 'danger' : 'warn' } : null,
  ].filter(Boolean) as Array<{ label: string; tone: 'neutral' | 'warn' | 'danger' }>

  return { themes, patterns }
}

function StudentJournalWrite() {
  const { dispatch } = useNefera()
  const navigate = useNavigate()
  const [content, setContent] = useState('')
  const [toast, setToast] = useState<{ open: boolean; message: string; tone?: 'ok' | 'warn' }>({ open: false, message: '' })

  const canSave = !!content.trim()

  function onSave() {
    const now = Date.now()
    const trimmed = content.trim()
    if (!trimmed) return
    const firstLine = trimmed.split('\n')[0]?.trim() ?? ''
    const title = (firstLine || 'Journal').slice(0, 56)
    const dateKey = new Date().toISOString().slice(0, 10)
    dispatch({
      type: 'student/addJournal',
      payload: { id: makeId('jrnl'), title, content: trimmed, createdAt: now, dateKey },
    })
    setToast({ open: true, message: 'Saved.' })
    setContent('')
    navigate('/student/journal/history', { replace: true })
  }

  return (
    <Page emoji="📝" title="Journal">
      <div className="space-y-4">
        <Card className="overflow-hidden">
          <CardBody className="space-y-7 px-4 py-6 md:space-y-5 md:px-6 md:py-6">
            <div className="pt-2 md:pt-0" />
            <TextArea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="py-2"
              inputClassName="min-h-[66vh] px-4 py-4 text-[16px] leading-8 shadow-inner shadow-black/5 md:min-h-[54vh] md:text-base md:leading-7"
            />
            <div className="pb-2 md:pb-0" />
            <div className="hidden flex-wrap items-center justify-end gap-2 pt-1 md:flex">
              <Button variant="ghost" onClick={() => navigate('/student/dashboard')}>
                Cancel
              </Button>
              <Button disabled={!canSave} onClick={onSave}>
                Save
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 md:hidden">
        <div className="mx-auto w-full max-w-[480px] px-3">
          <div className="border-t border-[rgb(var(--nefera-border))] bg-white px-3 py-3">
            <div className="grid grid-cols-2 gap-2">
              <Button className="h-14 w-full" variant="secondary" onClick={() => navigate('/student/dashboard')}>
                Cancel
              </Button>
              <Button className="h-14 w-full" disabled={!canSave} onClick={onSave}>
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Toast open={toast.open} tone={toast.tone} message={toast.message} onClose={() => setToast({ open: false, message: '' })} />
    </Page>
  )
}

function StudentJournalPast() {
  const { state } = useNefera()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const weeks = useMemo(() => {
    const entries = [...state.student.journal].sort((a, b) => b.createdAt - a.createdAt)

    const weekStart = (dateKey: string) => {
      const d = new Date(`${dateKey}T00:00:00`)
      const dow = d.getDay()
      const sinceMonday = (dow + 6) % 7
      d.setDate(d.getDate() - sinceMonday)
      return d.toISOString().slice(0, 10)
    }

    const byWeek = new Map<string, Map<string, typeof entries>>()
    for (const e of entries) {
      const wk = weekStart(e.dateKey)
      const existingWeek = byWeek.get(wk) ?? new Map<string, typeof entries>()
      const dayEntries = existingWeek.get(e.dateKey) ?? []
      dayEntries.push(e)
      existingWeek.set(e.dateKey, dayEntries)
      byWeek.set(wk, existingWeek)
    }

    const sortedWeeks = Array.from(byWeek.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([weekKey, dayMap]) => {
        const days = Array.from(dayMap.entries())
          .sort((a, b) => (a[0] < b[0] ? 1 : -1))
          .map(([dateKey, dayEntries]) => ({
            dateKey,
            entries: dayEntries.sort((a, b) => b.createdAt - a.createdAt),
          }))
        return { weekKey, days }
      })

    return sortedWeeks
  }, [state.student.journal])

  const formatDayLabel = (dateKey: string) => {
    const d = new Date(`${dateKey}T00:00:00`)
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const previewText = (body: string) => {
    const raw = String(body ?? '').trim()
    if (!raw) return ''
    const lines = raw.split('\n').slice(0, 2)
    const joined = lines.join('\n').trim()
    return joined.length > 140 ? `${joined.slice(0, 140).trimEnd()}…` : joined
  }

  return (
    <Page emoji="🗓️" title="Past entries">
      <div className="grid gap-4">
        {state.student.journal.length === 0 ? (
          <Card>
            <CardHeader emoji="📝" title="No entries yet" subtitle="Start with one honest sentence. It counts." />
            <CardBody className="space-y-4">
              <div className="text-sm leading-6 text-[rgb(var(--nefera-muted))]">
                Your journal is for you. Write messy. Write small. You can always come back.
              </div>
              <Link to="/student/journal/write">
                <Button>Write your first entry</Button>
              </Link>
            </CardBody>
          </Card>
        ) : null}
        {weeks.map((w) => (
          <div key={w.weekKey} className="space-y-4">
            <div className="px-1 text-sm font-extrabold tracking-tight text-[rgb(var(--nefera-ink))]">Week of {formatDayLabel(w.weekKey)}</div>
            {w.days.map((d) => (
              <Card key={d.dateKey}>
                <CardBody className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-extrabold text-[rgb(var(--nefera-ink))]">{formatDayLabel(d.dateKey)}</div>
                    <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))]">
                      {d.entries.length} entr{d.entries.length === 1 ? 'y' : 'ies'}
                    </div>
                  </div>
                  <div className="grid gap-3">
                    {d.entries.map((e) => {
                      const open = !!expanded[e.id]
                      const preview = previewText(e.content)
                      return (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => setExpanded((m) => ({ ...m, [e.id]: !m[e.id] }))}
                          className={cx(
                            'w-full min-h-14 rounded-2xl border border-[rgb(var(--nefera-border))] bg-white px-4 py-4 text-left shadow-none transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/85 hover:shadow-xl active:translate-y-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(98,110,255,0.18)] focus-visible:ring-offset-2 focus-visible:ring-offset-white',
                            open ? 'ring-4 ring-[rgba(98,110,255,0.18)]' : '',
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))]">{formatShort(e.createdAt)}</div>
                            {e.updatedAt ? <Badge>Edited</Badge> : null}
                          </div>
                          <div className="mt-2 text-[15px] leading-7 text-[rgb(var(--nefera-muted))] whitespace-pre-wrap md:text-sm md:leading-6">
                            {open ? e.content : preview}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        ))}
      </div>
    </Page>
  )
}

function StudentGratitude() {
  const { state, dispatch } = useNefera()
  const navigate = useNavigate()
  const [items, setItems] = useState(Array.from({ length: 5 }, () => ''))
  const [toast, setToast] = useState(false)

  const canSave = !items.every((x) => !x.trim())

  function onSave() {
    const content = items
      .filter((x) => x.trim())
      .map((x) => `• ${x.trim()}`)
      .join('\n')
    const todayKey = new Date().toISOString().split('T')[0]
    const todaysEntry = state.student.journal.find((j) => j.dateKey === todayKey)
    const now = Date.now()
    const nextTitle = todaysEntry?.title || 'Gratitude'
    const nextContent = todaysEntry?.content
      ? `${todaysEntry.content.trimEnd()}\n\nGratitude\n${content}`
      : `Gratitude\n${content}`

    if (todaysEntry) {
      dispatch({
        type: 'student/updateJournal',
        payload: { id: todaysEntry.id, title: nextTitle, content: nextContent, updatedAt: now },
      })
    } else {
      dispatch({
        type: 'student/addJournal',
        payload: { id: makeId('jrnl'), title: nextTitle, content: nextContent, createdAt: now, dateKey: todayKey },
      })
    }
    setToast(true)
  }

  return (
    <Page title="Gratitude journal" subtitle="Five small things count. Even tiny ones.">
      <Card>
        <CardBody className="space-y-3">
          {items.map((v, i) => (
            <Input
              key={i}
              label={`Grateful for #${i + 1}`}
              value={v}
              onChange={(e) => setItems((arr) => arr.map((x, idx) => (idx === i ? e.target.value : x)))}
            />
          ))}
          <div className="hidden justify-end pt-2 md:flex">
            <Button disabled={!canSave} onClick={onSave}>
              Save gratitude
            </Button>
          </div>
        </CardBody>
      </Card>
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 md:hidden">
        <div className="mx-auto w-full max-w-[480px] px-3">
          <div className="border-t border-[rgb(var(--nefera-border))] bg-white px-3 py-3">
            <div className="grid grid-cols-2 gap-2">
              <Button className="h-14 w-full" variant="secondary" onClick={() => navigate('/student/dashboard', { replace: true })}>
                Close
              </Button>
              <Button className="h-14 w-full" disabled={!canSave} onClick={onSave}>
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Toast open={toast} message="Saved. Your brain loves this." onClose={() => setToast(false)} />
    </Page>
  )
}

function StudentHabits() {
  const { state, dispatch } = useNefera()
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🌿')
  const [toast, setToast] = useState(false)
  const [celebrate, setCelebrate] = useState(false)
  const today = getTodayISO()
  const habitCount = state.student.habits.length
  const doneToday = state.student.habits.filter((h) => h.completedDates.includes(today)).length
  const bestStreak = state.student.habits.length ? Math.max(...state.student.habits.map((h) => streakFromISODateList(h.completedDates))) : 0
  return (
    <Page emoji="🔥" title="Habit planner" subtitle="Build tiny routines. Track streaks without pressure.">
      <div className="grid gap-3 md:grid-cols-3">
        <StatPill emoji="📌" label="Habits" value={`${habitCount}`} />
        <StatPill emoji="✅" label="Done today" value={habitCount ? `${doneToday}/${habitCount}` : '0'} />
        <StatPill emoji="🔥" label="Best streak" value={`${bestStreak} days`} />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader emoji="✅" title="Your habits" subtitle="Tap to mark done today." />
          <CardBody className="space-y-3">
            {state.student.habits.length === 0 ? (
              <div className="rounded-2xl border border-white/70 bg-white/60 p-6 text-center shadow-lg shadow-black/5">
                <div className="text-3xl">🌿</div>
                <div className="mt-2 text-sm font-extrabold text-[rgb(var(--nefera-ink))]">No habits yet</div>
                <div className="mt-1 text-sm leading-6 text-[rgb(var(--nefera-muted))]">
                  Pick one tiny routine you can do on a busy day.
                </div>
                <div className="mt-4 flex justify-center">
                  <Button
                    onClick={() => {
                      document.getElementById('add-habit')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }}
                  >
                    Add your first habit
                  </Button>
                </div>
              </div>
            ) : null}
            {state.student.habits.map((h) => {
              const done = h.completedDates.includes(today)
              const streak = streakFromISODateList(h.completedDates)
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => dispatch({ type: 'student/toggleHabitToday', habitId: h.id, isoDate: today })}
                  className={cx(
                    'w-full rounded-3xl border border-white/70 bg-white/55 p-5 text-left shadow-lg shadow-black/5 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/80 hover:shadow-xl active:translate-y-0 active:scale-[0.99]',
                    done ? 'ring-4 ring-[rgba(34,197,94,0.10)]' : '',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-3xl bg-black/5 text-2xl">{h.emoji}</div>
                    <div className="min-w-0">
                      <div className="text-sm font-extrabold text-[rgb(var(--nefera-ink))]">{h.name}</div>
                      <div className="mt-1 text-xs font-semibold text-[rgb(var(--nefera-muted))]">Streak: {streak} 🔥</div>
                    </div>
                    <div className="ml-auto text-xl">{done ? '✅' : '⬜'}</div>
                  </div>
                </button>
              )
            })}
          </CardBody>
        </Card>
        <Card id="add-habit">
          <CardHeader emoji="➕" title="Add a habit" subtitle="Keep it small and kind." />
          <CardBody className="space-y-3">
            <Input
              label="Habit name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              hint="Make it so easy you can do it on a hard day."
            />
            <Input label="Emoji" value={emoji} onChange={(e) => setEmoji(e.target.value)} hint="Pick a tiny symbol that feels good to see." />
            <div className="pt-1 flex justify-end">
              <Button
                className={cx('relative overflow-visible', celebrate ? 'animate-[nefera-pop_240ms_ease-out]' : '')}
                disabled={!name.trim()}
                onClick={() => {
                  dispatch({
                    type: 'student/addHabit',
                    habit: { id: makeId('hab'), name: name.trim(), emoji: (emoji.trim() || '🌿').slice(0, 2), createdAt: new Date().toISOString(), completedDates: [] },
                  })
                  setName('')
                  setEmoji('🌿')
                  setToast(true)
                  setCelebrate(true)
                  window.setTimeout(() => setCelebrate(false), 700)
                }}
              >
                <span>Add</span>
                {celebrate ? (
                  <span className="pointer-events-none absolute -right-1.5 -top-1.5 grid h-7 w-7 place-items-center rounded-full border border-white/70 bg-white/90 shadow-lg shadow-black/10 animate-[nefera-sparkle_700ms_ease-out]">
                    <img src={logo} alt="Nefera Logo" className="h-4 w-auto object-contain" />
                  </span>
                ) : null}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
      <Toast open={toast} message="Habit added. Tiny wins count." onClose={() => setToast(false)} />
    </Page>
  )
}

function StudentSoulSpace() {
  const [search, setSearch] = useSearchParams()
  const initial = (search.get('tab') ?? 'meditation') as 'meditation' | 'breathing' | 'yoga' | 'grounding'
  const [active, setActive] = useState(initial)
  const [open, setOpen] = useState<null | { title: string; emoji: string; seconds: number; description: string }>(null)
  const { reset, running, secondsLeft, setRunning } = useCountdown(open?.seconds ?? 60)

  const list = useMemo(() => {
    if (active === 'meditation')
      return [
        { title: 'Soft landing', emoji: '🫧', seconds: 120, description: 'Notice your breath. Let your shoulders drop.' },
        { title: 'Body scan', emoji: '🧘', seconds: 180, description: 'Scan from head to toes, without judgement.' },
        { title: 'Gratitude pause', emoji: '🌿', seconds: 90, description: 'Think of one small thing that helped today.' },
      ]
    if (active === 'breathing')
      return [
        { title: 'Box breathing', emoji: '⬛', seconds: 120, description: 'In 4, hold 4, out 4, hold 4.' },
        { title: '4-7-8', emoji: '🌬️', seconds: 120, description: 'In 4, hold 7, out 8. Slow and gentle.' },
        { title: 'Sigh reset', emoji: '😮‍💨', seconds: 60, description: 'Two small inhales, long exhale. Repeat.' },
      ]
    if (active === 'yoga')
      return [
        { title: 'Stretch & reach', emoji: '🧎', seconds: 180, description: 'Gentle neck, shoulders, and spine.' },
        { title: 'Calm flow', emoji: '🧘‍♀️', seconds: 240, description: 'Cat-cow + child pose + forward fold.' },
        { title: 'Reset posture', emoji: '🪑', seconds: 120, description: 'Sit tall, open chest, relax jaw.' },
      ]
    return [
      { title: '5-4-3-2-1 senses', emoji: '🖐️', seconds: 120, description: 'Name 5 things you see... 1 thing you feel.' },
      { title: 'Walk check', emoji: '🚶', seconds: 180, description: 'Slow walk. Notice feet, sounds, and air.' },
      { title: 'Water break', emoji: '💧', seconds: 60, description: 'Sip water slowly. Feel it cool your body.' },
    ]
  }, [active])

  useEffect(() => {
    setSearch((p) => {
      p.set('tab', active)
      return p
    })
  }, [active, setSearch])

  useEffect(() => {
    if (!open) return
    reset(open.seconds)
    setRunning(true)
  }, [open, reset, setRunning])

  return (
    <Page emoji="🌿" title="Soul Space" subtitle="A calm menu for your nervous system.">
      <Tabs
        value={active}
        onChange={(v) => setActive(v as typeof active)}
        tabs={[
          { value: 'meditation', label: 'Meditation', emoji: '🫧' },
          { value: 'breathing', label: 'Breathing', emoji: '🌬️' },
          { value: 'yoga', label: 'Yoga', emoji: '🧘' },
          { value: 'grounding', label: 'Grounding', emoji: '🖐️' },
        ]}
      />
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {list.map((x) => {
          const mins = Math.max(1, Math.round(x.seconds / 60))
          return (
            <Card
              key={x.title}
              className="transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/80 hover:shadow-xl active:translate-y-0 active:scale-[0.99]"
            >
              <CardBody className="flex items-start gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-3xl bg-[rgba(62,197,200,0.14)] text-2xl">{x.emoji}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm font-extrabold text-[rgb(var(--nefera-ink))]">{x.title}</div>
                    <Badge>{mins} min</Badge>
                  </div>
                  <div className="mt-1 text-sm text-[rgb(var(--nefera-muted))]">{x.description}</div>
                  <div className="mt-3">
                    <Button size="sm" variant="secondary" onClick={() => setOpen(x)}>
                      Start
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          )
        })}
      </div>

      <Modal
        open={!!open}
        onClose={() => {
          setOpen(null)
          setRunning(false)
        }}
        title={open ? `${open.emoji} ${open.title}` : 'Exercise'}
        description="Follow along gently. If your body says stop, stop."
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setOpen(null)
                setRunning(false)
              }}
            >
              Close
            </Button>
            <Button variant="secondary" onClick={() => setRunning(!running)}>
              {running ? 'Pause' : 'Resume'}
            </Button>
          </>
        }
      >
        {open ? (
          <div className="space-y-3">
            <div className="rounded-3xl border border-[rgb(var(--nefera-border))] bg-white p-4 text-sm text-[rgb(var(--nefera-muted))]">{open.description}</div>
            <div className="rounded-3xl border border-[rgb(var(--nefera-border))] bg-white p-4">
              <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))]">Timer</div>
              <div className="mt-1 text-3xl font-extrabold text-[rgb(var(--nefera-ink))]">
                {String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:{String(secondsLeft % 60).padStart(2, '0')}
              </div>
              <div className="mt-2">
                <ProgressBar value={open.seconds > 0 ? (1 - secondsLeft / open.seconds) * 100 : 0} />
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </Page>
  )
}

function StudentAICompanion() {
  const { user } = useAuth()
  const [text, setText] = useState('')
  const [messages, setMessages] = useState<Array<{ id: string; from: 'me' | 'ai'; body: string }>>([
    { id: 'a1', from: 'ai', body: `Hi ${user?.name ?? 'there'} 👋 Want to talk about your day?` },
    { id: 'a2', from: 'ai', body: 'You can share one small thing that felt hard — or one tiny win.' },
  ])
  function reply() {
    const hints = [
      'That makes sense. Where do you feel it in your body?',
      'If your best friend felt this way, what would you tell them?',
      'What’s one small step that could make tomorrow 1% easier?',
      'Do you want a quick breathing tool or a journaling prompt?',
    ]
    return hints[Math.floor(Math.random() * hints.length)]
  }
  return (
    <Page
      emoji="🤖"
      title="AI Companion"
      subtitle="A private, guided chat with supportive prompts to help you reflect."
    >
      <Card className="overflow-hidden">
        <div className="max-h-[56vh] overflow-auto p-5">
          <div className="space-y-3">
            {messages.map((m) => (
              <div key={m.id} className={cx('flex', m.from === 'me' ? 'justify-end' : 'justify-start')}>
                <div
                  className={cx(
                    'max-w-[85%] rounded-3xl px-4 py-3 text-sm',
                    m.from === 'me'
                      ? 'bg-[rgb(var(--nefera-brand))] text-white'
                      : 'border border-[rgb(var(--nefera-border))] bg-white text-[rgb(var(--nefera-ink))]',
                  )}
                >
                  {m.body}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-[rgb(var(--nefera-border))] bg-[rgba(255,255,255,0.7)] p-3 backdrop-blur">
          <div className="flex items-end gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-11 flex-1 resize-none rounded-2xl border border-[rgb(var(--nefera-border))] bg-white px-4 py-3 text-sm outline-none ring-[rgba(98,110,255,0.22)] focus:ring-4"
            />
            <Button
              disabled={!text.trim()}
              onClick={() => {
                const input = text.trim()
                setText('')
                setMessages((m) => [...m, { id: makeId('me'), from: 'me', body: input }, { id: makeId('ai'), from: 'ai', body: reply() }])
              }}
            >
              Send
            </Button>
          </div>
        </div>
      </Card>
    </Page>
  )
}

function StudentGroups() {
  const { state, dispatch } = useNefera()
  return (
    <Page emoji="🤝" title="Support groups" subtitle="Join a circle. Leave anytime. No judgement.">
      <div className="grid gap-3 md:grid-cols-2">
        {state.student.groups.map((g) => (
          <Card key={g.id} className="transition hover:bg-black/5">
            <CardBody className="flex items-start gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-3xl bg-black/5 text-2xl">{g.emoji}</div>
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-[rgb(var(--nefera-ink))]">{g.name}</div>
                <div className="mt-1 text-sm text-[rgb(var(--nefera-muted))]">Safe prompts, gentle peer support, and optional activities.</div>
                <div className="mt-3">
                  <Button size="sm" variant={g.joined ? 'ghost' : 'secondary'} onClick={() => dispatch({ type: 'student/toggleGroup', groupId: g.id })}>
                    {g.joined ? 'Leave' : 'Join'}
                  </Button>
                </div>
              </div>
              {g.joined ? <Badge tone="ok">Joined</Badge> : <Badge>Open</Badge>}
            </CardBody>
          </Card>
        ))}
      </div>
    </Page>
  )
}

function StudentInbox() {
  const { state, dispatch } = useNefera()
  const [openId, setOpenId] = useState<string | null>(null)
  const studentId = state.parent.children[0]?.id ?? state.teacher.students[0]?.id ?? 'stu_1'
  const visible = state.student.inbox.filter((m) => !m.toStudentId || m.toStudentId === studentId)
  const msg = visible.find((m) => m.id === openId) ?? null
  const unread = visible.filter((m) => !m.readAt).length
  return (
    <Page emoji="📥" title="Inbox" subtitle={`${unread} unread message${unread === 1 ? '' : 's'}.`}>
      <div className="grid gap-3">
        {visible.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              setOpenId(m.id)
              dispatch({ type: 'student/markMessageRead', messageId: m.id })
            }}
            className="text-left"
          >
            <Card className={cx('transition hover:bg-black/5', m.readAt ? 'opacity-90' : '')}>
              <CardBody className="space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 truncate text-sm font-extrabold text-[rgb(var(--nefera-ink))]">{m.subject}</div>
                  {!m.readAt ? <Badge tone="ok">New</Badge> : <Badge>Read</Badge>}
                </div>
                <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))]">
                  {m.fromName} • {formatShort(m.createdAt)}
                </div>
                <div className="text-sm text-[rgb(var(--nefera-muted))]">{m.body}</div>
              </CardBody>
            </Card>
          </button>
        ))}
      </div>
      <Modal
        open={!!msg}
        onClose={() => setOpenId(null)}
        title={msg?.subject ?? 'Message'}
        description={msg ? `${msg.fromName} • ${formatShort(msg.createdAt)}` : undefined}
        footer={
          <Button variant="ghost" onClick={() => setOpenId(null)}>
            Close
          </Button>
        }
      >
        <div className="rounded-3xl border border-[rgb(var(--nefera-border))] bg-white p-4 text-sm text-[rgb(var(--nefera-ink))] whitespace-pre-wrap">
          {msg?.body}
        </div>
      </Modal>
    </Page>
  )
}

function TeacherInbox() {
  const { state, dispatch } = useNefera()
  const [openId, setOpenId] = useState<string | null>(null)
  const msg = state.teacher.inbox.find((m) => m.id === openId) ?? null
  const unread = state.teacher.inbox.filter((m) => !m.readAt).length
  return (
    <Page emoji="📥" title="Inbox" subtitle={`${unread} unread message${unread === 1 ? '' : 's'}.`}>
      <div className="grid gap-3">
        {state.teacher.inbox.map((m) => {
          const student = m.toStudentId ? state.teacher.students.find((s) => s.id === m.toStudentId) : undefined
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setOpenId(m.id)
                dispatch({ type: 'teacher/markMessageRead', messageId: m.id })
              }}
              className="text-left"
            >
              <Card className={cx('transition hover:bg-black/5', m.readAt ? 'opacity-90' : '')}>
                <CardBody className="space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 truncate text-sm font-extrabold text-[rgb(var(--nefera-ink))]">{m.subject}</div>
                    {!m.readAt ? <Badge tone="ok">New</Badge> : <Badge>Read</Badge>}
                  </div>
                  <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))]">
                    {m.fromName} • {formatShort(m.createdAt)}
                    {student ? ` • ${student.name}` : ''}
                  </div>
                  <div className="text-sm text-[rgb(var(--nefera-muted))]">{m.body}</div>
                </CardBody>
              </Card>
            </button>
          )
        })}
      </div>
      <Modal
        open={!!msg}
        onClose={() => setOpenId(null)}
        title={msg?.subject ?? 'Message'}
        description={msg ? `${msg.fromName} • ${formatShort(msg.createdAt)}` : undefined}
        footer={
          <Button variant="ghost" onClick={() => setOpenId(null)}>
            Close
          </Button>
        }
      >
        <div className="rounded-3xl border border-[rgb(var(--nefera-border))] bg-white p-4 text-sm text-[rgb(var(--nefera-ink))] whitespace-pre-wrap">
          {msg?.body}
        </div>
      </Modal>
    </Page>
  )
}

function CounselorInbox() {
  const { state, dispatch } = useNefera()
  const [openId, setOpenId] = useState<string | null>(null)
  const msg = state.counselor.inbox.find((m) => m.id === openId) ?? null
  const unread = state.counselor.inbox.filter((m) => !m.readAt).length
  return (
    <Page emoji="📥" title="Inbox" subtitle={`${unread} unread message${unread === 1 ? '' : 's'}.`}>
      <div className="grid gap-3">
        {state.counselor.inbox.map((m) => {
          const student = m.toStudentId ? state.counselor.students.find((s) => s.id === m.toStudentId) : undefined
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setOpenId(m.id)
                dispatch({ type: 'counselor/markMessageRead', messageId: m.id })
              }}
              className="text-left"
            >
              <Card className={cx('transition hover:bg-black/5', m.readAt ? 'opacity-90' : '')}>
                <CardBody className="space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 truncate text-sm font-extrabold text-[rgb(var(--nefera-ink))]">{m.subject}</div>
                    {!m.readAt ? <Badge tone="ok">New</Badge> : <Badge>Read</Badge>}
                  </div>
                  <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))]">
                    {m.fromName} • {formatShort(m.createdAt)}
                    {student ? ` • ${student.name}` : ''}
                  </div>
                  <div className="text-sm text-[rgb(var(--nefera-muted))]">{m.body}</div>
                </CardBody>
              </Card>
            </button>
          )
        })}
      </div>
      <Modal
        open={!!msg}
        onClose={() => setOpenId(null)}
        title={msg?.subject ?? 'Message'}
        description={msg ? `${msg.fromName} • ${formatShort(msg.createdAt)}` : undefined}
        footer={
          <Button variant="ghost" onClick={() => setOpenId(null)}>
            Close
          </Button>
        }
      >
        <div className="rounded-3xl border border-[rgb(var(--nefera-border))] bg-white p-4 text-sm text-[rgb(var(--nefera-ink))] whitespace-pre-wrap">
          {msg?.body}
        </div>
      </Modal>
    </Page>
  )
}

function PrincipalInbox() {
  const { state, dispatch } = useNefera()
  const [openId, setOpenId] = useState<string | null>(null)
  const msg = state.principal.inbox.find((m) => m.id === openId) ?? null
  const unread = state.principal.inbox.filter((m) => !m.readAt).length
  return (
    <Page emoji="📥" title="Inbox" subtitle={`${unread} unread message${unread === 1 ? '' : 's'}.`}>
      <div className="grid gap-3">
        {state.principal.inbox.map((m) => {
          const student = m.toStudentId ? state.counselor.students.find((s) => s.id === m.toStudentId) : undefined
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setOpenId(m.id)
                dispatch({ type: 'principal/markMessageRead', messageId: m.id })
              }}
              className="text-left"
            >
              <Card className={cx('transition hover:bg-black/5', m.readAt ? 'opacity-90' : '')}>
                <CardBody className="space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 truncate text-sm font-extrabold text-[rgb(var(--nefera-ink))]">{m.subject}</div>
                    {!m.readAt ? <Badge tone="ok">New</Badge> : <Badge>Read</Badge>}
                  </div>
                  <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))]">
                    {m.fromName} • {formatShort(m.createdAt)}
                    {student ? ` • ${student.name}` : ''}
                  </div>
                  <div className="text-sm text-[rgb(var(--nefera-muted))]">{m.body}</div>
                </CardBody>
              </Card>
            </button>
          )
        })}
      </div>
      <Modal
        open={!!msg}
        onClose={() => setOpenId(null)}
        title={msg?.subject ?? 'Message'}
        description={msg ? `${msg.fromName} • ${formatShort(msg.createdAt)}` : undefined}
        footer={
          <Button variant="ghost" onClick={() => setOpenId(null)}>
            Close
          </Button>
        }
      >
        <div className="rounded-3xl border border-[rgb(var(--nefera-border))] bg-white p-4 text-sm text-[rgb(var(--nefera-ink))] whitespace-pre-wrap">
          {msg?.body}
        </div>
      </Modal>
    </Page>
  )
}

function StudentReportIncident() {
  const { state, dispatch } = useNefera()
  const [type, setType] = useState('Bullying / Harassment')
  const [desc, setDesc] = useState('')
  const [anon, setAnon] = useState(true)
  const [confirm, setConfirm] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [toast, setToast] = useState(false)
  const canSubmit = !!desc.trim()
  const reportHint = useFirstVisitHint('nefera_hint_report_incident_v1')
  if (!state.schoolConfig.features.reports) {
    return (
      <Page emoji="🛡️" title="Report incident" subtitle="You can report anonymously. Your safety matters.">
        <Card>
          <CardHeader emoji="🔒" title="Reporting is unavailable" subtitle="Your school has disabled reports right now." />
          <CardBody className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm leading-6 text-[rgb(var(--nefera-muted))]">If you need support, try journaling or reach out to a trusted adult.</div>
            <Link to="/student/dashboard">
              <Button size="sm" variant="secondary">
                Back
              </Button>
            </Link>
          </CardBody>
        </Card>
      </Page>
    )
  }
  return (
    <Page emoji="🛡️" title="Report incident" subtitle="You can report anonymously. Your safety matters.">
      {submitted ? (
        <Card className="mb-4">
          <CardHeader emoji="✅" title="Report received" subtitle="Thank you for speaking up. You did the right thing." />
          <CardBody className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm leading-6 text-[rgb(var(--nefera-muted))]">
              If you’re feeling unsafe right now, reach out to a trusted adult or emergency services.
            </div>
            <Button size="sm" variant="secondary" onClick={() => setSubmitted(false)}>
              Okay
            </Button>
          </CardBody>
        </Card>
      ) : null}
      {reportHint.show ? (
        <Card className="mb-4">
          <CardHeader emoji="💡" title="Quick tip" subtitle="Share what you remember. Short notes are enough." />
          <CardBody className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm leading-6 text-[rgb(var(--nefera-muted))]">Include where/when it happened if you can. Names are optional.</div>
            <Button size="sm" variant="secondary" onClick={reportHint.dismiss}>
              Got it
            </Button>
          </CardBody>
        </Card>
      ) : null}
      <Card>
        <CardHeader emoji="📝" title="Tell us what happened" subtitle="Share only what you’re comfortable sharing." />
        <CardBody className="space-y-3">
          <Select
            label="Incident type"
            value={type}
            onChange={setType}
            options={['Bullying / Harassment', 'Unsafe behavior', 'Self-harm concern', 'Teacher concern', 'Online issue', 'Other'].map((t) => ({
              value: t,
              label: t,
            }))}
          />
          <TextArea
            value={desc}
            onChange={(e) => {
              setDesc(e.target.value)
              if (submitted) setSubmitted(false)
            }}
            label="Description"
            hint="If someone is in immediate danger, contact a trusted adult or emergency services."
          />
          <div className="flex items-center gap-2">
            <Chip selected={anon} onClick={() => setAnon(true)}>
              Anonymous
            </Chip>
            <Chip selected={!anon} onClick={() => setAnon(false)}>
              Named
            </Chip>
          </div>
          <div className="hidden justify-end pt-2 md:flex">
            <Button disabled={!canSubmit} onClick={() => setConfirm(true)}>
              Submit report
            </Button>
          </div>
        </CardBody>
      </Card>
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 md:hidden">
        <div className="mx-auto w-full max-w-[480px] px-3">
          <div className="border-t border-[rgb(var(--nefera-border))] bg-white px-3 py-3">
            <div className="grid gap-2">
              <Button className="h-14 w-full" disabled={!canSubmit} onClick={() => setConfirm(true)}>
                Submit report
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Please confirm before submitting."
        description="Once submitted, this report will be shared with the appropriate school authorities for review. Are you sure you want to proceed?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(false)}>
              Cancel Submission
            </Button>
            <Button variant="secondary" onClick={() => setConfirm(false)}>
              Go Back and Edit
            </Button>
            <Button
              onClick={() => {
                const createdAt = new Date().toISOString()
                const classInfo = { id: 'class_1', name: 'Grade 8A' }
                dispatch({
                  type: 'student/addIncident',
                  incident: {
                    id: makeId('inc'),
                    createdAt,
                    type,
                    description: desc.trim(),
                    anonymous: anon,
                    status: 'received',
                    context: { school: 'Nefera School', classId: classInfo.id, className: classInfo.name, submittedBy: 'student' },
                  },
                })
                setConfirm(false)
                setDesc('')
                setToast(true)
                setSubmitted(true)
              }}
            >
              Confirm and Submit Report
            </Button>
          </>
        }
      >
        <div className="rounded-3xl border border-[rgba(245,158,11,0.22)] bg-[rgba(245,158,11,0.10)] p-4 text-sm text-[rgb(var(--nefera-muted))]">
          If anyone is in immediate danger, contact a trusted adult or emergency services.
        </div>
      </Modal>
      <Toast open={toast} tone="ok" message="Report submitted. Thank you for speaking up." onClose={() => setToast(false)} />
    </Page>
  )
}

function StudentHelpBatchmates() {
  const { dispatch } = useNefera()
  const [anxiety, setAnxiety] = useState<Record<string, boolean>>({})
  const [depression, setDepression] = useState<Record<string, boolean>>({})
  const [risk, setRisk] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState(false)

  const sections = [
    {
      title: 'Anxiety signs',
      emoji: '😰',
      state: anxiety,
      setState: setAnxiety,
      items: [
        'Appears excessively worried',
        'Seems restless or on edge',
        'Irritable or easily upset',
        'Difficulty concentrating',
        'Avoids social or group activities',
        'Shows physical signs of stress (trembling, sweating, fatigue)',
      ],
    },
    {
      title: 'Depression signs',
      emoji: '🌧️',
      state: depression,
      setState: setDepression,
      items: [
        'Seems persistently sad or low in feel',
        'Shows loss of interest in usual activities',
        'Appears hopeless or withdrawn',
        'Fatigue or lack of energy',
        'Changes in sleep or eating habits',
        'Social withdrawal from friends or group activities',
      ],
    },
    {
      title: 'Suicidal risk signs',
      emoji: '🆘',
      state: risk,
      setState: setRisk,
      items: [
        'Talks about feeling life is not worth living',
        'Mentions self-harm or wanting to die',
        'Displays hopelessness or feeling trapped',
        'Withdraws suddenly from friends or activities',
        'Engages in risky or self-destructive behaviors',
      ],
    },
  ] as const

  const totalChecked = Object.values({ ...anxiety, ...depression, ...risk }).filter(Boolean).length

  function onSave() {
    const createdAt = new Date().toISOString()
    dispatch({
      type: 'student/addPeerObservation',
      observation: {
        id: makeId('peer_obs'),
        createdAt,
        anxiety: Object.entries(anxiety)
          .filter(([, checked]) => checked)
          .map(([label]) => label),
        depression: Object.entries(depression)
          .filter(([, checked]) => checked)
          .map(([label]) => label),
        risk: Object.entries(risk)
          .filter(([, checked]) => checked)
          .map(([label]) => label),
      },
    })
    setAnxiety({})
    setDepression({})
    setRisk({})
    setToast(true)
  }

  return (
    <Page
      emoji="🫂"
      title="Help batchmates"
      subtitle="A quick checklist to notice when a friend might need extra support."
      right={
        <div className="flex w-full gap-2">
          <Link to="/student/inbox" className="flex-1">
            <Button className="h-14 w-full" variant="secondary">
              Message staff 💬
            </Button>
          </Link>
          <Button className="h-14 w-full flex-1" disabled={totalChecked === 0} onClick={onSave}>
            Save checklist
          </Button>
        </div>
      }
    >
      <div className="grid gap-3 md:grid-cols-3">
        {sections.map((s) => (
          <ChecklistGroup
            key={s.title}
            title={`${s.emoji} ${s.title}`}
            subtitle="Select what you notice."
            items={[...s.items]}
            values={s.state}
            onToggle={(item, checked) => s.setState((m) => ({ ...m, [item]: checked }))}
          />
        ))}
      </div>
      <Card className="mt-4">
        <CardBody className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-extrabold text-[rgb(var(--nefera-ink))]">What next</div>
            <div className="mt-1 text-sm text-[rgb(var(--nefera-muted))]">
              Checked {totalChecked} sign{totalChecked === 1 ? '' : 's'}. If risk signs are present, tell a trusted adult immediately.
            </div>
          </div>
          <div className="hidden" />
        </CardBody>
      </Card>
      <Toast open={toast} message="Saved. You’re a good friend." onClose={() => setToast(false)} />
    </Page>
  )
}

function TeacherObservationChecklist() {
  const { state, dispatch } = useNefera()
  const params = useParams()
  const [values, setValues] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState(false)
  const [messageOpen, setMessageOpen] = useState(false)
  const [messageBody, setMessageBody] = useState('')
  const [messageToast, setMessageToast] = useState(false)
  const student = state.teacher.students.find((s) => s.id === params.id)

  const items = [
    'Frequent absenteeism',
    'Noticeable changes in feelings',
    'Withdrawing from friends',
    'Trouble focusing in class',
    'Sudden drop in performance',
    'Conflict with peers',
    'Physical complaints (headache/stomach)',
    'Signs of self-harm concern',
    'Other',
  ]

  const checked = Object.values(values).filter(Boolean).length
  const studentLabel = student ? `${student.name} • ${student.grade}` : params.id ? `Student ${params.id}` : 'Student'

  function onSave() {
    const createdAt = new Date().toISOString()
    const selectedItems = Object.entries(values)
      .filter(([, ok]) => ok)
      .map(([item]) => item)
    dispatch({
      type: 'teacher/addObservation',
      observation: { id: makeId('t_obs'), createdAt, studentId: student?.id ?? params.id ?? 'unknown', items: selectedItems },
    })
    setToast(true)
  }

  return (
    <Page
      emoji="🧑‍🏫"
      title="Teacher observation"
      subtitle={`A quick checklist for ${studentLabel}.`}
      right={
        <div className="flex w-full gap-2">
          <Button className="h-14 w-full flex-1" variant="secondary" onClick={() => setMessageOpen(true)}>
            Message parent 💬
          </Button>
          <Button className="h-14 w-full flex-1" variant="secondary" onClick={() => setValues({})}>
            Clear
          </Button>
          <Button className="h-14 w-full flex-1" onClick={onSave}>
            Save observation
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <ChecklistGroup
          title="🧾 Observation checklist"
          subtitle="Select what you noticed today."
          items={items}
          values={values}
          onToggle={(item, checked) => setValues((m) => ({ ...m, [item]: checked }))}
        />
        <Card>
          <CardBody className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <Section title="Summary" subtitle={`Checked ${checked} item${checked === 1 ? '' : 's'}.`} />
            </div>
            <div className="hidden" />
          </CardBody>
        </Card>
      </div>
      <Toast open={toast} message="Saved. Thank you for noticing." onClose={() => setToast(false)} />
      <Toast open={messageToast} message="Sent to parent." onClose={() => setMessageToast(false)} />
      <Modal
        open={messageOpen}
        onClose={() => {
          setMessageOpen(false)
          setMessageBody('')
        }}
        title="💬 Message parent"
        description={student ? `Regarding ${student.name}.` : 'Send a note to the parent.'}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setMessageOpen(false)
                setMessageBody('')
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={messageBody.trim().length === 0}
              onClick={() => {
                const createdAt = new Date().toISOString()
                dispatch({
                  type: 'teacher/messageParent',
                  item: { id: makeId('msg'), createdAt, childId: student?.id ?? params.id ?? 'unknown', body: messageBody.trim() },
                })
                setMessageOpen(false)
                setMessageBody('')
                setMessageToast(true)
              }}
            >
              Send
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))]">Message</div>
          <TextArea
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            placeholder="Share a gentle update, and what the parent can do next."
            rows={6}
          />
        </div>
      </Modal>
    </Page>
  )
}

function ParentObservationChecklist() {
  const [feelings, setFeelings] = useState<Record<string, boolean>>({})
  const [habits, setHabits] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState(false)

  const totalChecked = Object.values({ ...feelings, ...habits }).filter(Boolean).length

  return (
    <Page
      emoji="👪"
      title="Home checklist"
      subtitle="A gentle way to notice patterns at home."
      right={
        <div className="flex w-full gap-2">
          <Link to="/parent/message" className="flex-1">
            <Button className="h-14 w-full" variant="secondary">
              Message school 💌
            </Button>
          </Link>
          <Button className="h-14 w-full flex-1" onClick={() => setToast(true)}>
            Save checklist
          </Button>
        </div>
      }
    >
      <div className="grid gap-3 md:grid-cols-2">
        <ChecklistGroup
          title="💛 Feelings & connection"
          subtitle="What feels different lately?"
          items={['Withdrawn from family', 'More irritable', 'Sad or tearful', 'Anxious or worried', 'Less interest in hobbies', 'Avoiding school talk', 'Other']}
          values={feelings}
          onToggle={(item, checked) => setFeelings((m) => ({ ...m, [item]: checked }))}
        />
        <ChecklistGroup
          title="🌙 Sleep & habits"
          subtitle="Small shifts can be meaningful."
          items={['Trouble falling asleep', 'Sleeping too much', 'Eating changes', 'Low energy', 'Headache or stomach aches', 'Too much screen time', 'Other']}
          values={habits}
          onToggle={(item, checked) => setHabits((m) => ({ ...m, [item]: checked }))}
        />
      </div>
      <Card className="mt-4">
        <CardBody className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <Section title="Next step" subtitle={`Checked ${totalChecked} item${totalChecked === 1 ? '' : 's'}. Consider a calm chat, then message the school if needed.`} />
          </div>
          <div className="hidden" />
        </CardBody>
      </Card>
      <Toast open={toast} message="Saved. Thank you for checking in." onClose={() => setToast(false)} />
    </Page>
  )
}

function StudentProfile() {
  const { state } = useNefera()
  const { user } = useAuth()
  const checkIns = state.student.checkIns.length
  const journals = state.student.journal.length
  const sleep = state.student.sleepLogs.length
  const dayStreak = streakFromISODateList(state.student.checkIns.map((c) => c.createdAt.slice(0, 10)))
  const journalStreak = streakFromISODateList(state.student.journal.map((j) => j.dateKey))
  return (
    <Page emoji="🙋" title="Profile" subtitle="Manage your information and view your activity.">
      <Card>
        <CardBody className="flex flex-col gap-4 md:flex-row md:items-center">
          <Avatar name={user?.name ?? 'Guest'} size={56} />
          <div className="min-w-0">
            <div className="text-lg font-extrabold text-[rgb(var(--nefera-ink))]">{user?.name ?? 'Guest'}</div>
            <div className="text-sm font-semibold text-[rgb(var(--nefera-muted))]">{user?.role.toUpperCase()}</div>
          </div>
          <div className="ml-auto grid w-full grid-cols-1 gap-2 sm:grid-cols-3 md:w-auto">
            <div className="rounded-3xl border border-[rgb(var(--nefera-border))] bg-white p-3 text-center">
              <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))]">Check-ins</div>
              <div className="mt-1 text-xl font-extrabold text-[rgb(var(--nefera-ink))]">{checkIns}</div>
            </div>
            <div className="rounded-3xl border border-[rgb(var(--nefera-border))] bg-white p-3 text-center">
              <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))]">Journals</div>
              <div className="mt-1 text-xl font-extrabold text-[rgb(var(--nefera-ink))]">{journals}</div>
            </div>
            <div className="rounded-3xl border border-[rgb(var(--nefera-border))] bg-white p-3 text-center">
              <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))]">Sleep</div>
              <div className="mt-1 text-xl font-extrabold text-[rgb(var(--nefera-ink))]">{sleep}</div>
            </div>
          </div>
        </CardBody>
      </Card>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader title="Streaks" subtitle="Consistency over perfection." />
          <CardBody className="grid gap-2 md:grid-cols-2">
            <div className="rounded-3xl border border-[rgb(var(--nefera-border))] bg-white p-4">
              <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))]">Check-in streak</div>
              <div className="mt-1 text-2xl font-extrabold text-[rgb(var(--nefera-ink))]">{dayStreak} 🔥</div>
            </div>
            <div className="rounded-3xl border border-[rgb(var(--nefera-border))] bg-white p-4">
              <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))]">Journal streak</div>
              <div className="mt-1 text-2xl font-extrabold text-[rgb(var(--nefera-ink))]">{journalStreak} 📝</div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Privacy" subtitle="Your information is protected." />
          <CardBody className="space-y-3">
            <div className="rounded-3xl border border-[rgb(var(--nefera-border))] bg-white p-4 text-sm text-[rgb(var(--nefera-muted))]">Your responses are private.</div>
            <Link to="/student/soul-space">
              <Button variant="secondary">Open Soul Space 🌿</Button>
            </Link>
          </CardBody>
        </Card>
      </div>
    </Page>
  )
}

function TeacherDashboard() {
  const { state, dispatch } = useNefera()
  const { user } = useAuth()
  const navigate = useNavigate()
  const students = state.teacher.students
  const flagged = students.filter((s) => s.flags !== 'none').length
  const crisis = students.filter((s) => s.flags === 'crisis').length
  const high = students.filter((s) => s.flags === 'red').length
  const [toStudentId, setToStudentId] = useState(students[0]?.id ?? '')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [smsPlaceholder, setSmsPlaceholder] = useState(false)
  const [toast, setToast] = useState(false)
  const resolvedToStudentId = toStudentId || students[0]?.id || ''
  const canSend = state.schoolConfig.features.messaging && !!resolvedToStudentId && !!subject.trim() && !!body.trim()

  function onSend() {
    if (!canSend) return
    dispatch({
      type: 'teacher/sendMessage',
      item: { id: makeId('t_msg'), createdAt: new Date().toISOString(), toStudentId: resolvedToStudentId, subject: subject.trim(), body: body.trim() },
    })
    setSubject('')
    setBody('')
    setToast(true)
  }

  return (
    <Page emoji="🧑‍🏫" title={`Welcome, ${user?.name ?? 'Teacher'}`} subtitle="Class overview and quick actions.">
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="space-y-4">
          <CardHeader
            emoji="📚"
            title="Today"
            subtitle="A quick snapshot to guide support."
            right={<Button onClick={() => navigate('/teacher/inbox')}>Inbox 📥</Button>}
          />
          <CardBody className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <StatPill emoji="🧑‍🎓" label="Students" value={`${students.length}`} />
              <StatPill emoji="🚩" label="Flagged" value={`${flagged}`} />
              <StatPill emoji="🟠" label="Watch" value={`${students.filter((s) => s.flags === 'orange').length}`} />
              <StatPill emoji="🛟" label="High/Crisis" value={`${high + crisis}`} />
            </div>
          </CardBody>
          </Card>
          <Card className="space-y-4">
          <CardHeader emoji="⚡" title="Quick actions" subtitle="Keep communication simple and timely." />
          <CardBody className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Link to="/teacher/broadcast">
                <Button>Broadcast 📣</Button>
              </Link>
              <Link to="/teacher/inbox">
                <Button variant="secondary">Inbox 📥</Button>
              </Link>
              <Link to="/teacher/students">
                <Button variant="secondary">View students</Button>
              </Link>
            </div>
          </CardBody>
          </Card>
        </div>

        <Card className="space-y-4">
          <CardHeader
            emoji="🚩"
            title="Students needing attention"
            subtitle="Flags help route support to the right team."
            right={
              <Link to="/teacher/students">
                <Button size="sm" variant="secondary">
                  View all
                </Button>
              </Link>
            }
          />
          <CardBody className="space-y-4">
            <div className="grid gap-2">
              {students.filter((s) => s.flags !== 'none').slice(0, 6).map((s) => (
                <Link
                  key={s.id}
                  to={`/teacher/students/${s.id}`}
                  className="rounded-2xl border border-[rgb(var(--nefera-border))] bg-white p-4 py-4 shadow-none md:border-white/70 md:bg-white/60 md:shadow-lg md:shadow-black/5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-extrabold text-[rgb(var(--nefera-ink))]">{s.name}</div>
                      <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))]">{s.grade}</div>
                    </div>
                    <Badge tone={flagTone(s.flags)}>{flagLabel(s.flags)}</Badge>
                  </div>
                </Link>
              ))}
            </div>
            {students.every((s) => s.flags === 'none') ? (
              <div className="rounded-2xl border border-white/70 bg-white/60 p-4 py-4">
                <div className="text-sm text-[rgb(var(--nefera-muted))]">No flags right now. Use observations to note changes and follow up early.</div>
                <div className="mt-3">
                  <Link to="/teacher/students">
                    <Button variant="secondary">View students</Button>
                  </Link>
                </div>
              </div>
            ) : null}
          </CardBody>
        </Card>

        <Card className="space-y-4">
          <CardHeader emoji="💬" title="Message a student" subtitle="Send a quick supportive note to a specific student." />
          {!state.schoolConfig.features.messaging ? (
            <CardBody className="space-y-4">
              <div className="rounded-3xl border border-[rgb(var(--nefera-border))] bg-white p-4 py-4 text-sm text-[rgb(var(--nefera-muted))]">
                Messaging is currently disabled by your school.
              </div>
              <Link to="/teacher/students">
                <Button variant="secondary">View students</Button>
              </Link>
            </CardBody>
          ) : (
            <CardBody className="space-y-4">
              <div className="space-y-3">
                <Section title="Compose" />
                <Select
                  label="Student"
                  value={resolvedToStudentId}
                  onChange={setToStudentId}
                  options={
                    students.length
                      ? students.map((s) => ({ value: s.id, label: `${s.name} • ${s.grade}` }))
                      : [{ value: '', label: 'No students' }]
                  }
                />
                <Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
                <TextArea label="Message" value={body} onChange={(e) => setBody(e.target.value)} inputClassName="min-h-32" />
              </div>
              <Divider />
              <div className="space-y-3">
                <Section title="Delivery" />
                <div className="flex flex-wrap items-center gap-2">
                  <Chip selected={!smsPlaceholder} onClick={() => setSmsPlaceholder(false)}>
                    In-app
                  </Chip>
                  <Chip selected={smsPlaceholder} onClick={() => setSmsPlaceholder(true)}>
                    SMS placeholder
                  </Chip>
                </div>
                {smsPlaceholder ? (
                  <div className="rounded-3xl border border-[rgb(var(--nefera-border))] bg-white p-4 py-4 text-sm text-[rgb(var(--nefera-muted))]">
                    SMS sending is a placeholder here (no SMS is sent). This will still deliver as an in-app message.
                  </div>
                ) : null}
              </div>
              <div className="flex justify-end">
                <Button disabled={!canSend} onClick={onSend}>
                  Send
                </Button>
              </div>
            </CardBody>
          )}
        </Card>
      </div>
      <Toast open={toast} message="Message sent." onClose={() => setToast(false)} />
    </Page>
  )
}

function TeacherBroadcast() {
  const { dispatch } = useNefera()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [toast, setToast] = useState(false)

  const canSend = !!title.trim() && !!body.trim()

  function onSend() {
    const createdAt = new Date().toISOString()
    dispatch({ type: 'teacher/addBroadcast', item: { id: makeId('t_brd'), createdAt, title: title.trim(), body: body.trim() } })
    setToast(true)
    window.setTimeout(() => navigate('/teacher/dashboard', { replace: true }), 250)
  }

  return (
    <Page emoji="📣" title="Broadcast" subtitle="Send a supportive message to students.">
      <div className="space-y-4">
        <Card>
          <CardBody className="space-y-4">
            <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <TextArea label="Message" value={body} onChange={(e) => setBody(e.target.value)} inputClassName="min-h-40" />
            <Divider />
            <div className="hidden justify-end gap-2 md:flex">
              <Button variant="ghost" onClick={() => navigate('/teacher/dashboard')}>
                Cancel
              </Button>
              <Button disabled={!canSend} onClick={onSend}>
                Send
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 md:hidden">
        <div className="mx-auto w-full max-w-[480px] px-3">
          <div className="border-t border-[rgb(var(--nefera-border))] bg-white px-3 py-3">
            <div className="grid grid-cols-2 gap-2">
              <Button className="h-14 w-full" variant="secondary" onClick={() => navigate('/teacher/dashboard')}>
                Cancel
              </Button>
              <Button className="h-14 w-full" disabled={!canSend} onClick={onSend}>
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Toast open={toast} message="Broadcast sent." onClose={() => setToast(false)} />
    </Page>
  )
}

function TeacherStudents() {
  const { state, dispatch } = useNefera()
  const students = state.teacher.students

  return (
    <Page emoji="🧑‍🎓" title="Students" subtitle="View students and log observations.">
      <div className="grid gap-3">
        {students.map((s) => (
          <Card key={s.id}>
            <CardBody className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="text-base font-extrabold tracking-tight text-[rgb(var(--nefera-ink))]">{s.name}</div>
                <div className="mt-1 text-xs font-semibold text-[rgb(var(--nefera-muted))]">{s.grade}</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={flagTone(s.flags)}>{flagLabel(s.flags)}</Badge>
                <Select
                  value={s.flags}
                  onChange={(v) => dispatch({ type: 'teacher/setStudentFlags', studentId: s.id, flags: v as 'orange' | 'red' | 'crisis' | 'none' })}
                  options={[
                    { value: 'none', label: 'None' },
                    { value: 'orange', label: 'Watch' },
                    { value: 'red', label: 'High' },
                    { value: 'crisis', label: 'Crisis' },
                  ]}
                />
                <Link to={`/teacher/students/${s.id}`}>
                  <Button size="sm">Observation</Button>
                </Link>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </Page>
  )
}

function TeacherProfile() {
  const { user } = useAuth()
  return (
    <Page emoji="🙋" title="Profile" subtitle="Your account details.">
      <Card>
        <CardBody className="space-y-2">
          <div className="text-sm font-semibold text-[rgb(var(--nefera-muted))]">Name</div>
          <div className="text-lg font-extrabold text-[rgb(var(--nefera-ink))]">{user?.name ?? ''}</div>
          <Divider className="my-3" />
          <div className="text-sm font-semibold text-[rgb(var(--nefera-muted))]">Role</div>
          <div className="text-sm font-extrabold text-[rgb(var(--nefera-ink))]">{user?.role.toUpperCase()}</div>
        </CardBody>
      </Card>
    </Page>
  )
}

function ParentDashboard() {
  const { state } = useNefera()
  const { user } = useAuth()
  const canMessageSchool = state.schoolConfig.features.messaging
  const canReportIncident = state.schoolConfig.features.reports
  const child = state.parent.children[0]
  const childId = child?.id ?? 'stu_1'
  const todayKey = getTodayISO()
  const [openHistoryId, setOpenHistoryId] = useState<string | null>(null)

  function parseGradeNumber(value: string | undefined) {
    const text = String(value ?? '')
    const m = text.match(/(\d+)/)
    if (!m) return undefined
    const n = Number(m[1])
    return Number.isFinite(n) ? n : undefined
  }

  const childGradeNum = parseGradeNumber(child?.grade)
  const maxGrade = state.schoolConfig.parent.maxGrade
  const isGradeRestricted = !state.schoolConfig.parent.allowBeyondMax && childGradeNum !== undefined && childGradeNum > maxGrade

  const childCheckIns = useMemo(() => state.student.checkIns.filter((c) => (c.studentId ?? childId) === childId), [childId, state.student.checkIns])
  const last7Days = useMemo(() => lastDaysISO(7), [])
  const checkInByDay = useMemo(() => latestCheckInByDay(childCheckIns), [childCheckIns])
  const emotionPcts = useMemo(() => {
    const counts: Record<Feeling, number> = { happy: 0, neutral: 0, flat: 0, worried: 0, sad: 0 }
    for (const day of last7Days) {
      const c = checkInByDay.get(day)
      if (!c) continue
      counts[c.feeling]++
    }
    const total = Object.values(counts).reduce((a, n) => a + n, 0)
    const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0)
    return { total, pctByFeeling: { happy: pct(counts.happy), neutral: pct(counts.neutral), flat: pct(counts.flat), worried: pct(counts.worried), sad: pct(counts.sad) } }
  }, [checkInByDay, last7Days])
  const journalToday = state.student.journal.some((j) => j.dateKey === todayKey)

  const historyItems = useMemo(() => {
    const received = state.parent.inbox
      .filter((m) => !m.toStudentId || m.toStudentId === childId)
      .map((m) => ({
        kind: 'inbox' as const,
        id: m.id,
        createdAt: m.createdAt,
        title: m.subject,
        subtitle: `${m.fromName} • ${formatShort(m.createdAt)}`,
        body: m.body,
        readAt: m.readAt,
      }))

    const sent = state.parent.sent
      .filter((m) => m.childId === childId)
      .map((m) => ({
        kind: 'sent' as const,
        id: m.id,
        createdAt: m.createdAt,
        title: `Message to ${m.toRole}`,
        subtitle: `${formatShort(m.createdAt)}`,
        body: m.body,
      }))

    const reports = state.parent.reports
      .filter((r) => r.childId === childId)
      .map((r) => ({
        kind: 'report' as const,
        id: r.id,
        createdAt: r.createdAt,
        title: `Incident report: ${r.type}`,
        subtitle: `${formatShort(r.createdAt)} • ${r.status}`,
        body: r.body,
        status: r.status,
        readAtBySchool: r.readAtBySchool,
        closedAt: r.closedAt,
        closureNote: r.closureNote,
      }))

    const all = [...received, ...sent, ...reports].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    return all.slice(0, 10)
  }, [childId, state.parent.inbox, state.parent.reports, state.parent.sent])

  const messageAndReportHistory = useMemo(() => {
    const sentMessages = state.parent.sent
      .filter((m) => m.childId === childId)
      .map((m) => ({
        kind: 'message' as const,
        id: m.id,
        text: m.body,
        sentAt: m.sentAt,
        editedAt: m.editedAt,
        status: 'open' as const,
        readAtBySchool: undefined as string | undefined,
        closedAt: undefined as string | undefined,
      }))

    const reportedIncidents = state.parent.reports
      .filter((r) => r.childId === childId)
      .map((r) => ({
        kind: 'report' as const,
        id: r.id,
        text: r.body,
        sentAt: r.createdAt,
        editedAt: undefined as string | undefined,
        status: r.status === 'resolved' ? ('closed' as const) : ('open' as const),
        readAtBySchool: r.readAtBySchool,
        closedAt: r.closedAt,
        closureNote: r.closureNote,
      }))

    return [...sentMessages, ...reportedIncidents].sort((a, b) => Date.parse(b.sentAt) - Date.parse(a.sentAt))
  }, [childId, state.parent.reports, state.parent.sent])

  const openHistoryItem = historyItems.find((x) => x.id === openHistoryId) ?? null

  function previewText(text: string, max = 140) {
    const t = String(text ?? '').trim()
    return t.length > max ? `${t.slice(0, max)}…` : t
  }

  return (
    <Page emoji="👪" title={`Welcome, ${user?.name ?? 'Parent'}`} subtitle="A calm overview and simple next steps.">
      {!state.schoolConfig.features.parentDashboard ? (
        <Card className="space-y-4">
          <CardHeader emoji="🔒" title="Parent dashboard is unavailable" subtitle="Your school has disabled it right now." />
          <CardBody className="space-y-3">
            <div className="text-sm leading-6 text-[rgb(var(--nefera-muted))]">You can still reach out to the school using the options below.</div>
            <div className="flex flex-wrap items-center gap-2">
              {canMessageSchool ? (
                <Link to="/parent/message">
                  <Button variant="secondary">Message school 💌</Button>
                </Link>
              ) : null}
              {canReportIncident ? (
                <Link to="/parent/report-incident">
                  <Button variant="secondary">Report incident 🛡️</Button>
                </Link>
              ) : null}
            </div>
          </CardBody>
        </Card>
      ) : (
        isGradeRestricted ? (
          <Card className="space-y-4">
            <CardHeader emoji="🔒" title="Limited access" subtitle={`This dashboard is available up to Grade ${maxGrade}.`} />
            <CardBody className="space-y-4">
              <div className="text-sm leading-6 text-[rgb(var(--nefera-muted))]">You can still use the quick actions below.</div>
              <div className="space-y-3">
                <Section title="At home" />
                <Link to="/parent/checklist">
                  <Button>Home checklist ✅</Button>
                </Link>
              </div>
              <Divider />
              <div className="space-y-3">
                <Section title="Contact school" />
                <div className="flex flex-wrap items-center gap-2">
                  {canMessageSchool ? (
                    <Link to="/parent/message">
                      <Button variant="secondary">Message school 💌</Button>
                    </Link>
                  ) : null}
                  {canReportIncident ? (
                    <Link to="/parent/report-incident">
                      <Button variant="secondary">Report incident 🛡️</Button>
                    </Link>
                  ) : null}
                </div>
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="space-y-4">
                <CardHeader emoji="🧒" title="Child" subtitle="Overview for your child." />
                <CardBody className="space-y-4">
                  <div className="space-y-1">
                    <div className="text-base font-extrabold tracking-tight text-[rgb(var(--nefera-ink))]">{child?.name ?? '—'}</div>
                    <div className="text-sm font-semibold text-[rgb(var(--nefera-muted))]">{child?.grade ?? ''}</div>
                  </div>
                </CardBody>
              </Card>

              <Card className="space-y-4">
                <CardHeader emoji="⚡" title="Quick actions" subtitle="Small steps at home and school." />
                <CardBody className="space-y-4">
                  <div className="space-y-3">
                    <Section title="At home" />
                    <Link to="/parent/checklist">
                      <Button>Home checklist ✅</Button>
                    </Link>
                  </div>
                  <Divider />
                  <div className="space-y-3">
                    <Section title="Contact school" />
                    <div className="flex flex-wrap items-center gap-2">
                      {canMessageSchool ? (
                        <Link to="/parent/message">
                          <Button variant="secondary">Message school 💌</Button>
                        </Link>
                      ) : null}
                      {canReportIncident ? (
                        <Link to="/parent/report-incident">
                          <Button variant="secondary">Report incident 🛡️</Button>
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="space-y-4">
                <CardHeader emoji="📊" title="Emotions (last 7 days)" subtitle="Aggregated percentages from daily check-ins." />
                <CardBody className="space-y-4">
                  {emotionPcts.total ? (
                    <div className="space-y-4">
                      {(['happy', 'neutral', 'flat', 'worried', 'sad'] as Feeling[]).map((f) => {
                        const pct = emotionPcts.pctByFeeling[f]
                        return (
                          <div key={f} className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-sm font-semibold text-[rgb(var(--nefera-muted))]">{feelingLabel(f)}</div>
                              <div className="text-sm font-extrabold text-[rgb(var(--nefera-ink))]">{pct}%</div>
                            </div>
                            <ProgressBar value={pct} />
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-white/70 bg-white/60 p-4 py-4">
                      <div className="text-sm text-[rgb(var(--nefera-muted))]">No check-ins yet.</div>
                      <div className="mt-3">
                        <Link to="/parent/message">
                          <Button variant="secondary">Message school 💌</Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>

              <Card className="space-y-4">
                <CardHeader emoji="📝" title="Today" subtitle="Simple daily indicators." />
                <CardBody className="space-y-4">
                  <div className="grid gap-2">
                    <div className="rounded-3xl border border-[rgb(var(--nefera-border))] bg-white p-4 py-4">
                      <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))]">Journal today</div>
                      <div className="mt-1 text-2xl font-extrabold text-[rgb(var(--nefera-ink))]">{journalToday ? 'Yes' : 'No'}</div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>

            {canMessageSchool ? (
              <Card className="space-y-4">
                <CardHeader
                  emoji="📨"
                  title="Recent messages"
                  subtitle="Messages you’ve sent to school."
                  right={
                    <Link to="/parent/message">
                      <Button size="sm" variant="secondary">
                        Message school
                      </Button>
                    </Link>
                  }
                />
                <CardBody className="space-y-4">
                  <div className="grid gap-2">
                    {state.parent.sent.slice(0, 4).map((m) => (
                      <div
                        key={m.id}
                        className="rounded-2xl border border-[rgb(var(--nefera-border))] bg-white p-4 py-4 shadow-none md:border-white/70 md:bg-white/60 md:shadow-lg md:shadow-black/5"
                      >
                        <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))]">{formatShort(m.createdAt)}</div>
                        <div className="mt-1 text-sm text-[rgb(var(--nefera-ink))] whitespace-pre-wrap">{m.body}</div>
                      </div>
                    ))}
                  </div>
                  {state.parent.sent.length === 0 ? (
                    <div className="rounded-2xl border border-white/70 bg-white/60 p-4 py-4">
                      <div className="text-sm text-[rgb(var(--nefera-muted))]">
                        No messages yet. If you notice changes at home, a short note can help the school respond early.
                      </div>
                      <div className="mt-3">
                        <Link to="/parent/message">
                          <Button variant="secondary">Message school</Button>
                        </Link>
                      </div>
                    </div>
                  ) : null}
                </CardBody>
              </Card>
            ) : null}

            {(canMessageSchool || canReportIncident) ? (
              <Card className="space-y-4">
                <CardHeader
                  emoji="🗂️"
                  title="History"
                  subtitle="Messages and incident reports (latest first)."
                  right={
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {canMessageSchool ? (
                        <Link to="/parent/message">
                          <Button size="sm" variant="secondary">
                            Message school
                          </Button>
                        </Link>
                      ) : null}
                      {canReportIncident ? (
                        <Link to="/parent/report-incident">
                          <Button size="sm" variant="secondary">
                            Report incident
                          </Button>
                        </Link>
                      ) : null}
                    </div>
                  }
                />
                <CardBody className="space-y-4">
                  <div className="grid gap-2">
                    {historyItems.map((x) => (
                      <button
                        key={x.id}
                        type="button"
                        className="text-left"
                        onClick={() => {
                          setOpenHistoryId(x.id)
                        }}
                      >
                        <Card className="transition hover:bg-black/5">
                          <CardBody className="space-y-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="min-w-0 truncate text-sm font-extrabold text-[rgb(var(--nefera-ink))]">{x.title}</div>
                              {x.kind === 'inbox' ? (
                                !x.readAt ? (
                                  <Badge tone="ok">New</Badge>
                                ) : (
                                  <Badge>Read</Badge>
                                )
                              ) : x.kind === 'report' ? (
                                <Badge tone={x.status === 'resolved' ? 'ok' : x.status === 'reviewing' ? 'warn' : 'neutral'}>{x.status}</Badge>
                              ) : (
                                <Badge>Sent</Badge>
                              )}
                            </div>
                            <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))]">{x.subtitle}</div>
                            <div className="text-sm text-[rgb(var(--nefera-muted))] whitespace-pre-wrap">{previewText(x.body)}</div>
                          </CardBody>
                        </Card>
                      </button>
                    ))}
                  </div>
                  {historyItems.length === 0 ? (
                    <div className="rounded-2xl border border-white/70 bg-white/60 p-4 py-4">
                      <div className="text-sm text-[rgb(var(--nefera-muted))]">No history yet.</div>
                    </div>
                  ) : null}
                </CardBody>
              </Card>
            ) : null}

            <Card className="space-y-4">
              <CardHeader emoji="🧾" title="Your message & report history" subtitle="Sent messages and submitted reports." />
              <CardBody className="space-y-4">
                <div className="grid gap-2">
                  {messageAndReportHistory.map((x) => (
                    <div
                      key={x.id}
                      className="rounded-2xl border border-[rgb(var(--nefera-border))] bg-white p-4 py-4 shadow-none md:border-white/70 md:bg-white/60 md:shadow-lg md:shadow-black/5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))]">{formatShort(x.sentAt)}</div>
                        <Badge tone={x.kind === 'report' ? 'warn' : 'neutral'}>{x.kind === 'report' ? 'Report' : 'Message'}</Badge>
                      </div>
                      <div className="mt-2 text-sm text-[rgb(var(--nefera-ink))] whitespace-pre-wrap">{x.text}</div>
                      <div className="mt-2 text-xs font-semibold text-[rgb(var(--nefera-muted))] whitespace-pre-wrap">
                        • sentAt: {formatShort(x.sentAt)}
                        {'\n'}• editedAt: {x.editedAt ? formatShort(x.editedAt) : '—'}
                        {'\n'}• status: {x.status}
                        {'\n'}• readAtBySchool: {x.readAtBySchool ? formatShort(x.readAtBySchool) : '—'}
                        {x.closedAt ? `\n• closedAt: ${formatShort(x.closedAt)}` : ''}
                        {'closureNote' in x && x.closureNote ? `\n• closure note: ${x.closureNote}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
                {messageAndReportHistory.length === 0 ? (
                  <div className="rounded-2xl border border-white/70 bg-white/60 p-4 py-4">
                    <div className="text-sm text-[rgb(var(--nefera-muted))]">No messages or reports yet.</div>
                  </div>
                ) : null}
              </CardBody>
            </Card>
          </div>
        )
      )}
      <Modal
        open={!!openHistoryItem}
        onClose={() => setOpenHistoryId(null)}
        title={openHistoryItem?.title ?? 'History item'}
        description={openHistoryItem?.subtitle}
        footer={
          <Button variant="ghost" onClick={() => setOpenHistoryId(null)}>
            Close
          </Button>
        }
      >
        <div className="space-y-3">
          <div className="rounded-3xl border border-[rgb(var(--nefera-border))] bg-white p-4 text-sm text-[rgb(var(--nefera-ink))] whitespace-pre-wrap">
            {openHistoryItem?.body}
          </div>
          {openHistoryItem?.kind === 'report' ? (
            <div className="rounded-3xl border border-[rgb(var(--nefera-border))] bg-white p-4 text-xs font-semibold text-[rgb(var(--nefera-muted))] whitespace-pre-wrap">
              • readAtBySchool: {openHistoryItem.readAtBySchool ? formatShort(openHistoryItem.readAtBySchool) : '—'}
              {'\n'}• closedAt: {openHistoryItem.closedAt ? formatShort(openHistoryItem.closedAt) : '—'}
              {'\n'}• closure note: {openHistoryItem.closureNote ? openHistoryItem.closureNote : '—'}
            </div>
          ) : null}
        </div>
      </Modal>
    </Page>
  )
}

function AdminDashboard() {
  const { state } = useNefera()
  const pending = state.schoolConfigRequests.filter((r) => r.status === 'pending')
  return (
    <Page emoji="🛠️" title="Admin" subtitle="Review requests and manage configuration.">
      <div className="space-y-6">
        <Card className="space-y-4">
          <CardHeader
            emoji="🧾"
            title="Pending requests"
            subtitle="School config requests awaiting review."
            right={
              <Link to="/admin/config">
                <Button size="sm">Request change</Button>
              </Link>
            }
          />
          <CardBody className="space-y-4">
            <div className="grid gap-2">
              {pending.slice(0, 8).map((r) => (
                <div key={r.id} className="rounded-2xl border border-white/70 bg-white/60 p-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-extrabold text-[rgb(var(--nefera-ink))]">{r.requestedBy.name}</div>
                    <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))]">{r.status}</div>
                  </div>
                  <div className="mt-1 text-xs font-semibold text-[rgb(var(--nefera-muted))]">{formatShort(r.createdAt)}</div>
                </div>
              ))}
            </div>
            {pending.length === 0 ? (
              <div className="rounded-2xl border border-white/70 bg-white/60 p-4 py-4">
                <div className="text-sm text-[rgb(var(--nefera-muted))]">No pending requests.</div>
                <div className="mt-3">
                  <Link to="/admin/config">
                    <Button variant="secondary">Request change</Button>
                  </Link>
                </div>
              </div>
            ) : null}
          </CardBody>
        </Card>

        <Card className="space-y-4">
          <CardHeader emoji="⚙️" title="Current configuration" subtitle="Read-only snapshot of active settings." />
          <CardBody className="space-y-4">
            <div className="space-y-3">
              <Section title="Features" />
              <div className="text-sm text-[rgb(var(--nefera-muted))]">
                Open Circle: {state.schoolConfig.features.openCircle ? 'Enabled' : 'Disabled'} • Reports: {state.schoolConfig.features.reports ? 'Enabled' : 'Disabled'} • Messaging:{' '}
                {state.schoolConfig.features.messaging ? 'Enabled' : 'Disabled'} • Coping tools: {state.schoolConfig.features.copingTools ? 'Enabled' : 'Disabled'} • Parent dashboard:{' '}
                {state.schoolConfig.features.parentDashboard ? 'Enabled' : 'Disabled'}
              </div>
            </div>
            <Divider />
            <div className="space-y-3">
              <Section title="Open Circle" />
              <div className="text-sm text-[rgb(var(--nefera-muted))]">Visibility: {state.schoolConfig.openCircle.visibility}</div>
            </div>
            <Divider />
            <div className="space-y-3">
              <Section title="Parent limits" />
              <div className="text-sm text-[rgb(var(--nefera-muted))]">
                Max grade: {state.schoolConfig.parent.maxGrade} • Allow beyond max: {state.schoolConfig.parent.allowBeyondMax ? 'Yes' : 'No'}
              </div>
            </div>
            <Divider />
            <div className="space-y-3">
              <Section title="Positive message" />
              <div className="text-sm text-[rgb(var(--nefera-muted))]">
                {state.schoolConfig.positiveMessage.enabled ? 'Enabled' : 'Disabled'} • Max words: {state.schoolConfig.positiveMessage.maxWords}
              </div>
              <div className="text-sm text-[rgb(var(--nefera-muted))] whitespace-pre-wrap">{state.schoolConfig.positiveMessage.text}</div>
            </div>
            <Divider />
            <div className="space-y-3">
              <Section title="Emergency contact" />
              <div className="text-sm text-[rgb(var(--nefera-muted))]">
                {state.schoolConfig.emergencyContact.title} • {state.schoolConfig.emergencyContact.phone} • {state.schoolConfig.emergencyContact.email}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </Page>
  )
}

function AdminConfig() {
  const { state, dispatch } = useNefera()
  const { user } = useAuth()
  const [draft, setDraft] = useState(() => state.schoolConfig)
  const [toast, setToast] = useState(false)

  const boolOptions = [
    { value: 'on', label: 'Enabled' },
    { value: 'off', label: 'Disabled' },
  ]

  const yesNoOptions = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ]

  function submit() {
    dispatch({
      type: 'admin/requestSchoolConfigChange',
      request: {
        id: makeId('cfg_req'),
        createdAt: new Date().toISOString(),
        requestedBy: { role: 'admin', name: user?.name ?? 'Admin' },
        config: draft,
        status: 'pending',
      },
    })
    setToast(true)
  }

  return (
    <Page emoji="⚙️" title="Config request" subtitle="Prepare a school configuration change request.">
      <div className="space-y-6">
        <Card className="space-y-4">
        <CardBody className="space-y-4">
          <div className="space-y-3">
            <Section title="Features" />
            <div className="grid gap-3 md:grid-cols-2">
              <Select
                label="Open Circle"
                value={draft.features.openCircle ? 'on' : 'off'}
                onChange={(v) => setDraft((d) => ({ ...d, features: { ...d.features, openCircle: v === 'on' } }))}
                options={boolOptions}
              />
              <Select
                label="Reports"
                value={draft.features.reports ? 'on' : 'off'}
                onChange={(v) => setDraft((d) => ({ ...d, features: { ...d.features, reports: v === 'on' } }))}
                options={boolOptions}
              />
              <Select
                label="Messaging"
                value={draft.features.messaging ? 'on' : 'off'}
                onChange={(v) => setDraft((d) => ({ ...d, features: { ...d.features, messaging: v === 'on' } }))}
                options={boolOptions}
              />
              <Select
                label="Coping tools"
                value={draft.features.copingTools ? 'on' : 'off'}
                onChange={(v) => setDraft((d) => ({ ...d, features: { ...d.features, copingTools: v === 'on' } }))}
                options={boolOptions}
              />
              <Select
                label="Parent dashboard"
                value={draft.features.parentDashboard ? 'on' : 'off'}
                onChange={(v) => setDraft((d) => ({ ...d, features: { ...d.features, parentDashboard: v === 'on' } }))}
                options={boolOptions}
              />
            </div>
          </div>

          <Divider />
          <div className="space-y-3">
            <Section title="Open Circle" />
            <div className="grid gap-3 md:grid-cols-2">
              <Select
                label="Visibility"
                value={draft.openCircle.visibility}
                onChange={(v) => setDraft((d) => ({ ...d, openCircle: { ...d.openCircle, visibility: v as 'off' | 'school' | 'class' | 'grade' | 'groups' } }))}
                options={[
                  { value: 'off', label: 'off' },
                  { value: 'school', label: 'school' },
                  { value: 'class', label: 'class' },
                  { value: 'grade', label: 'grade' },
                  { value: 'groups', label: 'groups' },
                ]}
              />
              <Input
                label="Allowed class IDs (comma separated)"
                value={draft.openCircle.allowedClassIds.join(', ')}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    openCircle: { ...d.openCircle, allowedClassIds: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) },
                  }))
                }
              />
              <Input
                label="Allowed grades (comma separated)"
                value={draft.openCircle.allowedGrades.join(', ')}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    openCircle: { ...d.openCircle, allowedGrades: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) },
                  }))
                }
              />
              <Input
                label="Allowed group IDs (comma separated)"
                value={draft.openCircle.allowedGroupIds.join(', ')}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    openCircle: { ...d.openCircle, allowedGroupIds: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) },
                  }))
                }
              />
            </div>
          </div>

          <Divider />
          <div className="space-y-3">
            <Section title="Parent limits" />
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                label="Max grade"
                inputMode="numeric"
                value={String(draft.parent.maxGrade)}
                onChange={(e) => {
                  const text = e.target.value.trim()
                  if (!text) return
                  const n = Number(text)
                  if (!Number.isFinite(n)) return
                  setDraft((d) => ({ ...d, parent: { ...d.parent, maxGrade: n } }))
                }}
              />
              <Select
                label="Allow beyond max"
                value={draft.parent.allowBeyondMax ? 'yes' : 'no'}
                onChange={(v) => setDraft((d) => ({ ...d, parent: { ...d.parent, allowBeyondMax: v === 'yes' } }))}
                options={yesNoOptions}
              />
            </div>
          </div>

          <Divider />
          <div className="space-y-3">
            <Section title="Positive message" subtitle="Shown to students on their dashboard." />
            <div className="grid gap-3 md:grid-cols-2">
              <Select
                label="Enabled"
                value={draft.positiveMessage.enabled ? 'on' : 'off'}
                onChange={(v) => setDraft((d) => ({ ...d, positiveMessage: { ...d.positiveMessage, enabled: v === 'on' } }))}
                options={boolOptions}
              />
              <Input
                label="Max words"
                inputMode="numeric"
                value={String(draft.positiveMessage.maxWords)}
                onChange={(e) => {
                  const text = e.target.value.trim()
                  if (!text) return
                  const n = Number(text)
                  if (!Number.isFinite(n)) return
                  setDraft((d) => ({ ...d, positiveMessage: { ...d.positiveMessage, maxWords: n } }))
                }}
              />
            </div>
            <TextArea
              label="Text"
              value={draft.positiveMessage.text}
              onChange={(e) => setDraft((d) => ({ ...d, positiveMessage: { ...d.positiveMessage, text: e.target.value } }))}
              inputClassName="min-h-28"
            />
          </div>

          <Divider />
          <div className="space-y-3">
            <Section title="Emergency contact" />
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                label="Title"
                value={draft.emergencyContact.title}
                onChange={(e) => setDraft((d) => ({ ...d, emergencyContact: { ...d.emergencyContact, title: e.target.value } }))}
              />
              <Input
                label="Phone"
                value={draft.emergencyContact.phone}
                onChange={(e) => setDraft((d) => ({ ...d, emergencyContact: { ...d.emergencyContact, phone: e.target.value } }))}
              />
              <Input
                label="Email"
                value={draft.emergencyContact.email}
                onChange={(e) => setDraft((d) => ({ ...d, emergencyContact: { ...d.emergencyContact, email: e.target.value } }))}
              />
            </div>
          </div>

          <Divider />
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link to="/admin/dashboard">
              <Button variant="ghost">Cancel</Button>
            </Link>
            <Button onClick={submit}>Submit request</Button>
          </div>
        </CardBody>
        </Card>
      </div>
      <Toast open={toast} tone="ok" message="Request submitted." onClose={() => setToast(false)} />
    </Page>
  )
}

function AdminProfile() {
  const { user } = useAuth()
  return (
    <Page emoji="🙋" title="Profile" subtitle="Your account details.">
      <div className="space-y-6">
        <Card className="space-y-4">
          <CardBody className="space-y-4">
            <div className="space-y-3">
              <Section title="Name" />
              <div className="text-lg font-extrabold text-[rgb(var(--nefera-ink))]">{user?.name ?? ''}</div>
            </div>
            <Divider />
            <div className="space-y-3">
              <Section title="Role" />
              <div className="text-sm font-extrabold text-[rgb(var(--nefera-ink))]">{user?.role.toUpperCase()}</div>
            </div>
          </CardBody>
        </Card>
      </div>
    </Page>
  )
}

function PrincipalAdminApprovals() {
  const { state, dispatch } = useNefera()
  const requests = state.schoolConfigRequests
  return (
    <Page emoji="✅" title="Approvals" subtitle="Review and approve pending configuration requests.">
      <div className="space-y-6">
        {requests.map((r) => (
          <Card key={r.id} className="space-y-4">
            <CardHeader
              emoji="🧾"
              title={r.requestedBy.name}
              subtitle={`${formatShort(r.createdAt)} • ${r.status}`}
              right={
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="ghost" disabled={r.status !== 'pending'} onClick={() => dispatch({ type: 'principal/rejectSchoolConfigChange', requestId: r.id })}>
                    Reject
                  </Button>
                  <Button variant="secondary" disabled={r.status !== 'pending'} onClick={() => dispatch({ type: 'principal/approveSchoolConfigChange', requestId: r.id })}>
                    Approve
                  </Button>
                </div>
              }
            />
            <CardBody className="space-y-4">
              <div className="text-sm leading-6 text-[rgb(var(--nefera-muted))]">
                Requested by {r.requestedBy.role.toUpperCase()} • Open Circle: {r.config.features.openCircle ? 'Enabled' : 'Disabled'} • Reports:{' '}
                {r.config.features.reports ? 'Enabled' : 'Disabled'} • Messaging: {r.config.features.messaging ? 'Enabled' : 'Disabled'} • Parent dashboard:{' '}
                {r.config.features.parentDashboard ? 'Enabled' : 'Disabled'} • Parent max grade: {r.config.parent.maxGrade} • Allow beyond max:{' '}
                {r.config.parent.allowBeyondMax ? 'Yes' : 'No'}
              </div>
              <Divider />
              <div className="space-y-3">
                <Section title="Config diff" subtitle="Current vs requested." />
                <div className="grid gap-2">
                  <div className="hidden grid-cols-3 gap-2 px-4 md:grid">
                    <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))]">Setting</div>
                    <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))]">Current</div>
                    <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))]">Requested</div>
                  </div>
                  {(
                    [
                      { label: 'Open Circle', current: state.schoolConfig.features.openCircle ? 'Enabled' : 'Disabled', next: r.config.features.openCircle ? 'Enabled' : 'Disabled' },
                      { label: 'Reports', current: state.schoolConfig.features.reports ? 'Enabled' : 'Disabled', next: r.config.features.reports ? 'Enabled' : 'Disabled' },
                      { label: 'Messaging', current: state.schoolConfig.features.messaging ? 'Enabled' : 'Disabled', next: r.config.features.messaging ? 'Enabled' : 'Disabled' },
                      { label: 'Coping tools', current: state.schoolConfig.features.copingTools ? 'Enabled' : 'Disabled', next: r.config.features.copingTools ? 'Enabled' : 'Disabled' },
                      { label: 'Parent dashboard', current: state.schoolConfig.features.parentDashboard ? 'Enabled' : 'Disabled', next: r.config.features.parentDashboard ? 'Enabled' : 'Disabled' },
                      { label: 'Open Circle visibility', current: state.schoolConfig.openCircle.visibility, next: r.config.openCircle.visibility },
                      { label: 'Open Circle allowed classes', current: state.schoolConfig.openCircle.allowedClassIds.join(', ') || '—', next: r.config.openCircle.allowedClassIds.join(', ') || '—' },
                      { label: 'Open Circle allowed grades', current: state.schoolConfig.openCircle.allowedGrades.join(', ') || '—', next: r.config.openCircle.allowedGrades.join(', ') || '—' },
                      { label: 'Open Circle allowed groups', current: state.schoolConfig.openCircle.allowedGroupIds.join(', ') || '—', next: r.config.openCircle.allowedGroupIds.join(', ') || '—' },
                      { label: 'Parent max grade', current: String(state.schoolConfig.parent.maxGrade), next: String(r.config.parent.maxGrade) },
                      { label: 'Allow beyond max', current: state.schoolConfig.parent.allowBeyondMax ? 'Yes' : 'No', next: r.config.parent.allowBeyondMax ? 'Yes' : 'No' },
                      { label: 'Positive message', current: state.schoolConfig.positiveMessage.enabled ? 'Enabled' : 'Disabled', next: r.config.positiveMessage.enabled ? 'Enabled' : 'Disabled' },
                      { label: 'Positive message max words', current: String(state.schoolConfig.positiveMessage.maxWords), next: String(r.config.positiveMessage.maxWords) },
                      { label: 'Positive message text', current: state.schoolConfig.positiveMessage.text, next: r.config.positiveMessage.text },
                      { label: 'Emergency title', current: state.schoolConfig.emergencyContact.title, next: r.config.emergencyContact.title },
                      { label: 'Emergency phone', current: state.schoolConfig.emergencyContact.phone, next: r.config.emergencyContact.phone },
                      { label: 'Emergency email', current: state.schoolConfig.emergencyContact.email, next: r.config.emergencyContact.email },
                    ] as const
                  ).map((row) => {
                    const changed = row.current !== row.next
                    return (
                      <div
                        key={row.label}
                        className={`rounded-2xl border bg-white/60 p-4 ${changed ? 'border-[rgba(245,158,11,0.35)]' : 'border-white/70'}`}
                      >
                        <div className="grid gap-2 md:grid-cols-3 md:items-start">
                          <div className="flex flex-wrap items-center justify-between gap-2 md:block">
                            <div className="text-sm font-extrabold tracking-tight text-[rgb(var(--nefera-ink))]">{row.label}</div>
                            <div className="md:mt-2">{changed ? <Badge tone="warn">Changed</Badge> : <Badge tone="neutral">Same</Badge>}</div>
                          </div>
                          <div className="rounded-2xl border border-[rgb(var(--nefera-border))] bg-white p-3">
                            <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))] md:hidden">Current</div>
                            <div className="text-sm font-semibold text-[rgb(var(--nefera-ink))] whitespace-pre-wrap md:mt-1">{row.current || '—'}</div>
                          </div>
                          <div className="rounded-2xl border border-[rgb(var(--nefera-border))] bg-white p-3">
                            <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))] md:hidden">Requested</div>
                            <div className="text-sm font-semibold text-[rgb(var(--nefera-ink))] whitespace-pre-wrap md:mt-1">{row.next || '—'}</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
        {requests.length === 0 ? (
          <Card className="space-y-4">
            <CardHeader emoji="🌿" title="No requests yet" subtitle="Requests will appear here as admins submit them." />
            <CardBody className="space-y-4">
              <div className="text-sm text-[rgb(var(--nefera-muted))]">This page helps leadership approve or reject configuration changes.</div>
              <Link to="/principal/dashboard">
                <Button variant="secondary">Back</Button>
              </Link>
            </CardBody>
          </Card>
        ) : null}
      </div>
    </Page>
  )
}

function ParentMessage() {
  const { state, dispatch } = useNefera()
  const navigate = useNavigate()
  const [toRole, setToRole] = useState<'teacher' | 'counselor' | 'principal'>('counselor')
  const [body, setBody] = useState('')
  const [toast, setToast] = useState(false)
  const canSend = !!body.trim()
  const canMessageSchool = state.schoolConfig.features.messaging

  if (!canMessageSchool) {
    return (
      <Page emoji="💌" title="Message school" subtitle="Share what you’re noticing at home.">
        <Card>
          <CardHeader emoji="🔒" title="Messaging is unavailable" subtitle="Your school has disabled messaging right now." />
          <CardBody className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm leading-6 text-[rgb(var(--nefera-muted))]">You can still use other tools like the home checklist.</div>
            <Button size="sm" variant="secondary" onClick={() => navigate('/parent/dashboard', { replace: true })}>
              Back
            </Button>
          </CardBody>
        </Card>
      </Page>
    )
  }

  function onSend() {
    const createdAt = new Date().toISOString()
    const childId = state.parent.children[0]?.id ?? 'stu_1'
    dispatch({ type: 'parent/sendMessage', item: { id: makeId('p_msg'), createdAt, toRole, childId, body: body.trim() } })
    setToast(true)
    window.setTimeout(() => navigate('/parent/dashboard', { replace: true }), 250)
  }

  return (
    <Page emoji="💌" title="Message school" subtitle="Share what you’re noticing at home.">
      <div className="space-y-4">
        <Card>
          <CardBody className="space-y-4">
            <Select
              label="Send to"
              value={toRole}
              onChange={(v) => setToRole(v as 'teacher' | 'counselor' | 'principal')}
              options={[
                { value: 'teacher', label: 'Teacher' },
                { value: 'counselor', label: 'Counselor' },
                { value: 'principal', label: 'Principal' },
              ]}
            />
            <TextArea label="Message" value={body} onChange={(e) => setBody(e.target.value)} inputClassName="min-h-48" />
            <Divider />
            <div className="hidden justify-end gap-2 md:flex">
              <Button variant="ghost" onClick={() => navigate('/parent/dashboard')}>
                Cancel
              </Button>
              <Button disabled={!canSend} onClick={onSend}>
                Send
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 md:hidden">
        <div className="mx-auto w-full max-w-[480px] px-3">
          <div className="border-t border-[rgb(var(--nefera-border))] bg-white px-3 py-3">
            <div className="grid grid-cols-2 gap-2">
              <Button className="h-14 w-full" variant="secondary" onClick={() => navigate('/parent/dashboard')}>
                Cancel
              </Button>
              <Button className="h-14 w-full" disabled={!canSend} onClick={onSend}>
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Toast open={toast} message="Message sent." onClose={() => setToast(false)} />
    </Page>
  )
}

function ParentReportIncident() {
  const { state, dispatch } = useNefera()
  const navigate = useNavigate()
  const [type, setType] = useState('Bullying / Harassment')
  const [desc, setDesc] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [toast, setToast] = useState(false)
  const canSubmit = !!desc.trim()
  const reportHint = useFirstVisitHint('nefera_hint_parent_report_incident_v1')
  const childId = state.parent.children[0]?.id ?? 'stu_1'
  if (!state.schoolConfig.features.reports) {
    return (
      <Page emoji="🛡️" title="Report incident" subtitle="Share what you noticed. This will be sent to school staff.">
        <Card>
          <CardHeader emoji="🔒" title="Reporting is unavailable" subtitle="Your school has disabled reports right now." />
          <CardBody className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm leading-6 text-[rgb(var(--nefera-muted))]">If you’re concerned about safety, reach out to a trusted adult or emergency services.</div>
            <Button size="sm" variant="secondary" onClick={() => navigate('/parent/dashboard', { replace: true })}>
              Back
            </Button>
          </CardBody>
        </Card>
      </Page>
    )
  }
  return (
    <Page emoji="🛡️" title="Report incident" subtitle="Share what you noticed. This will be sent to school staff.">
      {submitted ? (
        <Card className="mb-4">
          <CardHeader emoji="✅" title="Report received" subtitle="Thank you. Your report helps the school respond early." />
          <CardBody className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm leading-6 text-[rgb(var(--nefera-muted))]">If someone is in immediate danger, contact a trusted adult or emergency services.</div>
            <Button size="sm" variant="secondary" onClick={() => setSubmitted(false)}>
              Okay
            </Button>
          </CardBody>
        </Card>
      ) : null}
      {reportHint.show ? (
        <Card className="mb-4">
          <CardHeader emoji="💡" title="Quick tip" subtitle="Short notes are enough." />
          <CardBody className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm leading-6 text-[rgb(var(--nefera-muted))]">Include where/when it happened if you can. Names are optional.</div>
            <Button size="sm" variant="secondary" onClick={reportHint.dismiss}>
              Got it
            </Button>
          </CardBody>
        </Card>
      ) : null}
      <Card>
        <CardHeader emoji="📝" title="Tell us what happened" subtitle="Share only what you’re comfortable sharing." />
        <CardBody className="space-y-3">
          <Select
            label="Incident type"
            value={type}
            onChange={setType}
            options={['Bullying / Harassment', 'Unsafe behavior', 'Self-harm concern', 'Teacher concern', 'Online issue', 'Other'].map((t) => ({
              value: t,
              label: t,
            }))}
          />
          <TextArea
            value={desc}
            onChange={(e) => {
              setDesc(e.target.value)
              if (submitted) setSubmitted(false)
            }}
            label="Description"
            hint="If someone is in immediate danger, contact a trusted adult or emergency services."
          />
          <div className="hidden justify-end pt-2 md:flex">
            <Button disabled={!canSubmit} onClick={() => setConfirm(true)}>
              Submit report
            </Button>
          </div>
        </CardBody>
      </Card>
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 md:hidden">
        <div className="mx-auto w-full max-w-[480px] px-3">
          <div className="border-t border-[rgb(var(--nefera-border))] bg-white px-3 py-3">
            <div className="grid gap-2">
              <Button className="h-14 w-full" disabled={!canSubmit} onClick={() => setConfirm(true)}>
                Submit report
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Please confirm before submitting."
        description="Once submitted, this report will be shared with the appropriate school authorities for review. Are you sure you want to proceed?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(false)}>
              Cancel Submission
            </Button>
            <Button variant="secondary" onClick={() => setConfirm(false)}>
              Go Back and Edit
            </Button>
            <Button
              onClick={() => {
                const createdAt = new Date().toISOString()
                dispatch({ type: 'parent/addReport', item: { id: makeId('p_rep'), createdAt, type, body: desc.trim(), childId } })
                setConfirm(false)
                setDesc('')
                setToast(true)
                setSubmitted(true)
              }}
            >
              Confirm and Submit Report
            </Button>
          </>
        }
      >
        <div className="rounded-3xl border border-[rgba(245,158,11,0.22)] bg-[rgba(245,158,11,0.10)] p-4 text-sm text-[rgb(var(--nefera-muted))]">
          If anyone is in immediate danger, contact a trusted adult or emergency services.
        </div>
      </Modal>
      <Toast open={toast} tone="ok" message="Report submitted. Thank you for sharing." onClose={() => setToast(false)} />
    </Page>
  )
}

function ParentProfile() {
  const { user } = useAuth()
  return (
    <Page emoji="🙋" title="Profile" subtitle="Your account details.">
      <Card>
        <CardBody className="space-y-2">
          <div className="text-sm font-semibold text-[rgb(var(--nefera-muted))]">Name</div>
          <div className="text-lg font-extrabold text-[rgb(var(--nefera-ink))]">{user?.name ?? ''}</div>
          <Divider className="my-3" />
          <div className="text-sm font-semibold text-[rgb(var(--nefera-muted))]">Role</div>
          <div className="text-sm font-extrabold text-[rgb(var(--nefera-ink))]">{user?.role.toUpperCase()}</div>
        </CardBody>
      </Card>
    </Page>
  )
}

function CounselorDashboard() {
  const { state, dispatch } = useNefera()
  const { user } = useAuth()
  const navigate = useNavigate()
  const students = state.counselor.students
  const flagged = students.filter((s) => s.flags !== 'none').length
  const crisis = students.filter((s) => s.flags === 'crisis').length
  const peerObs = state.counselor.peerObservations
  const peerRiskSignals = peerObs.filter((o) => o.risk.length > 0).length
  const teacherObs = state.counselor.teacherObservations
  const reports = state.counselor.reports
  const checkIns = state.counselor.checkIns
  const sleepLogs = state.counselor.sleepLogs

  const last7 = useMemo(() => lastDaysISO(7), [])
  const checkInByDay = useMemo(() => latestCheckInByDay(checkIns), [checkIns])
  const weeklySegments = useMemo(() => {
    const counts: Record<Feeling, number> = { happy: 0, neutral: 0, flat: 0, worried: 0, sad: 0 }
    for (const day of last7) {
      const c = checkInByDay.get(day)
      if (!c) continue
      counts[c.feeling]++
    }
    return (['happy', 'neutral', 'flat', 'worried', 'sad'] as Feeling[]).map((f) => ({
      label: feelingLabel(f),
      value: counts[f],
      color: feelingPalette[f].color,
    }))
  }, [checkInByDay, last7])

  const signals = useMemo(() => wellbeingSignals(checkIns, sleepLogs), [checkIns, sleepLogs])
  const hasCheckInData = checkIns.length > 0 || sleepLogs.length > 0

  return (
    <Page emoji="🧠" title={`Welcome, ${user?.name ?? 'Counselor'}`} subtitle="Prioritize support, follow up, and document care.">
      <div className="space-y-4">
        <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
          <Card>
            <CardHeader
              emoji="🚩"
              title="Flags"
              subtitle="Students needing follow-up."
              right={<Button onClick={() => navigate('/counselor/inbox')}>Inbox 📥</Button>}
            />
            <CardBody className="grid gap-4 md:grid-cols-2">
              <StatPill emoji="🧑‍🎓" label="Students" value={`${students.length}`} />
              <StatPill emoji="🚩" label="Flagged" value={`${flagged}`} />
              <StatPill emoji="🛟" label="Crisis" value={`${crisis}`} />
              <StatPill emoji="🗂️" label="Actions" value={`${state.counselor.crisisActions.filter((a) => !a.done).length}`} />
              <StatPill emoji="🫂" label="Peer notes" value={`${peerObs.length}`} />
              <StatPill emoji="🆘" label="Risk signals" value={`${peerRiskSignals}`} />
              <StatPill emoji="🧑‍🏫" label="Teacher obs" value={`${teacherObs.length}`} />
              <StatPill emoji="🧾" label="Reports" value={`${reports.length}`} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader emoji="⚡" title="Quick actions" subtitle="Keep communication clear and calm." />
            <CardBody className="flex flex-wrap items-center gap-2">
              <Link to="/counselor/flags">
                <Button>View flags 🚩</Button>
              </Link>
              <Link to="/counselor/reports">
                <Button variant="secondary">Reports 🧾</Button>
              </Link>
              <Link to="/counselor/inbox">
                <Button variant="secondary">Inbox 📥</Button>
              </Link>
              <Link to="/counselor/students">
                <Button variant="secondary">All students 🧑‍🎓</Button>
              </Link>
              <Link to="/counselor/assessments/phq9">
                <Button variant="secondary">PHQ-9 📋</Button>
              </Link>
              <Link to="/counselor/assessments/gad7">
                <Button variant="secondary">GAD-7 🧭</Button>
              </Link>
              <Link to="/counselor/assessments/cssrs">
                <Button variant="secondary">C-SSRS 🛟</Button>
              </Link>
              <Link to="/counselor/crisis-actions">
                <Button variant="secondary">Crisis actions 🧾</Button>
              </Link>
              <Link to="/counselor/broadcast">
                <Button variant="secondary">Broadcast 📣</Button>
              </Link>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader emoji="💛" title="Student check-ins" subtitle="Signals from the last 7 days." />
          <CardBody className="grid gap-4 md:grid-cols-2 md:items-start">
            <div className="space-y-3">
              <div className="grid place-items-center rounded-2xl border border-white/70 bg-white/55 p-6 shadow-lg shadow-black/5">
                <DonutChart size={168} stroke={18} segments={weeklySegments} />
              </div>
              <ChartLegend segments={weeklySegments} />
            </div>
            <div className="space-y-3">
              <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))]">Themes</div>
              <div className="flex flex-wrap gap-2">
                {signals.themes.map((t) => (
                  <Badge key={t.label} tone={t.tone}>{t.label}</Badge>
                ))}
                {signals.themes.length === 0 && hasCheckInData ? <Badge tone="neutral">No themes detected</Badge> : null}
                {!hasCheckInData ? <Badge tone="neutral">No check-ins yet</Badge> : null}
              </div>
              <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))]">Patterns</div>
              <div className="flex flex-wrap gap-2">
                {signals.patterns.map((p) => (
                  <Badge key={p.label} tone={p.tone}>{p.label}</Badge>
                ))}
                {signals.patterns.length === 0 && hasCheckInData ? <Badge tone="neutral">No patterns detected</Badge> : null}
                {!hasCheckInData ? <Badge tone="neutral">No sleep logs yet</Badge> : null}
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader emoji="🧾" title="Crisis actions" subtitle="Track the steps you’ve taken." />
          <CardBody className="grid gap-2">
            {state.counselor.crisisActions.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => dispatch({ type: 'counselor/toggleCrisisAction', id: a.id })}
                className={cx(
                  'flex items-start gap-3 rounded-2xl border border-[rgb(var(--nefera-border))] bg-white p-4 text-left shadow-none transition-all duration-200 ease-out active:translate-y-0 md:border-white/70 md:bg-white/60 md:shadow-lg md:shadow-black/5 md:hover:-translate-y-0.5 md:hover:bg-white/80 md:hover:shadow-xl md:hover:shadow-black/10',
                  a.done ? 'opacity-70' : '',
                )}
              >
                <div className={cx('mt-0.5 grid h-6 w-6 place-items-center rounded-full border bg-white text-xs font-extrabold', a.done ? 'border-[rgba(34,197,94,0.30)]' : 'border-white/70')}>
                  {a.done ? '✓' : ''}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[rgb(var(--nefera-ink))]">{a.body}</div>
                  <div className="mt-1 text-xs font-semibold text-[rgb(var(--nefera-muted))]">{formatShort(a.createdAt)}</div>
                </div>
              </button>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader emoji="🫂" title="Peer observations" subtitle="Anonymous signals to support early identification." />
          <CardBody className="grid gap-2">
            {peerObs.slice(0, 6).map((o) => (
              <div key={o.id} className="rounded-2xl border border-white/70 bg-white/60 p-4 shadow-lg shadow-black/5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-[rgb(var(--nefera-ink))]">{formatShort(o.createdAt)}</div>
                    <div className="mt-1 text-xs font-semibold text-[rgb(var(--nefera-muted))]">
                      Anxiety {o.anxiety.length} • Depression {o.depression.length} • Risk {o.risk.length}
                    </div>
                  </div>
                  {o.risk.length > 0 ? <Badge tone="danger">Risk</Badge> : <Badge tone="neutral">Info</Badge>}
                </div>
              </div>
            ))}
            {peerObs.length === 0 ? (
              <div className="rounded-2xl border border-white/70 bg-white/60 p-4 text-sm text-[rgb(var(--nefera-muted))]">
                <div>No peer observations yet.</div>
                <div className="mt-3">
                  <Link to="/counselor/students">
                    <Button size="sm" variant="secondary">
                      All students 🧑‍🎓
                    </Button>
                  </Link>
                </div>
              </div>
            ) : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader emoji="🧑‍🏫" title="Teacher observations" subtitle="Recent checklists shared for follow-up." />
          <CardBody className="grid gap-2">
            {teacherObs.slice(0, 6).map((o) => {
              const student = students.find((s) => s.id === o.studentId)
              const label = student ? `${student.name} • ${student.grade}` : `Student ${o.studentId}`
              return (
                <div key={o.id} className="rounded-2xl border border-white/70 bg-white/60 p-4 shadow-lg shadow-black/5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-extrabold text-[rgb(var(--nefera-ink))]">{formatShort(o.createdAt)}</div>
                      <div className="mt-1 text-xs font-semibold text-[rgb(var(--nefera-muted))]">
                        {label} • {o.items.length} item{o.items.length === 1 ? '' : 's'}
                      </div>
                    </div>
                    {o.items.length > 0 ? <Badge tone="warn">Observation</Badge> : <Badge tone="neutral">Info</Badge>}
                  </div>
                  {o.items.length > 0 ? (
                    <div className="mt-2 text-sm text-[rgb(var(--nefera-muted))] whitespace-pre-wrap">{o.items.join('\n')}</div>
                  ) : null}
                </div>
              )
            })}
            {teacherObs.length === 0 ? (
              <div className="rounded-2xl border border-white/70 bg-white/60 p-4 text-sm text-[rgb(var(--nefera-muted))]">
                <div>No teacher observations yet.</div>
                <div className="mt-3">
                  <Link to="/counselor/students">
                    <Button size="sm" variant="secondary">
                      All students 🧑‍🎓
                    </Button>
                  </Link>
                </div>
              </div>
            ) : null}
          </CardBody>
        </Card>
      </div>
    </Page>
  )
}

function CounselorFlags() {
  const { state } = useNefera()
  const flagged = state.counselor.students.filter((s) => s.flags !== 'none')
  return (
    <Page emoji="🚩" title="Flagged students" subtitle="Open a student to review questionnaires and plan follow-up.">
      <div className="grid gap-3">
        {flagged.map((s) => (
          <Link key={s.id} to={`/counselor/students/${s.id}`} className="rounded-2xl border border-white/70 bg-white/60 p-5 shadow-lg shadow-black/5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-base font-extrabold tracking-tight text-[rgb(var(--nefera-ink))]">{s.name}</div>
                <div className="mt-1 text-xs font-semibold text-[rgb(var(--nefera-muted))]">{s.grade}</div>
              </div>
              <Badge tone={flagTone(s.flags)}>{flagLabel(s.flags)}</Badge>
            </div>
          </Link>
        ))}
        {flagged.length === 0 ? (
          <Card>
            <CardHeader emoji="🌿" title="No flags right now" subtitle="Keep an eye on trends and follow up early." />
            <CardBody className="text-sm text-[rgb(var(--nefera-muted))]">
              When a student is flagged, this list helps you prioritize outreach and document actions.
            </CardBody>
          </Card>
        ) : null}
      </div>
    </Page>
  )
}

function CounselorStudents() {
  const { state } = useNefera()
  const students = state.counselor.students
  return (
    <Page emoji="🧑‍🎓" title="Students" subtitle="Open a student to review questionnaires and plan follow-up.">
      <div className="grid gap-3">
        {students.map((s) => (
          <Link key={s.id} to={`/counselor/students/${s.id}`} className="rounded-2xl border border-white/70 bg-white/60 p-5 shadow-lg shadow-black/5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-base font-extrabold tracking-tight text-[rgb(var(--nefera-ink))]">{s.name}</div>
                <div className="mt-1 text-xs font-semibold text-[rgb(var(--nefera-muted))]">{s.grade}</div>
              </div>
              <Badge tone={flagTone(s.flags)}>{flagLabel(s.flags)}</Badge>
            </div>
          </Link>
        ))}
      </div>
    </Page>
  )
}

function CounselorCrisisActions() {
  const { state, dispatch } = useNefera()
  const navigate = useNavigate()
  const openCount = state.counselor.crisisActions.filter((a) => !a.done).length
  return (
    <Page emoji="🧾" title="Crisis actions" subtitle="Track the steps you’ve taken.">
      <Card>
        <CardBody className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))]">Open actions</div>
            <div className="text-sm font-extrabold text-[rgb(var(--nefera-ink))]">{openCount}</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => navigate('/counselor/dashboard')}>
              Back
            </Button>
          </div>
        </CardBody>
      </Card>
      <Card className="mt-4">
        <CardHeader emoji="🗂️" title="Action list" subtitle="Tap to mark an action as done." />
        <CardBody className="grid gap-2">
          {state.counselor.crisisActions.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => dispatch({ type: 'counselor/toggleCrisisAction', id: a.id })}
              className={cx(
                'flex items-start gap-3 rounded-2xl border border-white/70 bg-white/60 p-4 text-left shadow-lg shadow-black/5 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/80 hover:shadow-xl active:translate-y-0',
                a.done ? 'opacity-70' : '',
              )}
            >
              <div className={cx('mt-0.5 grid h-6 w-6 place-items-center rounded-full border bg-white text-xs font-extrabold', a.done ? 'border-[rgba(34,197,94,0.30)]' : 'border-white/70')}>
                {a.done ? '✓' : ''}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[rgb(var(--nefera-ink))]">{a.body}</div>
                <div className="mt-1 text-xs font-semibold text-[rgb(var(--nefera-muted))]">{formatShort(a.createdAt)}</div>
              </div>
            </button>
          ))}
        </CardBody>
      </Card>
    </Page>
  )
}

function CounselorBroadcast() {
  const { dispatch } = useNefera()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [toast, setToast] = useState(false)
  const canSend = !!title.trim() && !!body.trim()

  function onSend() {
    const createdAt = new Date().toISOString()
    dispatch({ type: 'counselor/addBroadcast', item: { id: makeId('c_brd'), createdAt, title: title.trim(), body: body.trim() } })
    setToast(true)
    window.setTimeout(() => navigate('/counselor/dashboard', { replace: true }), 250)
  }

  return (
    <Page emoji="📣" title="Broadcast" subtitle="Send a supportive message to students.">
      <Card>
        <CardBody className="space-y-3">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <TextArea label="Message" value={body} onChange={(e) => setBody(e.target.value)} inputClassName="min-h-40" />
          <Divider />
          <div className="hidden justify-end gap-2 md:flex">
            <Button variant="ghost" onClick={() => navigate('/counselor/dashboard')}>
              Cancel
            </Button>
            <Button disabled={!canSend} onClick={onSend}>
              Send
            </Button>
          </div>
        </CardBody>
      </Card>
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 md:hidden">
        <div className="mx-auto w-full max-w-[480px] px-3">
          <div className="border-t border-[rgb(var(--nefera-border))] bg-white px-3 py-3">
            <div className="grid grid-cols-2 gap-2">
              <Button className="h-14 w-full" variant="secondary" onClick={() => navigate('/counselor/dashboard')}>
                Cancel
              </Button>
              <Button className="h-14 w-full" disabled={!canSend} onClick={onSend}>
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Toast open={toast} message="Broadcast sent." onClose={() => setToast(false)} />
    </Page>
  )
}

function CounselorProfile() {
  const { user } = useAuth()
  return (
    <Page emoji="🙋" title="Profile" subtitle="Your account details.">
      <Card>
        <CardBody className="space-y-2">
          <div className="text-sm font-semibold text-[rgb(var(--nefera-muted))]">Name</div>
          <div className="text-lg font-extrabold text-[rgb(var(--nefera-ink))]">{user?.name ?? ''}</div>
          <Divider className="my-3" />
          <div className="text-sm font-semibold text-[rgb(var(--nefera-muted))]">Role</div>
          <div className="text-sm font-extrabold text-[rgb(var(--nefera-ink))]">{user?.role.toUpperCase()}</div>
        </CardBody>
      </Card>
    </Page>
  )
}

function PrincipalDashboard() {
  const { state } = useNefera()
  const { user } = useAuth()
  const navigate = useNavigate()
  const reports = state.principal.reports
  const students = state.teacher.students
  const flagged = students.filter((s) => s.flags !== 'none').length
  const checkIns = state.principal.checkIns
  const sleepLogs = state.principal.sleepLogs

  const last7 = useMemo(() => lastDaysISO(7), [])
  const checkInByDay = useMemo(() => latestCheckInByDay(checkIns), [checkIns])
  const weeklySegments = useMemo(() => {
    const counts: Record<Feeling, number> = { happy: 0, neutral: 0, flat: 0, worried: 0, sad: 0 }
    for (const day of last7) {
      const c = checkInByDay.get(day)
      if (!c) continue
      counts[c.feeling]++
    }
    return (['happy', 'neutral', 'flat', 'worried', 'sad'] as Feeling[]).map((f) => ({
      label: feelingLabel(f),
      value: counts[f],
      color: feelingPalette[f].color,
    }))
  }, [checkInByDay, last7])

  const signals = useMemo(() => wellbeingSignals(checkIns, sleepLogs), [checkIns, sleepLogs])
  const hasCheckInData = checkIns.length > 0 || sleepLogs.length > 0

  return (
    <Page emoji="🏫" title={`Welcome, ${user?.name ?? 'Principal'}`} subtitle="School-wide insight and reporting.">
      <div className="space-y-4">
        <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
          <Card>
            <CardHeader
              emoji="📈"
              title="Overview"
              subtitle="High-level signals for the week."
              right={<Button onClick={() => navigate('/principal/inbox')}>Inbox 📥</Button>}
            />
            <CardBody className="grid gap-4 md:grid-cols-2">
              <StatPill emoji="🚩" label="Flagged" value={`${flagged}`} />
              <StatPill emoji="🛡️" label="Reports" value={`${reports.length}`} />
              <StatPill emoji="🟢" label="Resolved" value={`${reports.filter((r) => r.status === 'resolved').length}`} />
              <StatPill emoji="🟡" label="In review" value={`${reports.filter((r) => r.status !== 'resolved').length}`} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader emoji="⚡" title="Quick actions" subtitle="Communicate and review reports." />
            <CardBody className="flex flex-wrap items-center gap-2">
              <Link to="/principal/reports">
                <Button>View reports 🧾</Button>
              </Link>
              <Link to="/principal/inbox">
                <Button variant="secondary">Inbox 📥</Button>
              </Link>
              <Link to="/principal/broadcast">
                <Button variant="secondary">Broadcast 📣</Button>
              </Link>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader emoji="💛" title="Check-in signals" subtitle="Aggregate view from the last 7 days." />
          <CardBody className="grid gap-4 md:grid-cols-2 md:items-start">
            <div className="space-y-3">
              <div className="grid place-items-center rounded-2xl border border-white/70 bg-white/55 p-6 shadow-lg shadow-black/5">
                <DonutChart size={168} stroke={18} segments={weeklySegments} />
              </div>
              <ChartLegend segments={weeklySegments} />
            </div>
            <div className="space-y-3">
              <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))]">Themes</div>
              <div className="flex flex-wrap gap-2">
                {signals.themes.map((t) => (
                  <Badge key={t.label} tone={t.tone}>{t.label}</Badge>
                ))}
                {signals.themes.length === 0 && hasCheckInData ? <Badge tone="neutral">No themes detected</Badge> : null}
                {!hasCheckInData ? <Badge tone="neutral">No check-ins yet</Badge> : null}
              </div>
              <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))]">Patterns</div>
              <div className="flex flex-wrap gap-2">
                {signals.patterns.map((p) => (
                  <Badge key={p.label} tone={p.tone}>{p.label}</Badge>
                ))}
                {signals.patterns.length === 0 && hasCheckInData ? <Badge tone="neutral">No patterns detected</Badge> : null}
                {!hasCheckInData ? <Badge tone="neutral">No sleep logs yet</Badge> : null}
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader emoji="🛡️" title="Latest reports" subtitle="Newest items first." />
          <CardBody className="grid gap-2">
            {reports.slice(0, 6).map((r) => (
              <div key={r.id} className="rounded-2xl border border-[rgb(var(--nefera-border))] bg-white p-4 shadow-none md:border-white/70 md:bg-white/60 md:shadow-lg md:shadow-black/5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-extrabold text-[rgb(var(--nefera-ink))]">{r.type}</div>
                  <Badge tone={r.status === 'resolved' ? 'ok' : r.status === 'reviewing' ? 'warn' : 'neutral'}>{r.status}</Badge>
                </div>
                <div className="mt-1 text-xs font-semibold text-[rgb(var(--nefera-muted))]">{formatShort(r.createdAt)}</div>
                <div className="mt-2 text-sm text-[rgb(var(--nefera-muted))] whitespace-pre-wrap">{r.description}</div>
                <div className="mt-2 text-xs font-semibold text-[rgb(var(--nefera-muted))] whitespace-pre-wrap">
                  • readAtBySchool: {r.readAtBySchool ? formatShort(r.readAtBySchool) : '—'}
                  {'\n'}• closedAt: {r.closedAt ? formatShort(r.closedAt) : '—'}
                  {'\n'}• closure note: {r.closureNote ? r.closureNote : '—'}
                </div>
              </div>
            ))}
            {reports.length === 0 ? (
              <div className="rounded-2xl border border-white/70 bg-white/60 p-4 text-sm text-[rgb(var(--nefera-muted))]">
                <div>No reports yet.</div>
                <div className="mt-3">
                  <Link to="/principal/reports">
                    <Button size="sm" variant="secondary">
                      View reports 🧾
                    </Button>
                  </Link>
                </div>
              </div>
            ) : null}
          </CardBody>
        </Card>
      </div>
    </Page>
  )
}

function PrincipalBroadcast() {
  const { dispatch } = useNefera()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [toast, setToast] = useState(false)
  const canSend = !!title.trim() && !!body.trim()

  function onSend() {
    const createdAt = new Date().toISOString()
    dispatch({ type: 'principal/addBroadcast', item: { id: makeId('pr_brd'), createdAt, title: title.trim(), body: body.trim() } })
    setToast(true)
    window.setTimeout(() => navigate('/principal/dashboard', { replace: true }), 250)
  }

  return (
    <Page emoji="📣" title="Broadcast" subtitle="Send a school-wide message.">
      <Card>
        <CardBody className="space-y-3">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <TextArea label="Message" value={body} onChange={(e) => setBody(e.target.value)} inputClassName="min-h-40" />
          <Divider />
          <div className="hidden justify-end gap-2 md:flex">
            <Button variant="ghost" onClick={() => navigate('/principal/dashboard')}>
              Cancel
            </Button>
            <Button disabled={!canSend} onClick={onSend}>
              Send
            </Button>
          </div>
        </CardBody>
      </Card>
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 md:hidden">
        <div className="mx-auto w-full max-w-[480px] px-3">
          <div className="border-t border-[rgb(var(--nefera-border))] bg-white px-3 py-3">
            <div className="grid grid-cols-2 gap-2">
              <Button className="h-14 w-full" variant="secondary" onClick={() => navigate('/principal/dashboard')}>
                Cancel
              </Button>
              <Button className="h-14 w-full" disabled={!canSend} onClick={onSend}>
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Toast open={toast} message="Broadcast sent." onClose={() => setToast(false)} />
    </Page>
  )
}

function PrincipalProfile() {
  const { user } = useAuth()
  return (
    <Page emoji="🙋" title="Profile" subtitle="Your account details.">
      <Card>
        <CardBody className="space-y-2">
          <div className="text-sm font-semibold text-[rgb(var(--nefera-muted))]">Name</div>
          <div className="text-lg font-extrabold text-[rgb(var(--nefera-ink))]">{user?.name ?? ''}</div>
          <Divider className="my-3" />
          <div className="text-sm font-semibold text-[rgb(var(--nefera-muted))]">Role</div>
          <div className="text-sm font-extrabold text-[rgb(var(--nefera-ink))]">{user?.role.toUpperCase()}</div>
        </CardBody>
      </Card>
    </Page>
  )
}

const LazyStudentReports = React.lazy(() => import('./student.lazy').then((m) => ({ default: m.StudentReports })))
const LazyStudentOpenCircle = React.lazy(() => import('./student.lazy').then((m) => ({ default: m.StudentOpenCircle })))
const LazyCounselorStudentDetail = React.lazy(() => import('./counselor.lazy').then((m) => ({ default: m.CounselorStudentDetail })))
const LazyCounselorReports = React.lazy(() => import('./counselor.lazy').then((m) => ({ default: m.CounselorReports })))
const LazyCounselorAssessmentPhq9 = React.lazy(() => import('./counselor.lazy').then((m) => ({ default: m.CounselorAssessmentPhq9 })))
const LazyCounselorAssessmentGad7 = React.lazy(() => import('./counselor.lazy').then((m) => ({ default: m.CounselorAssessmentGad7 })))
const LazyCounselorAssessmentCssrs = React.lazy(() => import('./counselor.lazy').then((m) => ({ default: m.CounselorAssessmentCssrs })))
const LazyPrincipalReports = React.lazy(() => import('./principal.lazy').then((m) => ({ default: m.PrincipalReports })))

function LazyBoundary({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="p-4 md:p-6">
          <Card>
            <CardBody className="animate-pulse space-y-3">
              <div className="h-5 w-44 rounded-full bg-black/10" />
              <div className="h-4 w-72 rounded-full bg-black/10" />
              <div className="h-32 w-full rounded-2xl border border-white/70 bg-white/55" />
            </CardBody>
          </Card>
        </div>
      }
    >
      {children}
    </Suspense>
  )
}

export function NeferaRoutes() {
  const { state } = useNefera()
  const parentDefaultPath = state.schoolConfig.features.parentDashboard
    ? '/parent/dashboard'
    : state.schoolConfig.features.messaging
      ? '/parent/message'
      : state.schoolConfig.features.reports
        ? '/parent/report-incident'
        : '/parent/profile'
  return (
    <Routes>
      <Route path="/" element={<RoleEntry />} />
      <Route path="/welcome" element={<WelcomePage />} />
      <Route path="/role" element={<RoleSelectPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="/student" element={<RequireAuth role="student"><Navigate to="/student/dashboard" replace /></RequireAuth>} />
        <Route path="/student/dashboard" element={<RequireAuth role="student"><StudentDashboard /></RequireAuth>} />
        <Route path="/student/check-in" element={<RequireAuth role="student"><StudentCheckInEntry /></RequireAuth>} />
        <Route path="/student/check-in/:feeling" element={<RequireAuth role="student"><StudentCheckInFlow /></RequireAuth>} />
        <Route path="/student/coping" element={<RequireAuth role="student"><StudentCopingTools /></RequireAuth>} />
        <Route path="/student/sleep" element={<RequireAuth role="student"><StudentSleepTracker /></RequireAuth>} />

        <Route path="/student/journal/write" element={<RequireAuth role="student"><StudentJournalWrite /></RequireAuth>} />
        <Route path="/student/journal/past" element={<RequireAuth role="student"><StudentJournalPast /></RequireAuth>} />
        <Route path="/student/journal/history" element={<RequireAuth role="student"><StudentJournalPast /></RequireAuth>} />
        <Route path="/student/journal/gratitude" element={<RequireAuth role="student"><StudentGratitude /></RequireAuth>} />
        <Route path="/student/reports" element={<RequireAuth role="student"><LazyBoundary><LazyStudentReports /></LazyBoundary></RequireAuth>} />
        <Route path="/student/habits" element={<RequireAuth role="student"><StudentHabits /></RequireAuth>} />
        <Route path="/student/soul-space" element={<RequireAuth role="student"><StudentSoulSpace /></RequireAuth>} />
        <Route path="/student/ai" element={<RequireAuth role="student"><StudentAICompanion /></RequireAuth>} />
        <Route path="/student/groups" element={<RequireAuth role="student"><StudentGroups /></RequireAuth>} />
        <Route path="/student/inbox" element={<RequireAuth role="student"><StudentInbox /></RequireAuth>} />
        <Route path="/student/open-circle" element={<RequireAuth role="student"><LazyBoundary><LazyStudentOpenCircle /></LazyBoundary></RequireAuth>} />
        <Route path="/student/report-incident" element={<RequireAuth role="student"><StudentReportIncident /></RequireAuth>} />
        <Route path="/student/help-batchmates" element={<RequireAuth role="student"><StudentHelpBatchmates /></RequireAuth>} />
        <Route path="/student/profile" element={<RequireAuth role="student"><StudentProfile /></RequireAuth>} />

        <Route path="/teacher" element={<RequireAuth role="teacher"><Navigate to="/teacher/dashboard" replace /></RequireAuth>} />
        <Route path="/teacher/dashboard" element={<RequireAuth role="teacher"><TeacherDashboard /></RequireAuth>} />
        <Route path="/teacher/broadcast" element={<RequireAuth role="teacher"><TeacherBroadcast /></RequireAuth>} />
        <Route path="/teacher/inbox" element={<RequireAuth role="teacher"><TeacherInbox /></RequireAuth>} />
        <Route path="/teacher/students" element={<RequireAuth role="teacher"><TeacherStudents /></RequireAuth>} />
        <Route path="/teacher/students/:id" element={<RequireAuth role="teacher"><TeacherObservationChecklist /></RequireAuth>} />
        <Route path="/teacher/profile" element={<RequireAuth role="teacher"><TeacherProfile /></RequireAuth>} />

        <Route path="/parent" element={<RequireAuth role="parent"><Navigate to={parentDefaultPath} replace /></RequireAuth>} />
        <Route
          path="/parent/dashboard"
          element={
            <RequireAuth role="parent">
              {state.schoolConfig.features.parentDashboard ? <ParentDashboard /> : <Navigate to={parentDefaultPath} replace />}
            </RequireAuth>
          }
        />
        <Route path="/parent/message" element={<RequireAuth role="parent"><ParentMessage /></RequireAuth>} />
        <Route path="/parent/checklist" element={<RequireAuth role="parent"><ParentObservationChecklist /></RequireAuth>} />
        <Route path="/parent/report-incident" element={<RequireAuth role="parent"><ParentReportIncident /></RequireAuth>} />
        <Route path="/parent/profile" element={<RequireAuth role="parent"><ParentProfile /></RequireAuth>} />

        <Route path="/counselor" element={<RequireAuth role="counselor"><Navigate to="/counselor/dashboard" replace /></RequireAuth>} />
        <Route path="/counselor/dashboard" element={<RequireAuth role="counselor"><CounselorDashboard /></RequireAuth>} />
        <Route path="/counselor/flags" element={<RequireAuth role="counselor"><CounselorFlags /></RequireAuth>} />
        <Route path="/counselor/reports" element={<RequireAuth role="counselor"><LazyBoundary><LazyCounselorReports /></LazyBoundary></RequireAuth>} />
        <Route path="/counselor/inbox" element={<RequireAuth role="counselor"><CounselorInbox /></RequireAuth>} />
        <Route path="/counselor/students" element={<RequireAuth role="counselor"><CounselorStudents /></RequireAuth>} />
        <Route path="/counselor/students/:id" element={<RequireAuth role="counselor"><LazyBoundary><LazyCounselorStudentDetail /></LazyBoundary></RequireAuth>} />
        <Route path="/counselor/assessments/phq9" element={<RequireAuth role="counselor"><LazyBoundary><LazyCounselorAssessmentPhq9 /></LazyBoundary></RequireAuth>} />
        <Route path="/counselor/assessments/gad7" element={<RequireAuth role="counselor"><LazyBoundary><LazyCounselorAssessmentGad7 /></LazyBoundary></RequireAuth>} />
        <Route path="/counselor/assessments/cssrs" element={<RequireAuth role="counselor"><LazyBoundary><LazyCounselorAssessmentCssrs /></LazyBoundary></RequireAuth>} />
        <Route path="/counselor/crisis-actions" element={<RequireAuth role="counselor"><CounselorCrisisActions /></RequireAuth>} />
        <Route path="/counselor/broadcast" element={<RequireAuth role="counselor"><CounselorBroadcast /></RequireAuth>} />
        <Route path="/counselor/profile" element={<RequireAuth role="counselor"><CounselorProfile /></RequireAuth>} />

        <Route path="/principal" element={<RequireAuth role="principal"><Navigate to="/principal/dashboard" replace /></RequireAuth>} />
        <Route path="/principal/dashboard" element={<RequireAuth role="principal"><PrincipalDashboard /></RequireAuth>} />
        <Route path="/principal/reports" element={<RequireAuth role="principal"><LazyBoundary><LazyPrincipalReports /></LazyBoundary></RequireAuth>} />
        <Route path="/principal/admin-approvals" element={<RequireAuth role="principal"><PrincipalAdminApprovals /></RequireAuth>} />
        <Route path="/principal/broadcast" element={<RequireAuth role="principal"><PrincipalBroadcast /></RequireAuth>} />
        <Route path="/principal/inbox" element={<RequireAuth role="principal"><PrincipalInbox /></RequireAuth>} />
        <Route path="/principal/profile" element={<RequireAuth role="principal"><PrincipalProfile /></RequireAuth>} />

        <Route path="/admin" element={<RequireAuth role="admin"><Navigate to="/admin/dashboard" replace /></RequireAuth>} />
        <Route path="/admin/dashboard" element={<RequireAuth role="admin"><AdminDashboard /></RequireAuth>} />
        <Route path="/admin/config" element={<RequireAuth role="admin"><AdminConfig /></RequireAuth>} />
        <Route path="/admin/profile" element={<RequireAuth role="admin"><AdminProfile /></RequireAuth>} />
      </Route>

      <Route path="*" element={<Navigate to="/welcome" replace />} />
    </Routes>
  )
}
