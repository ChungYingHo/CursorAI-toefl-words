<template>
  <q-page class="q-pa-md">
    <!-- 頁面標題 -->
    <div class="text-center q-mb-lg">
      <h1 class="text-h4 text-dark-text q-mb-sm font-weight-bold">
        托福單字測驗
      </h1>
    </div>

    <!-- 測驗設定對話框 -->
    <q-dialog v-model="showSettings" persistent>
      <q-card class="quiz-settings-dialog">
        <q-card-section class="dialog-header">
          <div class="text-h5 text-dark font-weight-bold">
            <q-icon name="quiz" class="q-mr-sm" />
            測驗設定
          </div>
        </q-card-section>

        <q-card-section class="dialog-content">
          <!-- 測驗題數 -->
          <div class="setting-group">
            <div class="setting-label">
              <q-icon name="format_list_numbered" class="q-mr-sm" />
              測驗題數
            </div>
            <q-select
              v-model="quizSettings.questionCount"
              :options="questionCountOptions"
              outlined
              class="quiz-select"
              emit-value
              map-options
              popup-content-class="bg-dark-card text-dark"
              options-selected-class="text-dark"
              options-dense
            />
          </div>

          <!-- 測驗範圍 -->
          <div class="setting-group">
            <div class="setting-label">
              <q-icon name="category" class="q-mr-sm" />
              測驗範圍
            </div>
            <div class="radio-group">
              <q-radio
                v-model="quizSettings.range"
                val="all"
                label="全部托福單字"
                class="quiz-radio"
                color="primary"
              />
              <q-radio
                v-model="quizSettings.range"
                val="by-date"
                label="按照日期選擇"
                class="quiz-radio"
                color="primary"
              />
            </div>
          </div>

          <!-- 日期選擇 -->
          <div v-if="quizSettings.range === 'by-date'" class="setting-group">
            <div class="setting-label">
              <q-icon name="calendar_today" class="q-mr-sm" />
              選擇日期
            </div>
            <q-select
              v-model="quizSettings.selectedDate"
              :options="availableDates"
              outlined
              class="quiz-select"
              emit-value
              map-options
              popup-content-class="bg-dark-card text-dark"
              options-selected-class="text-dark"
              options-dense
            />
          </div>
        </q-card-section>

        <q-card-actions class="dialog-actions">
          <q-btn
            flat
            label="取消"
            class="cancel-btn"
            @click="showSettings = false"
          />
          <q-btn
            color="primary"
            label="開始測驗"
            class="start-btn"
            @click="startQuiz"
            :disable="!canStartQuiz"
            :loading="false"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 測驗進行中 -->
    <div v-if="quizState === 'quiz'">
      <!-- 測驗題目 -->
      <div class="vocab-grid">
        <div class="q-gutter-lg" style="width: 100%;">
        <q-card
          v-for="(question, index) in quizQuestions"
          :key="question.id"
          class="quiz-card q-pa-lg"
        >
          <div class="text-h6 text-dark-text q-mb-md font-weight-bold">
            第 {{ index + 1 }} 題
          </div>

            <!-- 題型一：顯示單字，選中文解釋 -->
            <div v-if="question.type === 'word-to-definition'">
              <div class="row items-center q-mb-lg">
                <div class="text-h5 text-dark-text">
                  {{ question.word }}
                </div>
                <q-btn
                  flat
                  round
                  icon="volume_up"
                  size="sm"
                  color="primary"
                  class="q-ml-sm"
                  @click="playPronunciation(question.word)"
                >
                  <q-tooltip class="bg-dark-card text-dark-text">
                    播放發音
                  </q-tooltip>
                </q-btn>
              </div>
            </div>

          <!-- 題型二：顯示中文解釋，選單字 -->
          <div v-else>
            <div class="text-h5 text-dark-text q-mb-md">
              {{ question.definition }}
            </div>
          </div>

          <!-- 選項 -->
          <div class="q-gutter-sm">
            <q-btn
              v-for="(option, optionIndex) in question.options"
              :key="optionIndex"
              :class="getOptionClass(question.id, optionIndex)"
              :color="getOptionColor(question.id, optionIndex)"
              :outline="!isSelected(question.id, optionIndex)"
              size="lg"
              class="full-width text-left q-pa-md"
              @click="selectAnswer(question.id, optionIndex)"
            >
              <div class="text-body1">
                {{ option }}
              </div>
            </q-btn>
          </div>
        </q-card>
        </div>
      </div>

      <!-- 提交按鈕 -->
      <div class="text-center q-mt-xl">
        <q-btn
          color="primary"
          size="xl"
          label="提交答案"
          @click="submitQuiz"
          :disable="answeredQuestions < quizQuestions.length"
          class="submit-btn q-px-xl"
          rounded
          unelevated
        />
      </div>
    </div>

      <!-- Sticky 進度顯示 -->
      <div v-if="quizState === 'quiz'" class="sticky-progress">
        <div class="progress-circle">
          <div class="progress-text">
            {{ answeredQuestions }}/{{ quizQuestions.length }}
          </div>
        </div>
      </div>

    <!-- 測驗結果 -->
    <div v-if="quizState === 'result'">
      <div class="row justify-center">
        <div class="col-12 col-md-8 col-lg-6">
          <q-card class="vocab-card q-pa-lg text-center">
            <div class="text-h4 text-dark-text q-mb-md font-weight-bold">測驗完成！</div>
            <div class="text-h5 text-primary q-mb-md font-weight-bold">
              {{ quizResult.correctAnswers }} / {{ quizResult.totalQuestions }} 題正確
            </div>

            <!-- 詳細結果 -->
            <div class="q-mt-lg">
              <div class="text-h6 text-dark-text q-mb-md">詳細結果</div>
              <div class="q-gutter-sm">
                <q-card
                  v-for="(question, index) in quizQuestions"
                  :key="question.id"
                  class="q-pa-md text-left"
                  :style="isCorrect(question.id)
                    ? 'background: rgba(37, 162, 193, 0.2); border: 2px solid rgba(37, 162, 193, 0.6); color: #f1f5f9;'
                    : 'background: rgba(239, 68, 68, 0.2); border: 2px solid rgba(239, 68, 68, 0.6); color: #f1f5f9;'"
                >
                  <div class="text-h6 q-mb-sm">
                    第 {{ index + 1 }} 題:
                    <span v-if="question.type === 'word-to-definition'">
                      {{ question.word }}
                      <q-btn
                        flat
                        round
                        icon="volume_up"
                        size="xs"
                        color="white"
                        class="q-ml-xs"
                        @click="playPronunciation(question.word)"
                      >
                        <q-tooltip class="bg-dark-card text-dark-text">
                          播放發音
                        </q-tooltip>
                      </q-btn>
                    </span>
                    <span v-else>{{ question.definition }}</span>
                  </div>
                  <div class="text-body1 q-mb-sm">
                    正確答案: <strong>{{ question.type === 'word-to-definition' ? question.definition : question.word }}</strong>
                    <span v-if="question.type === 'definition-to-word'">
                      <q-btn
                        flat
                        round
                        icon="volume_up"
                        size="xs"
                        color="white"
                        class="q-ml-xs"
                        @click="playPronunciation(question.word)"
                      >
                        <q-tooltip class="bg-dark-card text-dark-text">
                          播放發音
                        </q-tooltip>
                      </q-btn>
                    </span>
                  </div>
                  <div class="text-body1 text-dark-text-secondary q-mb-xs">
                    詞性: {{ question.partOfSpeech }}
                  </div>
                  <div class="text-body1 text-dark-text-secondary">
                    例句: {{ question.example || '暫無例句' }}
                  </div>
                </q-card>
              </div>
            </div>

            <q-btn
              color="primary"
              size="lg"
              label="重新測驗"
              @click="resetQuiz"
              class="q-mt-lg"
              rounded
            />
      </q-card>
        </div>
      </div>
    </div>

    <!-- 開始測驗按鈕 -->
    <div v-if="quizState === 'idle'">
      <div class="row justify-center">
        <div class="col-12 col-md-8 col-lg-6 text-center">
          <q-btn
            color="primary"
            size="xl"
            label="開始測驗"
            @click="showSettings = true"
            class="q-px-xl"
            rounded
          />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import type { Word, DayContent } from '../types/vocabulary'

// 測驗狀態
const quizState = ref<'idle' | 'quiz' | 'result'>('idle')
const showSettings = ref(false)
const quizQuestions = ref<QuizQuestion[]>([])
const userAnswers = ref<Record<string, number>>({})
const quizStartTime = ref<number>(0)
const quizResult = ref<QuizResult>({
  correctAnswers: 0,
  totalQuestions: 0,
  timeSpent: 0
})

// 測驗設定
const quizSettings = ref({
  questionCount: 10,
  range: 'all' as 'all' | 'by-date',
  selectedDate: null as string | null
})

const questionCountOptions = [5, 10, 15, 20, 25, 30, 50, 100, 250]

// 單字資料
const toeflData = ref<DayContent[]>([])
const availableDates = ref<Array<{ label: string, value: string }>>([])

// 測驗問題類型
interface QuizQuestion {
  id: string
  type: 'word-to-definition' | 'definition-to-word' // 題型：單字選中文 或 中文選單字
  word: string
  definition: string
  partOfSpeech?: string
  example?: string
  options: string[]
  correctAnswer: number
}

interface QuizResult {
  correctAnswers: number
  totalQuestions: number
  timeSpent: number
}

// 計算屬性
const canStartQuiz = computed(() => {
  if (quizSettings.value.range === 'by-date') {
    return quizSettings.value.selectedDate !== null
  }
  return true
})

const answeredQuestions = computed(() => {
  return Object.values(userAnswers.value).filter(answer => answer !== undefined && answer !== null).length
})

// 載入單字資料
async function loadVocabularyData() {
  try {
    const response = await fetch('/toefl.json')
    if (response.ok) {
      toeflData.value = await response.json()
      // 提取可用日期
      availableDates.value = toeflData.value.map(day => ({
        label: `${day.date} - ${day.article?.title || '無標題'}`,
        value: day.date
      }))
    }
  } catch {
    // 載入托福單字資料失敗
  }
}

// 開始測驗
function startQuiz() {
  const allWords = getAllWords()
  if (allWords.length === 0) {
    return
  }

  // 隨機選擇單字
  const shuffledWords = [...allWords].sort(() => Math.random() - 0.5)
  const selectedWords = shuffledWords.slice(0, quizSettings.value.questionCount)

  // 生成測驗題目
  quizQuestions.value = selectedWords.map((word, index) => {
    // 隨機選擇題型
    const questionType = Math.random() < 0.5 ? 'word-to-definition' : 'definition-to-word'

    if (questionType === 'word-to-definition') {
      // 題型一：顯示單字，選出正確的中文解釋
      const wrongOptions = generateWrongDefinitions(word.definition, allWords)
      const options = [word.definition, ...wrongOptions].sort(() => Math.random() - 0.5)
      const correctAnswer = options.indexOf(word.definition)

      return {
        id: `q-${index}-${word.id}-word-to-definition`,
        type: 'word-to-definition',
        word: word.word,
        definition: word.definition,
        partOfSpeech: word.partOfSpeech,
        example: word.example,
        options,
        correctAnswer
      }
    } else {
      // 題型二：顯示中文解釋，選出正確的單字
      const wrongOptions = generateWrongOptions(word.word, allWords)
      const options = [word.word, ...wrongOptions].sort(() => Math.random() - 0.5)
      const correctAnswer = options.indexOf(word.word)

      return {
        id: `q-${index}-${word.id}-definition-to-word`,
        type: 'definition-to-word',
        word: word.word,
        definition: word.definition,
        partOfSpeech: word.partOfSpeech,
        example: word.example,
        options,
        correctAnswer
      }
    }
  })

  // 重置答案
  userAnswers.value = {}
  quizStartTime.value = Date.now()
  quizState.value = 'quiz'
  showSettings.value = false
}

// 獲取所有單字
function getAllWords(): Word[] {
  if (quizSettings.value.range === 'all') {
    const words: Word[] = []
    toeflData.value.forEach(day => {
      words.push(...day.words)
    })
    return words
  } else {
    const words: Word[] = []
    toeflData.value.forEach(day => {
      if (day.date === quizSettings.value.selectedDate) {
        words.push(...day.words)
      }
    })
    return words
  }
}

// 生成錯誤選項（單字）
function generateWrongOptions(correctWord: string, allWords: Word[]): string[] {
  const wrongWords = allWords
    .filter(word => word.word !== correctWord)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(word => word.word)

  return wrongWords
}

// 生成錯誤選項（中文解釋）
function generateWrongDefinitions(correctDefinition: string, allWords: Word[]): string[] {
  const wrongDefinitions = allWords
    .filter(word => word.definition !== correctDefinition)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(word => word.definition)

  return wrongDefinitions
}

// 選擇答案
function selectAnswer(questionId: string, optionIndex: number) {
  // 確保答案被正確設置
  userAnswers.value[questionId] = optionIndex
  // 強制觸發響應式更新
  userAnswers.value = { ...userAnswers.value }
}

// 檢查是否已選擇
function isSelected(questionId: string, optionIndex: number): boolean {
  const userAnswer = userAnswers.value[questionId]
  return userAnswer !== undefined && userAnswer !== null && userAnswer === optionIndex
}

// 獲取選項樣式
function getOptionClass(questionId: string, optionIndex: number): string {
  if (quizState.value === 'result') {
    const question = quizQuestions.value.find(q => q.id === questionId)
    if (!question) return ''

    if (optionIndex === question.correctAnswer) {
      return 'bg-positive text-dark'
    }
    if (userAnswers.value[questionId] === optionIndex && optionIndex !== question.correctAnswer) {
      return 'bg-negative text-dark'
    }
  }
  return ''
}

// 獲取選項顏色
function getOptionColor(questionId: string, optionIndex: number): string {
  if (quizState.value === 'result') {
    return 'white'
  }
  return isSelected(questionId, optionIndex) ? 'primary' : 'white'
}

// 提交測驗
function submitQuiz() {
  if (answeredQuestions.value < quizQuestions.value.length) {
    return
  }

  // 計算結果
  let correctAnswers = 0
  quizQuestions.value.forEach(question => {
    if (userAnswers.value[question.id] === question.correctAnswer) {
      correctAnswers++
    }
  })

  const timeSpent = Date.now() - quizStartTime.value

  quizResult.value = {
    correctAnswers,
    totalQuestions: quizQuestions.value.length,
    timeSpent
  }

  quizState.value = 'result'

  // 滾動到頁面頂部
  void nextTick(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  })
}

// 檢查答案是否正確
function isCorrect(questionId: string): boolean {
  const question = quizQuestions.value.find(q => q.id === questionId)
  if (!question) return false
  return userAnswers.value[questionId] === question.correctAnswer
}

// 播放發音
function playPronunciation(word: string) {
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(word)
    utterance.lang = 'en-US'
    utterance.rate = 0.8
    speechSynthesis.speak(utterance)
  }
}

// 重置測驗
function resetQuiz() {
  quizState.value = 'idle'
  quizQuestions.value = []
  userAnswers.value = {}
  showSettings.value = true
}

onMounted(() => {
  void loadVocabularyData()
})
</script>
