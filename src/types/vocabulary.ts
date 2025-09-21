// 單字資料型別定義

export interface Word {
  id: number
  word: string
  partOfSpeech: string
  definition: string
  example: string
}

export interface DayVocabulary {
  day: number
  words: Word[]
}

// 新的文章資料結構
export interface Article {
  date: string
  title: string
  link: string | null
  content: string
}

// 新的每日資料結構（包含文章和單字）
export interface DayContent {
  date: string
  article: Article | null
  words: Word[]
}

export interface VocabularyData {
  toefl: DayVocabulary[]
  daily: DayVocabulary[]
}

// 新的資料結構
export interface ContentData {
  toefl: DayContent[]
  daily: DayContent[]
}

// 測驗相關型別
export interface QuizSettings {
  questionCount: number
  range: 'all' | 'by-day'
  selectedDays?: number[]
}

export interface QuizQuestion {
  id: number
  type: 'word-to-definition' | 'definition-to-word'
  word: string
  partOfSpeech: string
  definition: string
  example: string
  options: string[]
  correctAnswer: string
  userAnswer?: string
  isCorrect?: boolean
}

export interface QuizResult {
  totalQuestions: number
  correctAnswers: number
  timeSpent: number
  questions: QuizQuestion[]
}

// 分頁相關型別
export interface PaginationOptions {
  page: number
  itemsPerPage: number
  totalItems: number
}

// 發音相關型別
export interface PronunciationData {
  word: string
  audioUrl?: string
  phonetic?: string
}

// 路由參數型別
export interface RouteParams {
  day?: string
}

// API 回應型別
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// 載入狀態型別
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

// 測驗狀態型別
export type QuizState = 'settings' | 'quiz' | 'result'

// 單字類型
export type VocabularyType = 'toefl' | 'daily'

// 測驗類型
export type QuizType = 'quiz-toefl' | 'quiz-daily'
