import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { makeId, useNefera } from './state'
import { Badge, Button, Card, CardBody, CardHeader, Modal, Page, Select, TextArea, Toast, cx, flagLabel, flagTone } from './ui'

function sum(nums: number[]) {
  return nums.reduce((a, b) => a + b, 0)
}

function formatShort(value: string | number) {
  const d = new Date(value)
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function phq9Severity(total: number) {
  if (total <= 4) return { label: 'Minimal depression', action: 'Monitor; no intervention needed' }
  if (total <= 9) return { label: 'Mild depression', action: 'Watchful waiting; lifestyle modifications' }
  if (total <= 14) return { label: 'Moderate depression', action: 'Counselor support recommended' }
  if (total <= 19) return { label: 'Moderately severe depression', action: 'Counselor + psychiatric evaluation' }
  return { label: 'Severe depression', action: 'Urgent psychiatric intervention required' }
}

function gad7Severity(total: number) {
  if (total <= 4) return { label: 'Minimal anxiety', action: 'No intervention needed' }
  if (total <= 9) return { label: 'Mild anxiety', action: 'Monitor; suggest coping strategies' }
  if (total <= 14) return { label: 'Moderate anxiety', action: 'Counselor support and interventions' }
  return { label: 'Severe anxiety', action: 'Urgent psychiatric evaluation required' }
}

function cssrsRisk(answers: boolean[]) {
  const q0 = !!answers[0]
  const q1 = !!answers[1]
  const q2 = !!answers[2]
  const q3 = !!answers[3]
  const q4 = !!answers[4]
  const q5 = !!answers[5]
  if (!q0 && !q1 && !q2 && !q3 && !q4 && !q5) return { level: 'None', action: '🟢 Green – Continue monitoring' }
  if (q5) return { level: 'Extreme', action: '🚨🚨🚨 Maximum – Recent attempt/active preparation; emergency intervention' }
  if (q4) return { level: 'High', action: '🚨 Red/Emergency – Intent + plan; psychiatric hospitalization pathway' }
  if (q2 || q3) return { level: 'Moderate', action: '🔴 Red – Active ideation with plan; urgent assessment' }
  if (q0 || q1) return { level: 'Low', action: '🟠 Orange – Passive ideation; counsel close follow-up' }
  return { level: 'Low', action: '🟠 Orange – Passive ideation; counsel close follow-up' }
}

export function CounselorAssessmentPhq9() {
  const { state, dispatch } = useNefera()
  const navigate = useNavigate()
  const [search] = useSearchParams()
  const students = state.counselor.students
  const [studentId, setStudentId] = useState<string>(search.get('student') ?? students[0]?.id ?? '')
  const selected = students.find((s) => s.id === studentId) ?? students[0]
  const [answers, setAnswers] = useState<number[]>(selected?.phq9?.answers ?? Array.from({ length: 9 }, () => 0))
  const [toast, setToast] = useState(false)
  const [alertOpen, setAlertOpen] = useState(false)

  const scaleOptions = [
    { value: '0', label: '0' },
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
  ]

  const items = [
    'Little interest or pleasure in doing things',
    'Feeling down, depressed, or hopeless',
    'Trouble falling or staying asleep, or sleeping too much',
    'Feeling tired or having little energy',
    'Poor appetite or overeating',
    'Feeling bad about yourself',
    'Trouble concentrating on things',
    'Moving or speaking slowly, or being fidgety/restless',
    'Thoughts of self-harm or that you would be better off dead',
  ]

  const total = sum(answers)
  const sev = phq9Severity(total)
  const q9Positive = (answers[8] ?? 0) >= 1
  const helplines = ['Tele-MANAS 14416', 'KIRAN 1800-599-0019']
  const messages = [
    'Thank you for sharing this. Your feelings matter.',
    'Please reach out to a parent or another trusted adult for support.',
    'If you need immediate help, call a government toll-free helpline.',
  ]
  const suggestions = ['Try slow breathing (in 1-2-3, out 1-2-3-4).', 'Try grounding: 3 things you see, 2 you touch, 1 you hear.']

  function onSave() {
    const createdAt = new Date().toISOString()
    dispatch({ type: 'counselor/savePhq9', studentId: selected?.id ?? 's_1', answers, createdAt })
    if (q9Positive && selected?.id) {
      dispatch({
        type: 'counselor/addSafetyEvent',
        event: { id: `evt_${createdAt}`, createdAt, studentId: selected.id, kind: 'phq9_q9_positive', shownHelplines: helplines, shownMessages: messages, shownSuggestions: suggestions },
      })
      dispatch({ type: 'teacher/setStudentFlags', studentId: selected.id, flags: 'crisis' })
      setAlertOpen(true)
    }
    setToast(true)
  }

  return (
    <Page emoji="📋" title="PHQ-9" subtitle="Score and save a student questionnaire.">
      <Card>
        <CardBody className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))]">Student</div>
            <div className="mt-1">
              <Select
                value={selected?.id ?? ''}
                onChange={(v) => {
                  setStudentId(v)
                  const next = students.find((s) => s.id === v)
                  setAnswers(next?.phq9?.answers ?? Array.from({ length: 9 }, () => 0))
                }}
                options={students.map((s) => ({ value: s.id, label: `${s.name} • ${s.grade}` }))}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Total: {total}</Badge>
            <Badge>{sev.label}</Badge>
            <Button variant="secondary" onClick={() => navigate('/counselor/dashboard')}>
              Back
            </Button>
          </div>
        </CardBody>
      </Card>

      <div className="mt-4 grid gap-3">
        {items.map((q, idx) => (
          <div key={q} className="rounded-2xl border border-white/70 bg-white/60 p-4">
            <div className="text-sm font-semibold text-[rgb(var(--nefera-ink))]">{q}</div>
            <div className="mt-3">
              <Select value={String(answers[idx] ?? 0)} onChange={(v) => setAnswers((arr) => arr.map((x, i) => (i === idx ? Number(v) : x)))} options={scaleOptions} />
            </div>
          </div>
        ))}
        <div className="hidden justify-end md:flex">
          <Button onClick={onSave}>Save PHQ-9</Button>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-[88px] z-40 md:hidden">
        <div className="mx-auto w-full max-w-6xl px-4">
          <div className="rounded-2xl border border-white/70 bg-white/70 p-3 shadow-lg shadow-black/10 backdrop-blur">
            <div className="flex items-center justify-end gap-2">
              <Button className="min-w-40" onClick={onSave}>
                Save PHQ-9
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Toast open={toast} message="Saved PHQ-9." onClose={() => setToast(false)} />
      <Modal
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        title="Immediate support"
        description="A response indicated possible self-harm risk. Show helplines and administer C-SSRS within 1 hour."
        footer={
          <>
            <Button variant="secondary" onClick={() => navigate(`/counselor/assessments/cssrs?student=${encodeURIComponent(selected?.id ?? '')}`)}>
              Open C-SSRS
            </Button>
            <Button onClick={() => setAlertOpen(false)}>Done</Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="rounded-2xl border border-white/70 bg-white/70 p-4 text-sm text-[rgb(var(--nefera-muted))] whitespace-pre-wrap">
            {messages.join('\n')}
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/70 p-4 text-sm text-[rgb(var(--nefera-muted))]">
            <div className="text-sm font-extrabold text-[rgb(var(--nefera-ink))]">Government toll-free helplines</div>
            <div className="mt-2 grid gap-1">
              {helplines.map((h) => (
                <div key={h} className="text-sm font-semibold text-[rgb(var(--nefera-ink))]">
                  {h}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/70 p-4 text-sm text-[rgb(var(--nefera-muted))] whitespace-pre-wrap">
            {suggestions.join('\n')}
          </div>
        </div>
      </Modal>
    </Page>
  )
}

export function CounselorAssessmentGad7() {
  const { state, dispatch } = useNefera()
  const navigate = useNavigate()
  const [search] = useSearchParams()
  const students = state.counselor.students
  const [studentId, setStudentId] = useState<string>(search.get('student') ?? students[0]?.id ?? '')
  const selected = students.find((s) => s.id === studentId) ?? students[0]
  const [answers, setAnswers] = useState<number[]>(selected?.gad7?.answers ?? Array.from({ length: 7 }, () => 0))
  const [toast, setToast] = useState(false)

  const scaleOptions = [
    { value: '0', label: '0' },
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
  ]

  const items = [
    'Feeling nervous, anxious, or on edge',
    'Not being able to stop or control worrying',
    'Worrying too much about different things',
    'Trouble relaxing',
    'Being so restless that it is hard to sit still',
    'Becoming easily annoyed or irritable',
    'Feeling afraid as if something awful might happen',
  ]

  const total = sum(answers)
  const sev = gad7Severity(total)

  function onSave() {
    const createdAt = new Date().toISOString()
    dispatch({ type: 'counselor/saveGad7', studentId: selected?.id ?? 's_1', answers, createdAt })
    setToast(true)
  }

  return (
    <Page emoji="🧭" title="GAD-7" subtitle="Score and save a student questionnaire.">
      <Card>
        <CardBody className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))]">Student</div>
            <div className="mt-1">
              <Select
                value={selected?.id ?? ''}
                onChange={(v) => {
                  setStudentId(v)
                  const next = students.find((s) => s.id === v)
                  setAnswers(next?.gad7?.answers ?? Array.from({ length: 7 }, () => 0))
                }}
                options={students.map((s) => ({ value: s.id, label: `${s.name} • ${s.grade}` }))}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Total: {total}</Badge>
            <Badge>{sev.label}</Badge>
            <Button variant="secondary" onClick={() => navigate('/counselor/dashboard')}>
              Back
            </Button>
          </div>
        </CardBody>
      </Card>

      <div className="mt-4 grid gap-3">
        {items.map((q, idx) => (
          <div key={q} className="rounded-2xl border border-white/70 bg-white/60 p-4">
            <div className="text-sm font-semibold text-[rgb(var(--nefera-ink))]">{q}</div>
            <div className="mt-3">
              <Select value={String(answers[idx] ?? 0)} onChange={(v) => setAnswers((arr) => arr.map((x, i) => (i === idx ? Number(v) : x)))} options={scaleOptions} />
            </div>
          </div>
        ))}
        <div className="hidden justify-end md:flex">
          <Button onClick={onSave}>Save GAD-7</Button>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-[88px] z-40 md:hidden">
        <div className="mx-auto w-full max-w-6xl px-4">
          <div className="rounded-2xl border border-white/70 bg-white/70 p-3 shadow-lg shadow-black/10 backdrop-blur">
            <div className="flex items-center justify-end gap-2">
              <Button className="min-w-40" onClick={onSave}>
                Save GAD-7
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Toast open={toast} message="Saved GAD-7." onClose={() => setToast(false)} />
    </Page>
  )
}

export function CounselorAssessmentCssrs() {
  const { state, dispatch } = useNefera()
  const navigate = useNavigate()
  const [search] = useSearchParams()
  const students = state.counselor.students
  const [studentId, setStudentId] = useState<string>(search.get('student') ?? students[0]?.id ?? '')
  const selected = students.find((s) => s.id === studentId) ?? students[0]
  const [answers, setAnswers] = useState<boolean[]>(selected?.cssrs?.answers ?? Array.from({ length: 6 }, () => false))
  const [toast, setToast] = useState(false)
  const [alertOpen, setAlertOpen] = useState(false)

  const items = [
    'Wish to be dead',
    'Non-specific active thoughts of suicide',
    'Active thoughts with any methods',
    'Active thoughts with some intent',
    'Active thoughts with intent and plan',
    'Suicidal behavior',
  ]

  const positive = answers.filter(Boolean).length
  const risk = cssrsRisk(answers)
  const helplines = ['Tele-MANAS 14416', 'KIRAN 1800-599-0019']
  const messages = [
    'Thank you for recording this screening.',
    'Please follow your school’s safety protocol and connect the student with a trusted adult.',
    'If there is immediate danger, use emergency services.',
  ]
  const suggestions = ['Calming breath (in 1-2-3, out 1-2-3-4).', 'Grounding: 3 things you see, 2 you touch, 1 you hear.']

  function onSave() {
    const createdAt = new Date().toISOString()
    dispatch({ type: 'counselor/saveCssrs', studentId: selected?.id ?? 's_1', answers, createdAt })
    if (positive > 0 && selected?.id) {
      dispatch({
        type: 'counselor/addSafetyEvent',
        event: { id: `evt_${createdAt}`, createdAt, studentId: selected.id, kind: 'cssrs_positive', shownHelplines: helplines, shownMessages: messages, shownSuggestions: suggestions },
      })
      const nextFlag = risk.level === 'Extreme' || risk.level === 'High' ? 'crisis' : risk.level === 'Moderate' ? 'red' : 'orange'
      dispatch({ type: 'teacher/setStudentFlags', studentId: selected.id, flags: nextFlag })
      setAlertOpen(true)
    }
    setToast(true)
  }

  return (
    <Page emoji="🛟" title="C-SSRS" subtitle="Record and save suicide risk screening responses.">
      <Card>
        <CardBody className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))]">Student</div>
            <div className="mt-1">
              <Select
                value={selected?.id ?? ''}
                onChange={(v) => {
                  setStudentId(v)
                  const next = students.find((s) => s.id === v)
                  setAnswers(next?.cssrs?.answers ?? Array.from({ length: 6 }, () => false))
                }}
                options={students.map((s) => ({ value: s.id, label: `${s.name} • ${s.grade}` }))}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{positive} positive</Badge>
            <Badge>{risk.action}</Badge>
            <Button variant="secondary" onClick={() => navigate('/counselor/dashboard')}>
              Back
            </Button>
          </div>
        </CardBody>
      </Card>

      <div className="mt-4 grid gap-2">
        {items.map((q, idx) => (
          <button
            key={q}
            type="button"
            onClick={() => setAnswers((arr) => arr.map((x, i) => (i === idx ? !x : x)))}
            className={cx(
              'flex items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/60 p-4 text-left shadow-lg shadow-black/5 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/80 hover:shadow-xl active:translate-y-0',
              answers[idx] ? 'ring-4 ring-[rgba(244,63,94,0.14)]' : '',
            )}
          >
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[rgb(var(--nefera-ink))]">{q}</div>
            </div>
            <Badge tone={answers[idx] ? 'danger' : 'neutral'}>{answers[idx] ? 'Yes' : 'No'}</Badge>
          </button>
        ))}
        <div className="hidden justify-end md:flex">
          <Button onClick={onSave}>Save C-SSRS</Button>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-[88px] z-40 md:hidden">
        <div className="mx-auto w-full max-w-6xl px-4">
          <div className="rounded-2xl border border-white/70 bg-white/70 p-3 shadow-lg shadow-black/10 backdrop-blur">
            <div className="flex items-center justify-end gap-2">
              <Button className="min-w-40" onClick={onSave}>
                Save C-SSRS
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Toast open={toast} message="Saved C-SSRS." onClose={() => setToast(false)} />
      <Modal
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        title="Support and safety"
        description="Show helplines and document what was displayed."
        footer={
          <>
            <Button variant="secondary" onClick={() => navigate('/counselor/flags')}>
              View flags
            </Button>
            <Button onClick={() => setAlertOpen(false)}>Done</Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="rounded-2xl border border-white/70 bg-white/70 p-4 text-sm text-[rgb(var(--nefera-muted))] whitespace-pre-wrap">
            {messages.join('\n')}
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/70 p-4 text-sm text-[rgb(var(--nefera-muted))]">
            <div className="text-sm font-extrabold text-[rgb(var(--nefera-ink))]">Government toll-free helplines</div>
            <div className="mt-2 grid gap-1">
              {helplines.map((h) => (
                <div key={h} className="text-sm font-semibold text-[rgb(var(--nefera-ink))]">
                  {h}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/70 p-4 text-sm text-[rgb(var(--nefera-muted))] whitespace-pre-wrap">
            {suggestions.join('\n')}
          </div>
        </div>
      </Modal>
    </Page>
  )
}

export function CounselorStudentDetail() {
  const { state, dispatch } = useNefera()
  const params = useParams()
  const navigate = useNavigate()
  const student = state.counselor.students.find((s) => s.id === params.id)
  const [toast, setToast] = useState(false)
  const [messageOpen, setMessageOpen] = useState(false)
  const [messageBody, setMessageBody] = useState('')
  const [messageToast, setMessageToast] = useState(false)

  const [phq9, setPhq9] = useState<number[]>(student?.phq9?.answers ?? Array.from({ length: 9 }, () => 0))
  const [gad7, setGad7] = useState<number[]>(student?.gad7?.answers ?? Array.from({ length: 7 }, () => 0))
  const [cssrs, setCssrs] = useState<boolean[]>(student?.cssrs?.answers ?? Array.from({ length: 6 }, () => false))

  if (!student) {
    return (
      <Page emoji="🧑‍🎓" title="Student" subtitle="Not found.">
        <Card>
          <CardBody className="flex items-center justify-between gap-3">
            <div className="text-sm text-[rgb(var(--nefera-muted))]">Student not found.</div>
            <Button variant="secondary" onClick={() => navigate('/counselor/flags', { replace: true })}>
              Back
            </Button>
          </CardBody>
        </Card>
      </Page>
    )
  }

  const studentId = student.id

  function onSave() {
    const createdAt = new Date().toISOString()
    dispatch({ type: 'counselor/savePhq9', studentId, answers: phq9, createdAt })
    dispatch({ type: 'counselor/saveGad7', studentId, answers: gad7, createdAt })
    dispatch({ type: 'counselor/saveCssrs', studentId, answers: cssrs, createdAt })
    setToast(true)
  }

  const scaleOptions = [
    { value: '0', label: '0' },
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
  ]

  const phq9Items = [
    'Little interest or pleasure in doing things',
    'Feeling down, depressed, or hopeless',
    'Trouble falling or staying asleep, or sleeping too much',
    'Feeling tired or having little energy',
    'Poor appetite or overeating',
    'Feeling bad about yourself',
    'Trouble concentrating on things',
    'Moving or speaking slowly, or being fidgety/restless',
    'Thoughts of self-harm or that you would be better off dead',
  ]

  const gad7Items = [
    'Feeling nervous, anxious, or on edge',
    'Not being able to stop or control worrying',
    'Worrying too much about different things',
    'Trouble relaxing',
    'Being so restless that it is hard to sit still',
    'Becoming easily annoyed or irritable',
    'Feeling afraid as if something awful might happen',
  ]

  const cssrsItems = [
    'Wish to be dead',
    'Non-specific active thoughts of suicide',
    'Active thoughts with any methods',
    'Active thoughts with some intent',
    'Active thoughts with intent and plan',
    'Suicidal behavior',
  ]
  const teacherObs = state.counselor.teacherObservations.filter((o) => o.studentId === studentId)

  return (
    <Page emoji="🧑‍🎓" title={student.name} subtitle="Questionnaires and follow-up planning.">
      <Card>
        <CardBody className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))]">Grade</div>
            <div className="text-sm font-extrabold text-[rgb(var(--nefera-ink))]">{student.grade}</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={flagTone(student.flags)}>{flagLabel(student.flags)}</Badge>
            <Select
              value={student.flags}
              onChange={(v) => dispatch({ type: 'teacher/setStudentFlags', studentId: student.id, flags: v as 'orange' | 'red' | 'crisis' | 'none' })}
              options={[
                { value: 'none', label: 'None' },
                { value: 'orange', label: 'Watch' },
                { value: 'red', label: 'High' },
                { value: 'crisis', label: 'Crisis' },
              ]}
            />
            <Button variant="secondary" onClick={() => setMessageOpen(true)}>
              Message parent 💬
            </Button>
            <Button variant="secondary" onClick={() => navigate('/counselor/flags')}>
              Back
            </Button>
          </div>
        </CardBody>
      </Card>

      <div className="mt-4 grid gap-4">
        <Card>
          <CardHeader emoji="🧑‍🏫" title="Teacher observations" subtitle="Recent checklists to inform follow-up." />
          <CardBody className="grid gap-2">
            {teacherObs.slice(0, 6).map((o) => (
              <div key={o.id} className="rounded-2xl border border-white/70 bg-white/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold tracking-tight text-[rgb(var(--nefera-ink))]">{formatShort(o.createdAt)}</div>
                    <div className="mt-1 text-xs font-semibold text-[rgb(var(--nefera-muted))]">
                      {o.items.length} item{o.items.length === 1 ? '' : 's'}
                    </div>
                  </div>
                  {o.items.length > 0 ? <Badge tone="warn">Observation</Badge> : <Badge tone="neutral">Info</Badge>}
                </div>
                {o.items.length > 0 ? (
                  <div className="mt-2 text-sm text-[rgb(var(--nefera-muted))] whitespace-pre-wrap">{o.items.join('\n')}</div>
                ) : null}
              </div>
            ))}
            {teacherObs.length === 0 ? (
              <div className="rounded-2xl border border-white/70 bg-white/60 p-4 text-sm text-[rgb(var(--nefera-muted))]">
                No teacher observations saved for this student yet.
              </div>
            ) : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader emoji="📋" title="PHQ-9" subtitle={`Total: ${sum(phq9)}`} />
          <CardBody className="grid gap-3">
            {phq9Items.map((q, idx) => (
              <div key={q} className="rounded-2xl border border-white/70 bg-white/60 p-4">
                <div className="text-sm font-semibold text-[rgb(var(--nefera-ink))]">{q}</div>
                <div className="mt-3">
                  <Select value={String(phq9[idx] ?? 0)} onChange={(v) => setPhq9((arr) => arr.map((x, i) => (i === idx ? Number(v) : x)))} options={scaleOptions} />
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader emoji="🧭" title="GAD-7" subtitle={`Total: ${sum(gad7)}`} />
          <CardBody className="grid gap-3">
            {gad7Items.map((q, idx) => (
              <div key={q} className="rounded-2xl border border-white/70 bg-white/60 p-4">
                <div className="text-sm font-semibold text-[rgb(var(--nefera-ink))]">{q}</div>
                <div className="mt-3">
                  <Select value={String(gad7[idx] ?? 0)} onChange={(v) => setGad7((arr) => arr.map((x, i) => (i === idx ? Number(v) : x)))} options={scaleOptions} />
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader emoji="🛟" title="C-SSRS" subtitle={`${cssrs.filter(Boolean).length} positive response${cssrs.filter(Boolean).length === 1 ? '' : 's'}`} />
          <CardBody className="grid gap-2">
            {cssrsItems.map((q, idx) => (
              <button
                key={q}
                type="button"
                onClick={() => setCssrs((arr) => arr.map((x, i) => (i === idx ? !x : x)))}
                className={cx(
                  'flex items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/60 p-4 text-left shadow-lg shadow-black/5 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/80 hover:shadow-xl active:translate-y-0',
                  cssrs[idx] ? 'ring-4 ring-[rgba(244,63,94,0.14)]' : '',
                )}
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[rgb(var(--nefera-ink))]">{q}</div>
                </div>
                <Badge tone={cssrs[idx] ? 'danger' : 'neutral'}>{cssrs[idx] ? 'Yes' : 'No'}</Badge>
              </button>
            ))}
          </CardBody>
        </Card>

        <div className="hidden justify-end md:flex">
          <Button onClick={onSave}>Save questionnaires</Button>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-[88px] z-40 md:hidden">
        <div className="mx-auto w-full max-w-6xl px-4">
          <div className="rounded-2xl border border-white/70 bg-white/70 p-3 shadow-lg shadow-black/10 backdrop-blur">
            <div className="flex items-center justify-end gap-2">
              <Button className="min-w-40" onClick={onSave}>
                Save questionnaires
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Toast open={toast} message="Saved questionnaires." onClose={() => setToast(false)} />
      <Toast open={messageToast} message="Sent to parent." onClose={() => setMessageToast(false)} />
      <Modal
        open={messageOpen}
        onClose={() => {
          setMessageOpen(false)
          setMessageBody('')
        }}
        title="💬 Message parent"
        description={`Regarding ${student.name}.`}
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
                  type: 'counselor/messageParent',
                  item: { id: makeId('msg'), createdAt, childId: student.id, body: messageBody.trim() },
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
            placeholder="Share a gentle update, next steps, and how the parent can support at home."
            rows={6}
          />
        </div>
      </Modal>
    </Page>
  )
}

export function CounselorReports() {
  const { state, dispatch } = useNefera()
  const navigate = useNavigate()
  const reports = state.counselor.reports
  const [resolveId, setResolveId] = useState<string | null>(null)
  const [resolveNote, setResolveNote] = useState('')
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
  const resolveReport = resolveId ? ordered.find((r) => r.id === resolveId) ?? null : null
  const canResolve = !!resolveNote.trim()

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
              <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))] whitespace-pre-wrap">
                • readAtBySchool: {r.readAtBySchool ? formatShort(r.readAtBySchool) : '—'}
                {'\n'}• closedAt: {r.closedAt ? formatShort(r.closedAt) : '—'}
                {'\n'}• closure note: {r.closureNote ? r.closureNote : '—'}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="min-w-56">
                  <Select
                    value={r.status}
                    onChange={(v) => {
                      const next = v as 'received' | 'reviewing' | 'resolved'
                      const at = new Date().toISOString()
                      if (next === 'resolved') {
                        setResolveId(r.id)
                        setResolveNote(r.closureNote ?? '')
                        return
                      }
                      dispatch({ type: 'reports/setStatus', reportId: r.id, status: next })
                      dispatch({ type: 'reports/markReadBySchool', reportId: r.id, at })
                    }}
                    options={[
                      { value: 'received', label: 'received' },
                      { value: 'reviewing', label: 'reviewing' },
                      { value: 'resolved', label: 'resolved' },
                    ]}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {!r.readAtBySchool ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => dispatch({ type: 'reports/markReadBySchool', reportId: r.id, at: new Date().toISOString() })}
                    >
                      Mark read
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      if (r.status === 'resolved') {
                        dispatch({ type: 'reports/setStatus', reportId: r.id, status: 'reviewing' })
                        return
                      }
                      setResolveId(r.id)
                      setResolveNote(r.closureNote ?? '')
                    }}
                  >
                    {r.status === 'resolved' ? 'Re-open' : 'Mark resolved'}
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}

        {reports.length === 0 ? (
          <Card>
            <CardHeader emoji="🌿" title="No reports yet" subtitle="Reports will appear here as they are submitted." />
            <CardBody className="text-sm text-[rgb(var(--nefera-muted))]">
              This page helps counselors review and coordinate follow-up.
            </CardBody>
          </Card>
        ) : null}

        <div className="flex justify-end">
          <Button variant="secondary" onClick={() => navigate('/counselor/dashboard')}>
            Back
          </Button>
        </div>
      </div>
      <Modal
        open={!!resolveReport}
        onClose={() => {
          setResolveId(null)
          setResolveNote('')
        }}
        title="Resolve report"
        description={resolveReport ? `Add a short closure note for “${resolveReport.type}”.` : undefined}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setResolveId(null)
                setResolveNote('')
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={!canResolve || !resolveReport}
              onClick={() => {
                if (!resolveReport) return
                const at = new Date().toISOString()
                dispatch({ type: 'reports/resolve', reportId: resolveReport.id, at, closureNote: resolveNote.trim() })
                setResolveId(null)
                setResolveNote('')
              }}
            >
              Resolve
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          <div className="text-xs font-semibold text-[rgb(var(--nefera-muted))]">Closure note</div>
          <TextArea value={resolveNote} onChange={(e) => setResolveNote(e.target.value)} rows={5} />
        </div>
      </Modal>
    </Page>
  )
}
