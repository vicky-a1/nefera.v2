import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react'

export type Role = 'student' | 'teacher' | 'parent' | 'counselor' | 'principal' | 'admin'
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
  sentAt: string
  fromRole: Role
  fromName: string
  toRole: Role
  toStudentId?: string
  subject: string
  body: string
  editedAt?: string
  history: { body: string; timestamp: string }[]
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
  readAtBySchool?: string
  closedAt?: string
  closureNote?: string
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
  toStudentId?: string
  body?: string
  anxiety: string[]
  depression: string[]
  risk: string[]
}

export type BroadcastItem = {
  id: string
  createdAt: string
  title: string
  body: string
  sentAt: string
  editedAt?: string
  history: { body: string; timestamp: string }[]
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

export type SchoolConfig = {
  openCircle: {
    visibility: 'off' | 'school' | 'class' | 'grade' | 'groups'
    allowedClassIds: string[]
    allowedGrades: string[]
    allowedGroupIds: string[]
  }
  parent: {
    maxGrade: number
    allowBeyondMax: boolean
  }
  positiveMessage: {
    enabled: boolean
    maxWords: number
    text: string
  }
  features: {
    openCircle: boolean
    reports: boolean
    messaging: boolean
    copingTools: boolean
    parentDashboard: boolean
  }
  emergencyContact: {
    title: string
    phone: string
    email: string
  }
}

export type SchoolConfigRequest = {
  id: string
  createdAt: string
  requestedBy: { role: Role; name: string }
  config: SchoolConfig
  status: 'pending' | 'approved' | 'rejected'
}

export type NeferaState = {
  selectedRole?: Role
  user?: User
  schoolConfig: SchoolConfig
  schoolConfigRequests: SchoolConfigRequest[]

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
    broadcasts: BroadcastItem[]
    inbox: Message[]
    observations: TeacherObservation[]
  }

  parent: {
    children: { id: string; name: string; grade: string }[]
    sent: {
      id: string
      createdAt: string
      sentAt: string
      editedAt?: string
      history: { body: string; timestamp: string }[]
      toRole: 'teacher' | 'counselor' | 'principal'
      childId: string
      body: string
    }[]
    inbox: Message[]
    reports: {
      id: string
      createdAt: string
      childId: string
      type: string
      body: string
      status: IncidentReport['status']
      readAtBySchool?: string
      closedAt?: string
      closureNote?: string
    }[]
  }

  counselor: {
    students: StudentRecord[]
    broadcasts: BroadcastItem[]
    crisisActions: { id: string; createdAt: string; body: string; done: boolean }[]
    safetyEvents: SafetyEvent[]
    inbox: Message[]
    peerObservations: PeerObservation[]
    teacherObservations: TeacherObservation[]
    checkIns: StudentCheckIn[]
    sleepLogs: NeferaState['student']['sleepLogs']
    reports: IncidentReport[]
  }

  principal: {
    broadcasts: BroadcastItem[]
    inbox: Message[]
    checkIns: StudentCheckIn[]
    sleepLogs: NeferaState['student']['sleepLogs']
    reports: IncidentReport[]
  }
}

type Action =
  | { type: 'selectRole'; role: Role }
  | { type: 'login'; name: string }
  | { type: 'logout' }
  | { type: 'admin/requestSchoolConfigChange'; request: SchoolConfigRequest }
  | { type: 'principal/approveSchoolConfigChange'; requestId: string }
  | { type: 'principal/rejectSchoolConfigChange'; requestId: string }
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
  | { type: 'teacher/sendMessage'; item: { id: string; createdAt: string; toStudentId: string; subject: string; body: string } }
  | { type: 'teacher/messageParent'; item: { id: string; createdAt: string; childId: string; body: string } }
  | { type: 'teacher/markMessageRead'; messageId: string }
  | { type: 'teacher/addObservation'; observation: TeacherObservation }
  | { type: 'teacher/setStudentFlags'; studentId: string; flags: StudentRecord['flags'] }
  | { type: 'counselor/addBroadcast'; item: { id: string; createdAt: string; title: string; body: string } }
  | { type: 'counselor/savePhq9'; studentId: string; answers: number[]; createdAt: string }
  | { type: 'counselor/saveGad7'; studentId: string; answers: number[]; createdAt: string }
  | { type: 'counselor/saveCssrs'; studentId: string; answers: boolean[]; createdAt: string }
  | { type: 'counselor/addSafetyEvent'; event: SafetyEvent }
  | { type: 'counselor/toggleCrisisAction'; id: string }
  | { type: 'counselor/messageParent'; item: { id: string; createdAt: string; childId: string; body: string } }
  | { type: 'counselor/markMessageRead'; messageId: string }
  | { type: 'parent/sendMessage'; item: { id: string; createdAt: string; toRole: 'teacher' | 'counselor' | 'principal'; childId: string; body: string } }
  | { type: 'parent/markMessageRead'; messageId: string }
  | { type: 'parent/addReport'; item: { id: string; createdAt: string; type: string; body: string; childId: string } }
  | { type: 'principal/addBroadcast'; item: { id: string; createdAt: string; title: string; body: string } }
  | { type: 'principal/addReport'; report: IncidentReport }
  | { type: 'principal/markMessageRead'; messageId: string }
  | { type: 'reports/setStatus'; reportId: string; status: IncidentReport['status'] }
  | { type: 'reports/markReadBySchool'; reportId: string; at: string }
  | { type: 'reports/resolve'; reportId: string; at: string; closureNote: string }

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

    const normalizeMessageArray = (arr: unknown) => {
      if (!Array.isArray(arr)) return []
      return arr.map((m) => {
        const obj = m && typeof m === 'object' ? (m as Record<string, unknown>) : {}
        const createdAt = typeof obj.createdAt === 'string' ? obj.createdAt : new Date().toISOString()
        const sentAt = typeof obj.sentAt === 'string' ? obj.sentAt : createdAt
        const historyRaw = obj.history
        const history = Array.isArray(historyRaw)
          ? historyRaw
              .map((h) => (h && typeof h === 'object' ? (h as Record<string, unknown>) : {}))
              .filter((h) => typeof h.body === 'string' && typeof h.timestamp === 'string')
              .map((h) => ({ body: String(h.body), timestamp: String(h.timestamp) }))
          : [{ body: typeof obj.body === 'string' ? obj.body : '', timestamp: sentAt }]
        return { ...obj, createdAt, sentAt, history } as Message
      })
    }

    const normalizeBroadcastArray = (arr: unknown) => {
      if (!Array.isArray(arr)) return []
      return arr.map((b) => {
        const obj = b && typeof b === 'object' ? (b as Record<string, unknown>) : {}
        const createdAt = typeof obj.createdAt === 'string' ? obj.createdAt : new Date().toISOString()
        const sentAt = typeof obj.sentAt === 'string' ? obj.sentAt : createdAt
        const body = typeof obj.body === 'string' ? obj.body : ''
        const historyRaw = obj.history
        const history = Array.isArray(historyRaw)
          ? historyRaw
              .map((h) => (h && typeof h === 'object' ? (h as Record<string, unknown>) : {}))
              .filter((h) => typeof h.body === 'string' && typeof h.timestamp === 'string')
              .map((h) => ({ body: String(h.body), timestamp: String(h.timestamp) }))
          : [{ body, timestamp: sentAt }]
        return {
          id: typeof obj.id === 'string' ? obj.id : uid('broadcast'),
          createdAt,
          title: typeof obj.title === 'string' ? obj.title : 'Broadcast',
          body,
          sentAt,
          editedAt: typeof obj.editedAt === 'string' ? obj.editedAt : undefined,
          history,
        } as BroadcastItem
      })
    }

    const defaults = defaultSchoolConfig()
    const normalizeSchoolConfig = (cfg: unknown): SchoolConfig => {
      const obj = cfg && typeof cfg === 'object' ? (cfg as Record<string, unknown>) : {}
      const openCircle = (obj.openCircle && typeof obj.openCircle === 'object' ? (obj.openCircle as Record<string, unknown>) : {}) as Record<string, unknown>
      const parent = (obj.parent && typeof obj.parent === 'object' ? (obj.parent as Record<string, unknown>) : {}) as Record<string, unknown>
      const positiveMessage =
        (obj.positiveMessage && typeof obj.positiveMessage === 'object'
          ? (obj.positiveMessage as Record<string, unknown>)
          : {}) as Record<string, unknown>
      const features = (obj.features && typeof obj.features === 'object' ? (obj.features as Record<string, unknown>) : {}) as Record<string, unknown>
      const emergencyContact =
        (obj.emergencyContact && typeof obj.emergencyContact === 'object'
          ? (obj.emergencyContact as Record<string, unknown>)
          : {}) as Record<string, unknown>

      return {
        openCircle: {
          visibility:
            openCircle.visibility === 'off' || openCircle.visibility === 'school' || openCircle.visibility === 'class' || openCircle.visibility === 'grade' || openCircle.visibility === 'groups'
              ? openCircle.visibility
              : defaults.openCircle.visibility,
          allowedClassIds: Array.isArray(openCircle.allowedClassIds) ? openCircle.allowedClassIds.map((x) => String(x)).filter(Boolean) : defaults.openCircle.allowedClassIds,
          allowedGrades: Array.isArray(openCircle.allowedGrades) ? openCircle.allowedGrades.map((x) => String(x)).filter(Boolean) : defaults.openCircle.allowedGrades,
          allowedGroupIds: Array.isArray(openCircle.allowedGroupIds) ? openCircle.allowedGroupIds.map((x) => String(x)).filter(Boolean) : defaults.openCircle.allowedGroupIds,
        },
        parent: {
          maxGrade: typeof parent.maxGrade === 'number' && Number.isFinite(parent.maxGrade) ? parent.maxGrade : defaults.parent.maxGrade,
          allowBeyondMax: typeof parent.allowBeyondMax === 'boolean' ? parent.allowBeyondMax : defaults.parent.allowBeyondMax,
        },
        positiveMessage: {
          enabled: typeof positiveMessage.enabled === 'boolean' ? positiveMessage.enabled : defaults.positiveMessage.enabled,
          maxWords: typeof positiveMessage.maxWords === 'number' && Number.isFinite(positiveMessage.maxWords) ? positiveMessage.maxWords : defaults.positiveMessage.maxWords,
          text: typeof positiveMessage.text === 'string' ? positiveMessage.text : defaults.positiveMessage.text,
        },
        features: {
          openCircle: typeof features.openCircle === 'boolean' ? features.openCircle : defaults.features.openCircle,
          reports: typeof features.reports === 'boolean' ? features.reports : defaults.features.reports,
          messaging: typeof features.messaging === 'boolean' ? features.messaging : defaults.features.messaging,
          copingTools: typeof features.copingTools === 'boolean' ? features.copingTools : defaults.features.copingTools,
          parentDashboard: typeof features.parentDashboard === 'boolean' ? features.parentDashboard : defaults.features.parentDashboard,
        },
        emergencyContact: {
          title: typeof emergencyContact.title === 'string' ? emergencyContact.title : defaults.emergencyContact.title,
          phone: typeof emergencyContact.phone === 'string' ? emergencyContact.phone : defaults.emergencyContact.phone,
          email: typeof emergencyContact.email === 'string' ? emergencyContact.email : defaults.emergencyContact.email,
        },
      }
    }

    ;(parsed as NeferaState).schoolConfig = normalizeSchoolConfig((parsed as NeferaState).schoolConfig)

    const reqsRaw = (parsed as { schoolConfigRequests?: unknown }).schoolConfigRequests
    ;(parsed as NeferaState).schoolConfigRequests = Array.isArray(reqsRaw)
      ? reqsRaw.map((r) => {
          const obj = r && typeof r === 'object' ? (r as Record<string, unknown>) : {}
          const status = obj.status === 'pending' || obj.status === 'approved' || obj.status === 'rejected' ? obj.status : 'pending'
          const requestedByRaw = obj.requestedBy && typeof obj.requestedBy === 'object' ? (obj.requestedBy as Record<string, unknown>) : {}
          const roleRaw = requestedByRaw.role
          const role: Role =
            roleRaw === 'student' || roleRaw === 'teacher' || roleRaw === 'parent' || roleRaw === 'counselor' || roleRaw === 'principal' || roleRaw === 'admin'
              ? roleRaw
              : 'admin'
          return {
            id: typeof obj.id === 'string' ? obj.id : uid('cfg_req'),
            createdAt: typeof obj.createdAt === 'string' ? obj.createdAt : new Date().toISOString(),
            requestedBy: { role, name: typeof requestedByRaw.name === 'string' ? requestedByRaw.name : 'Admin' },
            config: normalizeSchoolConfig(obj.config),
            status,
          } as SchoolConfigRequest
        })
      : []

    const student = parsed.student
    if (student && !('peerObservations' in student)) {
      ;(parsed.student as NeferaState['student']).peerObservations = []
    }
    if (student && 'inbox' in student) {
      ;(parsed.student as NeferaState['student']).inbox = normalizeMessageArray((student as { inbox?: unknown }).inbox)
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
    if (counselor && !('inbox' in counselor)) {
      ;(parsed.counselor as NeferaState['counselor']).inbox = []
    }
    if (counselor && 'inbox' in counselor) {
      ;(parsed.counselor as NeferaState['counselor']).inbox = normalizeMessageArray((counselor as { inbox?: unknown }).inbox)
    }
    if (counselor && 'broadcasts' in counselor) {
      ;(parsed.counselor as NeferaState['counselor']).broadcasts = normalizeBroadcastArray((counselor as { broadcasts?: unknown }).broadcasts)
    }
    const principal = parsed.principal
    if (principal && !('checkIns' in principal)) {
      ;(parsed.principal as NeferaState['principal']).checkIns = []
    }
    if (principal && !('sleepLogs' in principal)) {
      ;(parsed.principal as NeferaState['principal']).sleepLogs = []
    }
    if (principal && !('inbox' in principal)) {
      ;(parsed.principal as NeferaState['principal']).inbox = []
    }
    if (principal && 'inbox' in principal) {
      ;(parsed.principal as NeferaState['principal']).inbox = normalizeMessageArray((principal as { inbox?: unknown }).inbox)
    }
    if (principal && 'broadcasts' in principal) {
      ;(parsed.principal as NeferaState['principal']).broadcasts = normalizeBroadcastArray((principal as { broadcasts?: unknown }).broadcasts)
    }
    const teacher = parsed.teacher
    if (teacher && !('observations' in teacher)) {
      ;(parsed.teacher as NeferaState['teacher']).observations = []
    }
    if (teacher && !('inbox' in teacher)) {
      ;(parsed.teacher as NeferaState['teacher']).inbox = []
    }
    if (teacher && 'inbox' in teacher) {
      ;(parsed.teacher as NeferaState['teacher']).inbox = normalizeMessageArray((teacher as { inbox?: unknown }).inbox)
    }
    if (teacher && 'broadcasts' in teacher) {
      ;(parsed.teacher as NeferaState['teacher']).broadcasts = normalizeBroadcastArray((teacher as { broadcasts?: unknown }).broadcasts)
    }
    const parent = parsed.parent
    const parentSent =
      parent && typeof parent === 'object' && 'sent' in parent ? (parent as { sent?: unknown }).sent : undefined
    if (Array.isArray(parentSent)) {
      ;(parsed.parent as NeferaState['parent']).sent = parentSent.map((m) => {
        const obj = m && typeof m === 'object' ? (m as Record<string, unknown>) : {}
        const toRole = obj.toRole
        const normalizedToRole = toRole === 'teacher' || toRole === 'counselor' || toRole === 'principal' ? toRole : 'counselor'
        const childId =
          typeof obj.childId === 'string' ? obj.childId : typeof obj.toChildId === 'string' ? obj.toChildId : 'stu_1'
        const createdAt = typeof obj.createdAt === 'string' ? obj.createdAt : new Date().toISOString()
        const sentAt = typeof obj.sentAt === 'string' ? obj.sentAt : createdAt
        const historyRaw = obj.history
        const history = Array.isArray(historyRaw)
          ? historyRaw
              .map((h) => (h && typeof h === 'object' ? (h as Record<string, unknown>) : {}))
              .filter((h) => typeof h.body === 'string' && typeof h.timestamp === 'string')
              .map((h) => ({ body: String(h.body), timestamp: String(h.timestamp) }))
          : [{ body: typeof obj.body === 'string' ? obj.body : '', timestamp: sentAt }]
        return {
          id: typeof obj.id === 'string' ? obj.id : uid('p_msg'),
          createdAt,
          sentAt,
          editedAt: typeof obj.editedAt === 'string' ? obj.editedAt : undefined,
          history,
          toRole: normalizedToRole,
          childId,
          body: typeof obj.body === 'string' ? obj.body : '',
        }
      })
    }
    if (parent && !('inbox' in parent)) {
      ;(parsed.parent as NeferaState['parent']).inbox = []
    }
    if (parent && 'inbox' in parent) {
      ;(parsed.parent as NeferaState['parent']).inbox = normalizeMessageArray((parent as { inbox?: unknown }).inbox)
    }
    const parentReports =
      parent && typeof parent === 'object' && 'reports' in parent ? (parent as { reports?: unknown }).reports : undefined
    if (Array.isArray(parentReports)) {
      ;(parsed.parent as NeferaState['parent']).reports = parentReports.map((r) => {
        const obj = r && typeof r === 'object' ? (r as Record<string, unknown>) : {}
        const createdAt = typeof obj.createdAt === 'string' ? obj.createdAt : new Date().toISOString()
        const status = obj.status === 'received' || obj.status === 'reviewing' || obj.status === 'resolved' ? obj.status : 'received'
        return {
          id: typeof obj.id === 'string' ? obj.id : uid('p_rep'),
          createdAt,
          childId: typeof obj.childId === 'string' ? obj.childId : 'stu_1',
          type: typeof obj.type === 'string' ? obj.type : 'Report',
          body: typeof obj.body === 'string' ? obj.body : '',
          status,
          readAtBySchool: typeof obj.readAtBySchool === 'string' ? obj.readAtBySchool : undefined,
          closedAt: typeof obj.closedAt === 'string' ? obj.closedAt : undefined,
          closureNote: typeof obj.closureNote === 'string' ? obj.closureNote : undefined,
        }
      })
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

function defaultSchoolConfig(): SchoolConfig {
  return {
    openCircle: { visibility: 'school', allowedClassIds: [], allowedGrades: [], allowedGroupIds: [] },
    parent: { maxGrade: 7, allowBeyondMax: false },
    positiveMessage: { enabled: true, maxWords: 22, text: 'You’re doing your best. One small step today is enough.' },
    features: { openCircle: true, reports: true, messaging: true, copingTools: true, parentDashboard: true },
    emergencyContact: { title: 'School emergency contact', phone: '+1 (000) 000-0000', email: 'help@school.org' },
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

  const msg1At = new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString()
  const msg2At = new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString()

  const inbox: Message[] = [
    {
      id: 'msg_1',
      createdAt: msg1At,
      sentAt: msg1At,
      fromRole: 'teacher',
      fromName: 'Ms. Clara',
      toRole: 'student',
      toStudentId: 'stu_1',
      subject: 'Proud of your effort',
      body: 'I noticed you stayed focused today. If anything feels heavy, you can always talk to me after class.',
      history: [{ body: 'I noticed you stayed focused today. If anything feels heavy, you can always talk to me after class.', timestamp: msg1At }],
    },
    {
      id: 'msg_2',
      createdAt: msg2At,
      sentAt: msg2At,
      fromRole: 'counselor',
      fromName: 'Counselor Imani',
      toRole: 'student',
      toStudentId: 'stu_1',
      subject: 'Check-in reminder',
      body: 'A gentle reminder: daily check-ins help you spot patterns. One minute is enough.',
      history: [{ body: 'A gentle reminder: daily check-ins help you spot patterns. One minute is enough.', timestamp: msg2At }],
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
    schoolConfig: defaultSchoolConfig(),
    schoolConfigRequests: [],
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
      inbox: [],
      observations: [],
    },
    parent: {
      children: [{ id: 'stu_1', name: 'Amina K.', grade: 'Grade 8' }],
      sent: [],
      inbox: [],
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
      inbox: [],
      peerObservations: [],
      teacherObservations: [],
      checkIns: [],
      sleepLogs: [],
      reports: seededIncidents,
    },
    principal: {
      broadcasts: [],
      inbox: [],
      checkIns: [],
      sleepLogs: [],
      reports: seededIncidents,
    },
  }
}

function buildMessage(input: Omit<Message, 'sentAt' | 'history'> & { sentAt?: string; history?: Message['history'] }): Message {
  const sentAt = input.sentAt ?? input.createdAt
  const history = input.history ?? [{ body: input.body, timestamp: sentAt }]
  return { ...input, sentAt, history }
}

function buildBroadcastItem(input: Omit<BroadcastItem, 'sentAt' | 'history'> & { sentAt?: string; history?: BroadcastItem['history'] }): BroadcastItem {
  const sentAt = input.sentAt ?? input.createdAt
  const history = input.history ?? [{ body: input.body, timestamp: sentAt }]
  return { ...input, sentAt, history }
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
    case 'admin/requestSchoolConfigChange': {
      const next = [action.request, ...state.schoolConfigRequests].slice(0, 25)
      return { ...state, schoolConfigRequests: next }
    }
    case 'principal/approveSchoolConfigChange': {
      const req = state.schoolConfigRequests.find((r) => r.id === action.requestId)
      const schoolConfig = req?.config ?? state.schoolConfig
      const schoolConfigRequests = state.schoolConfigRequests.map<SchoolConfigRequest>((r) =>
        r.id === action.requestId ? { ...r, status: 'approved' } : r,
      )
      return { ...state, schoolConfig, schoolConfigRequests }
    }
    case 'principal/rejectSchoolConfigChange': {
      const schoolConfigRequests = state.schoolConfigRequests.map<SchoolConfigRequest>((r) =>
        r.id === action.requestId ? { ...r, status: 'rejected' } : r,
      )
      return { ...state, schoolConfigRequests }
    }
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
      const broadcast = buildBroadcastItem(action.item)
      const broadcasts = [broadcast, ...state.teacher.broadcasts].slice(0, 100)
      const inboxItem = buildMessage({
        id: uid('msg'),
        createdAt: action.item.createdAt,
        fromRole: 'teacher',
        fromName: state.user?.name ?? 'Teacher',
        toRole: 'student',
        toStudentId: undefined,
        subject: action.item.title,
        body: action.item.body,
      })
      return { ...state, teacher: { ...state.teacher, broadcasts }, student: { ...state.student, inbox: [inboxItem, ...state.student.inbox] } }
    }
    case 'teacher/sendMessage': {
      const inboxItem = buildMessage({
        id: action.item.id,
        createdAt: action.item.createdAt,
        fromRole: 'teacher',
        fromName: state.user?.name ?? 'Teacher',
        toRole: 'student',
        toStudentId: action.item.toStudentId,
        subject: action.item.subject,
        body: action.item.body,
      })
      return { ...state, student: { ...state.student, inbox: [inboxItem, ...state.student.inbox] } }
    }
    case 'teacher/messageParent': {
      const inboxItem = buildMessage({
        id: action.item.id,
        createdAt: action.item.createdAt,
        fromRole: 'teacher',
        fromName: state.user?.name ?? 'Teacher',
        toRole: 'parent',
        toStudentId: action.item.childId,
        subject: 'Message from teacher',
        body: action.item.body,
      })
      return { ...state, parent: { ...state.parent, inbox: [inboxItem, ...state.parent.inbox].slice(0, 250) } }
    }
    case 'teacher/markMessageRead': {
      const now = new Date().toISOString()
      const inbox = state.teacher.inbox.map((m) => (m.id === action.messageId ? { ...m, readAt: m.readAt ?? now } : m))
      return { ...state, teacher: { ...state.teacher, inbox } }
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
      const broadcast = buildBroadcastItem(action.item)
      const broadcasts = [broadcast, ...state.counselor.broadcasts].slice(0, 100)
      const inboxItem = buildMessage({
        id: uid('msg'),
        createdAt: action.item.createdAt,
        fromRole: 'counselor',
        fromName: state.user?.name ?? 'Counselor',
        toRole: 'student',
        toStudentId: undefined,
        subject: action.item.title,
        body: action.item.body,
      })
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
    case 'counselor/messageParent': {
      const inboxItem = buildMessage({
        id: action.item.id,
        createdAt: action.item.createdAt,
        fromRole: 'counselor',
        fromName: state.user?.name ?? 'Counselor',
        toRole: 'parent',
        toStudentId: action.item.childId,
        subject: 'Message from counselor',
        body: action.item.body,
      })
      return { ...state, parent: { ...state.parent, inbox: [inboxItem, ...state.parent.inbox].slice(0, 250) } }
    }
    case 'counselor/markMessageRead': {
      const now = new Date().toISOString()
      const inbox = state.counselor.inbox.map((m) => (m.id === action.messageId ? { ...m, readAt: m.readAt ?? now } : m))
      return { ...state, counselor: { ...state.counselor, inbox } }
    }
    case 'parent/sendMessage': {
      const sentAt = action.item.createdAt
      const sent = [
        { ...action.item, sentAt, editedAt: undefined, history: [{ body: action.item.body, timestamp: sentAt }] },
        ...state.parent.sent,
      ].slice(0, 200)
      const inboxItem = buildMessage({
        id: action.item.id,
        createdAt: action.item.createdAt,
        fromRole: 'parent',
        fromName: state.user?.name ?? 'Parent',
        toRole: action.item.toRole,
        toStudentId: action.item.childId,
        subject: 'Message from parent',
        body: action.item.body,
      })
      const addInbox = (inbox: Message[]) => [inboxItem, ...inbox].slice(0, 250)
      if (action.item.toRole === 'teacher') {
        return { ...state, parent: { ...state.parent, sent }, teacher: { ...state.teacher, inbox: addInbox(state.teacher.inbox) } }
      }
      if (action.item.toRole === 'principal') {
        return { ...state, parent: { ...state.parent, sent }, principal: { ...state.principal, inbox: addInbox(state.principal.inbox) } }
      }
      return { ...state, parent: { ...state.parent, sent }, counselor: { ...state.counselor, inbox: addInbox(state.counselor.inbox) } }
    }
    case 'parent/markMessageRead': {
      const now = new Date().toISOString()
      const inbox = state.parent.inbox.map((m) => (m.id === action.messageId ? { ...m, readAt: m.readAt ?? now } : m))
      return { ...state, parent: { ...state.parent, inbox } }
    }
    case 'parent/addReport': {
      const reports = [
        { id: action.item.id, createdAt: action.item.createdAt, childId: action.item.childId, type: action.item.type, body: action.item.body, status: 'received' as const },
        ...state.parent.reports,
      ].slice(0, 200)
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
      const broadcast = buildBroadcastItem(action.item)
      const broadcasts = [broadcast, ...state.principal.broadcasts].slice(0, 200)
      const inboxItem = buildMessage({
        id: uid('msg'),
        createdAt: action.item.createdAt,
        fromRole: 'principal',
        fromName: state.user?.name ?? 'Principal',
        toRole: 'student',
        toStudentId: undefined,
        subject: action.item.title,
        body: action.item.body,
      })
      return { ...state, principal: { ...state.principal, broadcasts }, student: { ...state.student, inbox: [inboxItem, ...state.student.inbox] } }
    }
    case 'principal/markMessageRead': {
      const now = new Date().toISOString()
      const inbox = state.principal.inbox.map((m) => (m.id === action.messageId ? { ...m, readAt: m.readAt ?? now } : m))
      return { ...state, principal: { ...state.principal, inbox } }
    }
    case 'principal/addReport':
      return {
        ...state,
        principal: { ...state.principal, reports: [action.report, ...state.principal.reports] },
        counselor: { ...state.counselor, reports: [action.report, ...state.counselor.reports] },
      }
    case 'reports/setStatus': {
      const update = (r: IncidentReport) => (r.id === action.reportId ? { ...r, status: action.status } : r)
      const updateParent = (r: NeferaState['parent']['reports'][number]) => (r.id === action.reportId ? { ...r, status: action.status } : r)
      return {
        ...state,
        student: { ...state.student, incidents: state.student.incidents.map(update) },
        principal: { ...state.principal, reports: state.principal.reports.map(update) },
        counselor: { ...state.counselor, reports: state.counselor.reports.map(update) },
        parent: { ...state.parent, reports: state.parent.reports.map(updateParent) },
      }
    }
    case 'reports/markReadBySchool': {
      const update = (r: IncidentReport) => (r.id === action.reportId ? { ...r, readAtBySchool: r.readAtBySchool ?? action.at } : r)
      const updateParent = (r: NeferaState['parent']['reports'][number]) =>
        r.id === action.reportId ? { ...r, readAtBySchool: r.readAtBySchool ?? action.at } : r
      return {
        ...state,
        student: { ...state.student, incidents: state.student.incidents.map(update) },
        principal: { ...state.principal, reports: state.principal.reports.map(update) },
        counselor: { ...state.counselor, reports: state.counselor.reports.map(update) },
        parent: { ...state.parent, reports: state.parent.reports.map(updateParent) },
      }
    }
    case 'reports/resolve': {
      const update = (r: IncidentReport) =>
        r.id === action.reportId
          ? { ...r, status: 'resolved', readAtBySchool: r.readAtBySchool ?? action.at, closedAt: action.at, closureNote: action.closureNote }
          : r
      const updateParent = (r: NeferaState['parent']['reports'][number]) =>
        r.id === action.reportId
          ? { ...r, status: 'resolved', readAtBySchool: r.readAtBySchool ?? action.at, closedAt: action.at, closureNote: action.closureNote }
          : r
      return {
        ...state,
        student: { ...state.student, incidents: state.student.incidents.map(update) },
        principal: { ...state.principal, reports: state.principal.reports.map(update) },
        counselor: { ...state.counselor, reports: state.counselor.reports.map(update) },
        parent: { ...state.parent, reports: state.parent.reports.map(updateParent) },
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
