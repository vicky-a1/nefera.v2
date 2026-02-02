import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react'

export type Role = 'student' | 'teacher' | 'parent' | 'counselor' | 'principal'
export type AgeGroup = '6-10' | '11-17'
export type Feeling = 'happy' | 'neutral' | 'flat' | 'worried' | 'sad'

export type SleepHoursBucket = '1-4' | '5' | '6' | '7' | '8+'

export type User = {
  id: string
  name: string
  role: Role
}

export type StudentCheckInAnswers = {
  mainSelections?: string[]
  mainSelectionsOther?: string

  happyStars?: number
  happyWhen?: string
  happyWho?: string
  happyHelp?: string
  happyWantMore?: string

  neutralVibe?: string
  neutralDayLike?: string
  neutralAnyFun?: string
  neutralLessFunBecause?: string
  neutralSchoolWork?: string
  neutralFriends?: string

  flatWhen?: string
  flatFunNotFun?: string
  flatTiredWhere?: string
  flatWithOtherKids?: string
  flatSleepLastNight?: string

  worriedHowBig?: string
  worriedWhen?: string
  worriedBodyFeel?: string[]
  worriedMadeHard?: string
  worriedYouDid?: string

  sadHowBig?: string
  sadWhen?: string
  sadHardToEnjoy?: string
  sadWantToBe?: string
  sadHeadSaid?: string

  [key: string]: unknown
}

export type StudentCheckIn = {
  id: string
  createdAt: string
  studentId?: string
  feeling: Feeling
  ageGroup: AgeGroup
  answers: StudentCheckInAnswers
}

export type JournalEntry = {
  id: string
  title: string
  content: string
  createdAt: number
  updatedAt?: number
  dateKey: string // YYYY-MM-DD
}

export type Habit = {
  id: string
  name: string
  emoji: string
  createdAt: string
  completedDates: string[]
}

export type Message = {
  id: string
  createdAt: string
  fromRole: Role
  fromName: string
  toRole: Role
  subject: string
  body: string
  readAt?: string
}

export type OpenCirclePost = {
  id: string
  createdAt: string
  authorName: string
  anonymous: boolean
  body: string
  likes: string[]
  comments: { id: string; createdAt: string; authorName: string; body: string }[]
}

export type IncidentReport = {
  id: string
  createdAt: string
  type: string
  description: string
  anonymous: boolean
  status: 'received' | 'reviewing' | 'resolved'
  context?: {
    school?: string
    classId?: string
    className?: string
    studentId?: string
    studentName?: string
    submittedBy?: Role
  }
}

export type PeerObservation = {
  id: string
  createdAt: string
  anxiety: string[]
  depression: string[]
  risk: string[]
}

export type TeacherObservation = {
  id: string
  createdAt: string
  studentId: string
  items: string[]
}

export type StudentRecord = {
  id: string
  name: string
  grade: string
  flags: 'orange' | 'red' | 'crisis' | 'none'
  latestFeeling?: Feeling
  phq9?: { answers: number[]; createdAt: string }
  gad7?: { answers: number[]; createdAt: string }
  cssrs?: { answers: boolean[]; createdAt: string }
  notes: string[]
}

export type SafetyEvent = {
  id: string
  createdAt: string
  studentId: string
  kind: 'phq9_q9_positive' | 'cssrs_positive'
  shownHelplines: string[]
  shownMessages: string[]
  shownSuggestions: string[]
}

export type NeferaState = {
  selectedRole?: Role
  user?: User

  student: {
    ageGroup?: AgeGroup
    checkIns: StudentCheckIn[]
    sleepLogs: {
      id: string
      createdAt: string
      studentId?: string
      hoursBucket?: SleepHoursBucket
      hours?: number
      quality?: number
      notes?: string
    }[]
    journal: JournalEntry[]
    habits: Habit[]
    groups: { id: string; name: string; emoji: string; joined: boolean }[]
    inbox: Message[]
    openCircle: OpenCirclePost[]
    incidents: IncidentReport[]
    peerObservations: PeerObservation[]
    lastPromptedJournalAt?: string
  }

  teacher: {
    classes: { id: string; name: string; studentIds: string[] }[]
    students: StudentRecord[]
    broadcasts: { id: string; createdAt: string; title: string; body: string }[]
    observations: TeacherObservation[]
  }

  parent: {
    children: { id: string; name: string; grade: string }[]
    sent: { id: string; createdAt: string; toChildId: string; body: string }[]
    reports: { id: string; createdAt: string; type: string; body: string }[]
  }

  counselor: {
    students: StudentRecord[]
    broadcasts: { id: string; createdAt: string; title: string; body: string }[]
    crisisActions: { id: string; createdAt: string; body: string; done: boolean }[]
    safetyEvents: SafetyEvent[]
    peerObservations: PeerObservation[]
    teacherObservations: TeacherObservation[]
    checkIns: StudentCheckIn[]
    sleepLogs: NeferaState['student']['sleepLogs']
    reports: IncidentReport[]
  }

  principal: {
    broadcasts: { id: string; createdAt: string; title: string; body: string }[]
    checkIns: StudentCheckIn[]
    sleepLogs: NeferaState['student']['sleepLogs']
    reports: IncidentReport[]
  }
}

type Action =
  | { type: 'selectRole'; role: Role }
  | { type: 'login'; name: string }
  | { type: 'logout' }
  | { type: 'student/setAgeGroup'; ageGroup: AgeGroup }
  | { type: 'student/addCheckIn'; checkIn: StudentCheckIn }
  | {
      type: 'student/addSleepLog'
      log: {
        id: string
        createdAt: string
        studentId?: string
        hoursBucket?: SleepHoursBucket
        hours?: number
        quality?: number
        notes?: string
      }
    }
  | { type: 'student/addJournal'; payload: JournalEntry }
  | { type: 'student/updateJournal'; payload: { id: string; title?: string; content?: string; updatedAt?: number } }
  | { type: 'student/toggleGroup'; groupId: string }
  | { type: 'student/markMessageRead'; messageId: string }
  | { type: 'student/addPost'; post: OpenCirclePost }
  | { type: 'student/toggleLikePost'; postId: string; userId: string }
  | { type: 'student/addComment'; postId: string; comment: OpenCirclePost['comments'][number] }
  | { type: 'student/addIncident'; incident: IncidentReport }
  | { type: 'student/addPeerObservation'; observation: PeerObservation }
  | { type: 'student/addHabit'; habit: Habit }
  | { type: 'student/toggleHabitToday'; habitId: string; isoDate: string }
  | { type: 'teacher/addBroadcast'; item: { id: string; createdAt: string; title: string; body: string } }
  | { type: 'teacher/addObservation'; observation: TeacherObservation }
  | { type: 'teacher/setStudentFlags'; studentId: string; flags: StudentRecord['flags'] }
  | { type: 'counselor/addBroadcast'; item: { id: string; createdAt: string; title: string; body: string } }
  | { type: 'counselor/savePhq9'; studentId: string; answers: number[]; createdAt: string }
  | { type: 'counselor/saveGad7'; studentId: string; answers: number[]; createdAt: string }
  | { type: 'counselor/saveCssrs'; studentId: string; answers: boolean[]; createdAt: string }
  | { type: 'counselor/addSafetyEvent'; event: SafetyEvent }
  | { type: 'counselor/toggleCrisisAction'; id: string }
  | { type: 'parent/sendMessage'; item: { id: string; createdAt: string; toChildId: string; body: string } }
  | { type: 'parent/addReport'; item: { id: string; createdAt: string; type: string; body: string; childId: string } }
  | { type: 'principal/addBroadcast'; item: { id: string; createdAt: string; title: string; body: string } }
  | { type: 'principal/addReport'; report: IncidentReport }
  | { type: 'reports/setStatus'; reportId: string; status: IncidentReport['status'] }

const STORAGE_KEY = 'nefera.v1'

function isoDate(d: Date) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`
}

function loadState(): NeferaState | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as NeferaState
    const student = parsed.student
    if (student && !('peerObservations' in student)) {
      ;(parsed.student as NeferaState['student']).peerObservations = []
    }
    const counselor = parsed.counselor
    if (counselor && !('safetyEvents' in counselor)) {
      ;(parsed.counselor as NeferaState['counselor']).safetyEvents = []
    }
    if (counselor && !('peerObservations' in counselor)) {
      ;(parsed.counselor as NeferaState['counselor']).peerObservations = []
    }
    if (counselor && !('teacherObservations' in counselor)) {
      ;(parsed.counselor as NeferaState['counselor']).teacherObservations = []
    }
    if (counselor && !('checkIns' in counselor)) {
      ;(parsed.counselor as NeferaState['counselor']).checkIns = []
    }
    if (counselor && !('sleepLogs' in counselor)) {
      ;(parsed.counselor as NeferaState['counselor']).sleepLogs = []
    }
    if (counselor && !('reports' in counselor)) {
      ;(parsed.counselor as NeferaState['counselor']).reports = []
    }
    const principal = parsed.principal
    if (principal && !('checkIns' in principal)) {
      ;(parsed.principal as NeferaState['principal']).checkIns = []
    }
    if (principal && !('sleepLogs' in principal)) {
      ;(parsed.principal as NeferaState['principal']).sleepLogs = []
    }
    const teacher = parsed.teacher
    if (teacher && !('observations' in teacher)) {
      ;(parsed.teacher as NeferaState['teacher']).observations = []
    }
    return parsed
  } catch {
    return undefined
  }
}

function saveState(state: NeferaState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function getTodayISO() {
  return isoDate(new Date())
}

export function makeId(prefix: string) {
  return uid(prefix)
}

export function feelingLabel(feeling: Feeling) {
  switch (feeling) {
    case 'happy':
      return 'Happy'
    case 'neutral':
      return 'Neutral'
    case 'flat':
      return 'Flat'
    case 'worried':
      return 'Worried'
    case 'sad':
      return 'Sad'
  }
}

export function feelingEmoji(feeling: Feeling) {
  switch (feeling) {
    case 'happy':
      return '😃'
    case 'neutral':
      return '🙂'
    case 'flat':
      return '😐'
    case 'worried':
      return '😟'
    case 'sad':
      return '😢'
  }
}

function initialState(): NeferaState {
  const today = getTodayISO()

  const studentRecords: StudentRecord[] = [
    { id: 'stu_1', name: 'Amina K.', grade: 'Grade 8', flags: 'orange', latestFeeling: 'worried', notes: [] },
    { id: 'stu_2', name: 'Jayden P.', grade: 'Grade 10', flags: 'red', latestFeeling: 'sad', notes: [] },
    { id: 'stu_3', name: 'Samira L.', grade: 'Grade 7', flags: 'none', latestFeeling: 'neutral', notes: [] },
    { id: 'stu_4', name: 'Noah R.', grade: 'Grade 11', flags: 'crisis', latestFeeling: 'sad', notes: [] },
  ]

  const inbox: Message[] = [
    {
      id: 'msg_1',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      fromRole: 'teacher',
      fromName: 'Ms. Clara',
      toRole: 'student',
      subject: 'Proud of your effort',
      body: 'I noticed you stayed focused today. If anything feels heavy, you can always talk to me after class.',
    },
    {
      id: 'msg_2',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
      fromRole: 'counselor',
      fromName: 'Counselor Imani',
      toRole: 'student',
      subject: 'Check-in reminder',
      body: 'A gentle reminder: daily check-ins help you spot patterns. One minute is enough.',
    },
  ]

  const seededIncidents: IncidentReport[] = [
    {
      id: 'inc_1',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
      type: 'Bullying / Harassment',
      description: 'Someone keeps taking my lunch and laughing about it.',
      anonymous: true,
      status: 'reviewing',
      context: { school: 'Nefera School', classId: 'class_1', className: 'Grade 8A', submittedBy: 'student' },
    },
  ]

  return {
    selectedRole: undefined,
    user: undefined,
    student: {
      ageGroup: undefined,
      checkIns: [],
      sleepLogs: [],
      journal: [],
      habits: [
        { id: 'hab_1', name: 'Drink Water', emoji: '💧', createdAt: new Date().toISOString(), completedDates: [today] },
        { id: 'hab_2', name: 'Stretch', emoji: '🧘', createdAt: new Date().toISOString(), completedDates: [] },
        { id: 'hab_3', name: 'Read 10 mins', emoji: '📚', createdAt: new Date().toISOString(), completedDates: [] },
      ],
      groups: [
        { id: 'grp_1', name: 'Study Support', emoji: '📘', joined: true },
        { id: 'grp_2', name: 'Friendship Circle', emoji: '🤝', joined: false },
        { id: 'grp_3', name: 'Calm Breathing', emoji: '🌬️', joined: true },
        { id: 'grp_4', name: 'Sports & Confidence', emoji: '⚽', joined: false },
      ],
      inbox,
      openCircle: [
        {
          id: 'post_1',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
          authorName: 'Mina',
          anonymous: true,
          body: 'Does anyone else feel nervous before presentations? I want tips 🥲',
          likes: ['like_1', 'like_2'],
          comments: [
            {
              id: 'c_1',
              createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
              authorName: 'Jay',
              body: 'Try 4-7-8 breathing right before. It helps me a lot.',
            },
          ],
        },
        {
          id: 'post_2',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
          authorName: 'Asha',
          anonymous: false,
          body: 'Small win: I asked for help in math today and it went fine 😄',
          likes: ['like_1'],
          comments: [],
        },
      ],
      incidents: seededIncidents,
      peerObservations: [],
      lastPromptedJournalAt: undefined,
    },
    teacher: {
      classes: [{ id: 'class_1', name: 'Grade 8A', studentIds: studentRecords.map((s) => s.id) }],
      students: studentRecords,
      broadcasts: [],
      observations: [],
    },
    parent: {
      children: [{ id: 'stu_1', name: 'Amina K.', grade: 'Grade 8' }],
      sent: [],
      reports: [],
    },
    counselor: {
      students: studentRecords,
      broadcasts: [],
      crisisActions: [
        { id: 'ca_1', createdAt: new Date().toISOString(), body: 'Call guardian and document safety plan', done: false },
        { id: 'ca_2', createdAt: new Date().toISOString(), body: 'Schedule 1:1 check-in within 24h', done: false },
        { id: 'ca_3', createdAt: new Date().toISOString(), body: 'Coordinate with principal for supervision', done: false },
      ],
      safetyEvents: [],
      peerObservations: [],
      teacherObservations: [],
      checkIns: [],
      sleepLogs: [],
      reports: seededIncidents,
    },
    principal: {
      broadcasts: [],
      checkIns: [],
      sleepLogs: [],
      reports: seededIncidents,
    },
  }
}

function reducer(state: NeferaState, action: Action): NeferaState {
  switch (action.type) {
    case 'selectRole':
      return { ...state, selectedRole: action.role }
    case 'login': {
      const role = state.selectedRole ?? 'student'
      return { ...state, user: { id: uid('user'), name: action.name.trim() || 'Guest', role } }
    }
    case 'logout':
      return { ...state, user: undefined }
    case 'student/setAgeGroup':
      return { ...state, student: { ...state.student, ageGroup: action.ageGroup } }
    case 'student/addCheckIn': {
      const next = [action.checkIn, ...state.student.checkIns].slice(0, 200)
      const counselorCheckIns = [action.checkIn, ...state.counselor.checkIns].slice(0, 800)
      const principalCheckIns = [action.checkIn, ...state.principal.checkIns].slice(0, 1200)
      const studentId = action.checkIn.studentId
      const updLatest = (s: StudentRecord) => (studentId && s.id === studentId ? { ...s, latestFeeling: action.checkIn.feeling } : s)
      return {
        ...state,
        student: { ...state.student, checkIns: next },
        counselor: { ...state.counselor, checkIns: counselorCheckIns, students: state.counselor.students.map(updLatest) },
        principal: { ...state.principal, checkIns: principalCheckIns },
        teacher: { ...state.teacher, students: state.teacher.students.map(updLatest) },
      }
    }
    case 'student/addSleepLog': {
      const next = [action.log, ...state.student.sleepLogs].slice(0, 200)
      const counselorSleepLogs = [action.log, ...state.counselor.sleepLogs].slice(0, 800)
      const principalSleepLogs = [action.log, ...state.principal.sleepLogs].slice(0, 1200)
      return {
        ...state,
        student: { ...state.student, sleepLogs: next },
        counselor: { ...state.counselor, sleepLogs: counselorSleepLogs },
        principal: { ...state.principal, sleepLogs: principalSleepLogs },
      }
    }
    case 'student/addJournal': {
      const next = [action.payload, ...state.student.journal].slice(0, 400)
      return { ...state, student: { ...state.student, journal: next } }
    }
    case 'student/updateJournal':
      return {
        ...state,
        student: {
          ...state.student,
          journal: state.student.journal.map((j) => (j.id === action.payload.id ? { ...j, ...action.payload } : j)),
        },
      }
    case 'student/toggleGroup': {
      const groups = state.student.groups.map((g) => (g.id === action.groupId ? { ...g, joined: !g.joined } : g))
      return { ...state, student: { ...state.student, groups } }
    }
    case 'student/markMessageRead': {
      const now = new Date().toISOString()
      const inbox = state.student.inbox.map((m) => (m.id === action.messageId ? { ...m, readAt: m.readAt ?? now } : m))
      return { ...state, student: { ...state.student, inbox } }
    }
    case 'student/addPost': {
      const next = [action.post, ...state.student.openCircle].slice(0, 200)
      return { ...state, student: { ...state.student, openCircle: next } }
    }
    case 'student/toggleLikePost': {
      const openCircle = state.student.openCircle.map((p) => {
        if (p.id !== action.postId) return p
        const has = p.likes.includes(action.userId)
        return { ...p, likes: has ? p.likes.filter((x) => x !== action.userId) : [action.userId, ...p.likes] }
      })
      return { ...state, student: { ...state.student, openCircle } }
    }
    case 'student/addComment': {
      const openCircle = state.student.openCircle.map((p) =>
        p.id === action.postId ? { ...p, comments: [...p.comments, action.comment] } : p,
      )
      return { ...state, student: { ...state.student, openCircle } }
    }
    case 'student/addIncident': {
      const incidents = [action.incident, ...state.student.incidents].slice(0, 200)
      const principalReports = [action.incident, ...state.principal.reports].slice(0, 200)
      const counselorReports = [action.incident, ...state.counselor.reports].slice(0, 500)
      return {
        ...state,
        student: { ...state.student, incidents },
        principal: { ...state.principal, reports: principalReports },
        counselor: { ...state.counselor, reports: counselorReports },
      }
    }
    case 'student/addPeerObservation': {
      const peerObservations = [action.observation, ...state.student.peerObservations].slice(0, 200)
      const counselorPeerObservations = [action.observation, ...state.counselor.peerObservations].slice(0, 500)
      return {
        ...state,
        student: { ...state.student, peerObservations },
        counselor: { ...state.counselor, peerObservations: counselorPeerObservations },
      }
    }
    case 'student/addHabit':
      return { ...state, student: { ...state.student, habits: [action.habit, ...state.student.habits] } }
    case 'student/toggleHabitToday': {
      const habits = state.student.habits.map((h) => {
        if (h.id !== action.habitId) return h
        const has = h.completedDates.includes(action.isoDate)
        return { ...h, completedDates: has ? h.completedDates.filter((d) => d !== action.isoDate) : [action.isoDate, ...h.completedDates] }
      })
      return { ...state, student: { ...state.student, habits } }
    }
    case 'teacher/addBroadcast': {
      const broadcasts = [action.item, ...state.teacher.broadcasts].slice(0, 100)
      const inboxItem: Message = {
        id: uid('msg'),
        createdAt: action.item.createdAt,
        fromRole: 'teacher',
        fromName: state.user?.name ?? 'Teacher',
        toRole: 'student',
        subject: action.item.title,
        body: action.item.body,
      }
      return { ...state, teacher: { ...state.teacher, broadcasts }, student: { ...state.student, inbox: [inboxItem, ...state.student.inbox] } }
    }
    case 'teacher/addObservation': {
      const observations = [action.observation, ...state.teacher.observations].slice(0, 300)
      const teacherObservations = [action.observation, ...state.counselor.teacherObservations].slice(0, 600)
      return {
        ...state,
        teacher: { ...state.teacher, observations },
        counselor: { ...state.counselor, teacherObservations },
      }
    }
    case 'teacher/setStudentFlags': {
      const students = state.teacher.students.map((s) => (s.id === action.studentId ? { ...s, flags: action.flags } : s))
      const counselorStudents = state.counselor.students.map((s) => (s.id === action.studentId ? { ...s, flags: action.flags } : s))
      return { ...state, teacher: { ...state.teacher, students }, counselor: { ...state.counselor, students: counselorStudents } }
    }
    case 'counselor/addBroadcast': {
      const broadcasts = [action.item, ...state.counselor.broadcasts].slice(0, 100)
      const inboxItem: Message = {
        id: uid('msg'),
        createdAt: action.item.createdAt,
        fromRole: 'counselor',
        fromName: state.user?.name ?? 'Counselor',
        toRole: 'student',
        subject: action.item.title,
        body: action.item.body,
      }
      return { ...state, counselor: { ...state.counselor, broadcasts }, student: { ...state.student, inbox: [inboxItem, ...state.student.inbox] } }
    }
    case 'counselor/savePhq9': {
      const upd = (s: StudentRecord) => (s.id === action.studentId ? { ...s, phq9: { answers: action.answers, createdAt: action.createdAt } } : s)
      return { ...state, counselor: { ...state.counselor, students: state.counselor.students.map(upd) }, teacher: { ...state.teacher, students: state.teacher.students.map(upd) } }
    }
    case 'counselor/saveGad7': {
      const upd = (s: StudentRecord) => (s.id === action.studentId ? { ...s, gad7: { answers: action.answers, createdAt: action.createdAt } } : s)
      return { ...state, counselor: { ...state.counselor, students: state.counselor.students.map(upd) }, teacher: { ...state.teacher, students: state.teacher.students.map(upd) } }
    }
    case 'counselor/saveCssrs': {
      const upd = (s: StudentRecord) => (s.id === action.studentId ? { ...s, cssrs: { answers: action.answers, createdAt: action.createdAt } } : s)
      return { ...state, counselor: { ...state.counselor, students: state.counselor.students.map(upd) }, teacher: { ...state.teacher, students: state.teacher.students.map(upd) } }
    }
    case 'counselor/addSafetyEvent': {
      const safetyEvents = [action.event, ...state.counselor.safetyEvents].slice(0, 200)
      return { ...state, counselor: { ...state.counselor, safetyEvents } }
    }
    case 'counselor/toggleCrisisAction': {
      const crisisActions = state.counselor.crisisActions.map((a) => (a.id === action.id ? { ...a, done: !a.done } : a))
      return { ...state, counselor: { ...state.counselor, crisisActions } }
    }
    case 'parent/sendMessage': {
      const sent = [action.item, ...state.parent.sent].slice(0, 200)
      const inboxItem: Message = {
        id: uid('msg'),
        createdAt: action.item.createdAt,
        fromRole: 'parent',
        fromName: state.user?.name ?? 'Parent',
        toRole: 'student',
        subject: 'Message from home',
        body: action.item.body,
      }
      return { ...state, parent: { ...state.parent, sent }, student: { ...state.student, inbox: [inboxItem, ...state.student.inbox] } }
    }
    case 'parent/addReport': {
      const reports = [action.item, ...state.parent.reports].slice(0, 200)
      const principalReports: IncidentReport = {
        id: action.item.id,
        createdAt: action.item.createdAt,
        type: action.item.type,
        description: action.item.body,
        anonymous: false,
        status: 'received',
        context: {
          school: 'Nefera School',
          classId: state.teacher.classes[0]?.id,
          className: state.teacher.classes[0]?.name,
          studentId: action.item.childId,
          studentName: state.counselor.students.find((s) => s.id === action.item.childId)?.name,
          submittedBy: 'parent',
        },
      }
      return {
        ...state,
        parent: { ...state.parent, reports },
        principal: { ...state.principal, reports: [principalReports, ...state.principal.reports] },
        counselor: { ...state.counselor, reports: [principalReports, ...state.counselor.reports] },
      }
    }
    case 'principal/addBroadcast': {
      const broadcasts = [action.item, ...state.principal.broadcasts].slice(0, 200)
      return { ...state, principal: { ...state.principal, broadcasts } }
    }
    case 'principal/addReport':
      return {
        ...state,
        principal: { ...state.principal, reports: [action.report, ...state.principal.reports] },
        counselor: { ...state.counselor, reports: [action.report, ...state.counselor.reports] },
      }
    case 'reports/setStatus': {
      const update = (r: IncidentReport) => (r.id === action.reportId ? { ...r, status: action.status } : r)
      return {
        ...state,
        student: { ...state.student, incidents: state.student.incidents.map(update) },
        principal: { ...state.principal, reports: state.principal.reports.map(update) },
        counselor: { ...state.counselor, reports: state.counselor.reports.map(update) },
      }
    }
  }
}

type NeferaCtx = {
  state: NeferaState
  dispatch: React.Dispatch<Action>
}

const Ctx = createContext<NeferaCtx | undefined>(undefined)

export function NeferaProvider({ children }: { children: React.ReactNode }) {
  const loaded = useMemo(() => loadState(), [])
  const [state, dispatch] = useReducer(reducer, loaded ?? initialState())

  const didHydrate = useRef(false)
  useEffect(() => {
    if (!didHydrate.current) {
      didHydrate.current = true
      return
    }
    saveState(state)
  }, [state])

  const value = useMemo(() => ({ state, dispatch }), [state])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useNefera() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('NeferaProvider missing')
  return ctx
}

export function useAuth() {
  const { state, dispatch } = useNefera()
  const selectRole = (role: Role) => dispatch({ type: 'selectRole', role })
  const login = (name: string) => dispatch({ type: 'login', name })
  const logout = () => dispatch({ type: 'logout' })

  return { user: state.user, selectedRole: state.selectedRole, selectRole, login, logout }
}
