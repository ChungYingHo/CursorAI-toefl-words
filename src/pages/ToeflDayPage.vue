<template>
  <q-page class="q-pa-md">
    <div class="container">

    <!-- 載入狀態 -->
    <div v-if="loading" class="text-center q-py-xl">
      <q-spinner-dots size="50px" color="primary" />
      <div class="text-dark-text-secondary q-mt-md">載入中...</div>
    </div>

    <!-- 錯誤狀態 -->
    <div v-else-if="error" class="text-center q-py-xl">
      <q-icon name="error" size="50px" color="negative" />
      <div class="text-dark-text q-mt-md">{{ error }}</div>
      <q-btn
        color="primary"
        label="重新載入"
        @click="loadVocabularyData"
        class="q-mt-md"
      />
    </div>

    <!-- 文章內容 -->
    <div v-if="dayData?.article" class="q-mb-lg">
      <div class="vocab-grid">
        <q-card class="q-pa-md" style="background-color: #2d3748;">
          <q-card-section>
            <!-- 文章標題和日期 -->
            <div class="text-center q-mb-lg">
              <div class="text-h5 text-white q-mb-sm">
                每日閱讀 (托福) - {{ date }}
              </div>
              <div class="text-h4 text-white q-mb-sm font-weight-bold">
                {{ dayData.article.title }}
              </div>
            </div>

                    <div class="q-mb-md">
                      <div class="row q-gutter-sm">
                        <q-btn
                          v-if="dayData.article.link"
                          color="primary"
                          outline
                          :href="dayData.article.link"
                          target="_blank"
                          icon="link"
                          label="查看原文"
                        />
                        <q-btn
                          color="orange"
                          outline
                          :href="getGitHubEditUrl()"
                          target="_blank"
                          icon="edit"
                          label="Edit on GitHub"
                        />
                      </div>
                    </div>
            <div class="text-body1 text-white">
              <div
                v-for="(paragraph, index) in getArticleParagraphs(dayData.article.content)"
                :key="index"
                class="q-mb-md"
              >
                <div class="d-flex align-items-center">
                  <span v-html="formatArticleContent(paragraph)" class="flex-grow"></span>
                  <div class="q-ml-sm d-flex q-gutter-xs">
                    <!-- 播放/繼續按鈕 -->
                    <q-btn
                      v-if="!paragraphStates[paragraph]?.isPlaying || paragraphStates[paragraph]?.isPaused"
                      size="xs"
                      color="teal"
                      outline
                      round
                      icon="play_arrow"
                      @click="playParagraph(paragraph)"
                    >
                      <q-tooltip class="bg-dark-card text-dark-text">
                        {{ paragraphStates[paragraph]?.isPaused ? '繼續朗誦' : '朗誦此段落' }}
                      </q-tooltip>
                    </q-btn>

                    <!-- 暫停按鈕 -->
                    <q-btn
                      v-if="paragraphStates[paragraph]?.isPlaying"
                      size="xs"
                      color="amber"
                      outline
                      round
                      icon="pause"
                      @click="pauseParagraph(paragraph)"
                    >
                      <q-tooltip class="bg-dark-card text-dark-text">
                        暫停朗誦
                      </q-tooltip>
                    </q-btn>

                    <!-- 停止按鈕 -->
                    <q-btn
                      v-if="paragraphStates[paragraph]?.isPlaying || paragraphStates[paragraph]?.isPaused"
                      size="xs"
                      color="red"
                      outline
                      round
                      icon="stop"
                      @click="stopParagraph(paragraph)"
                    >
                      <q-tooltip class="bg-dark-card text-dark-text">
                        停止朗誦
                      </q-tooltip>
                    </q-btn>
                  </div>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- 單字列表 -->
    <div v-if="dayWords.length > 0" class="q-mt-lg">

      <!-- 單字卡片網格 -->
      <div class="vocab-grid">
        <div
          v-for="word in dayWords"
          :key="word.id"
          class="vocab-card-wrapper"
        >
          <q-card class="vocab-card h-full">
            <q-card-section class="q-pa-md d-flex flex-column h-full">
              <div class="row items-start justify-between q-mb-sm">
                <div class="text-h5 text-primary font-weight-bold">
                  {{ word.word }}
                </div>
                <q-btn
                  flat
                  round
                  icon="volume_up"
                  size="sm"
                  color="primary"
                  @click="playPronunciation(word.word)"
                >
                  <q-tooltip class="bg-dark-card text-dark-text">
                    播放發音
                  </q-tooltip>
                </q-btn>
              </div>

              <div class="text-subtitle2 text-dark-text-secondary q-mb-sm">
                {{ word.partOfSpeech }}
              </div>

              <div class="text-body1 text-dark-text q-mb-sm flex-grow">
                {{ word.definition }}
              </div>

              <div v-if="word.example" class="text-body1 text-dark-text-secondary mt-auto">
                {{ word.example }}
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

    </div>

    <!-- 空狀態 -->
    <div v-else class="text-center q-py-xl">
      <q-icon name="book" size="80px" color="grey-6" />
      <div class="text-h6 text-dark-text-secondary q-mt-md">
        找不到 {{ date }} 的單字資料
      </div>
      <div class="text-body1 text-dark-text-secondary q-mt-sm">
        請確認日期是否正確
      </div>
      <q-btn
        color="primary"
        label="返回天數列表"
        @click="$router.push('/toefl/by-day')"
        class="q-mt-md"
      />
    </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import type { DayContent } from '../types/vocabulary'

const route = useRoute()
const loading = ref(true)
const error = ref('')
const toeflData = ref<DayContent[]>([])
const paragraphStates = ref<Record<string, { isPlaying: boolean; isPaused: boolean }>>({})

// 從路由參數獲取日期
const date = computed(() => {
  const encodedDate = route.params.date as string
  // 將 2025-09-21 轉換回 2025/09/21
  return encodedDate.replace(/-/g, '/')
})

// 獲取指定日期的資料
const dayData = computed(() => {
  return toeflData.value.find(day => day.date === date.value)
})

// 獲取指定日期的單字
const dayWords = computed(() => {
  return dayData.value ? dayData.value.words : []
})

// 載入單字資料
async function loadVocabularyData() {
  loading.value = true
  error.value = ''

  try {
    const response = await fetch('/toefl.json')
    if (!response.ok) {
      throw new Error('載入托福單字資料失敗')
    }
    toeflData.value = await response.json()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '載入資料時發生錯誤'
  } finally {
    loading.value = false
  }
}

// 播放發音
function playPronunciation(word: string) {
  if ('speechSynthesis' in window) {
    // 停止當前播放
    speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(word)
    utterance.lang = 'en-US'
    utterance.rate = 0.9
    speechSynthesis.speak(utterance)
  }
}

// 將文章內容分割成段落
function getArticleParagraphs(content: string): string[] {
  return content
    .split(/\r\n\r\n|\n\n/)  // 按雙換行分割段落
    .filter(paragraph => paragraph.trim().length > 0)  // 過濾空段落
    .map(paragraph => paragraph.trim())  // 移除首尾空白
}

// 朗誦單個段落
function playParagraph(paragraph: string) {
  if ('speechSynthesis' in window) {
    const state = paragraphStates.value[paragraph]

    if (state?.isPaused) {
      // 如果之前暫停了同一個段落，繼續播放
      speechSynthesis.resume()
      paragraphStates.value[paragraph] = { isPlaying: true, isPaused: false }
    } else {
      // 停止其他段落的播放
      speechSynthesis.cancel()

      // 重置所有段落狀態
      Object.keys(paragraphStates.value).forEach(key => {
        paragraphStates.value[key] = { isPlaying: false, isPaused: false }
      })

      // 清理段落內容
      const cleanParagraph = paragraph
        .replace(/\r\n/g, ' ')  // 移除換行符
        .replace(/\n/g, ' ')   // 移除換行符
        .replace(/"/g, '')      // 移除雙引號
        .replace(/'/g, '')      // 移除單引號
        .replace(/\[.*?\]/g, '') // 移除方括號內容
        .replace(/\s+/g, ' ')   // 合併多個空格為單個空格
        .trim()                 // 移除首尾空格

      const utterance = new SpeechSynthesisUtterance(cleanParagraph)
      utterance.lang = 'en-US'
      utterance.rate = 0.9
      utterance.pitch = 1.0

      utterance.onstart = () => {
        paragraphStates.value[paragraph] = { isPlaying: true, isPaused: false }
      }

      utterance.onend = () => {
        paragraphStates.value[paragraph] = { isPlaying: false, isPaused: false }
      }

      utterance.onerror = () => {
        paragraphStates.value[paragraph] = { isPlaying: false, isPaused: false }
      }

      speechSynthesis.speak(utterance)
    }
  }
}

// 暫停朗誦
function pauseParagraph(paragraph: string) {
  if ('speechSynthesis' in window) {
    speechSynthesis.pause()
    paragraphStates.value[paragraph] = { isPlaying: false, isPaused: true }
  }
}

// 停止朗誦
function stopParagraph(paragraph: string) {
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel()
    paragraphStates.value[paragraph] = { isPlaying: false, isPaused: false }
  }
}

// 格式化文章內容
function formatArticleContent(content: string): string {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
}

// 獲取 GitHub 編輯 URL
function getGitHubEditUrl(): string {
  // 將 2025/09/22 轉換為 2025-09-22
  const encodedDate = date.value.replace(/\//g, '-')
  return `https://github.com/ChungYingHo/CursorAI-toefl-words/blob/master/toefl/${encodedDate}.md`
}

onMounted(() => {
  void loadVocabularyData()
})

onUnmounted(() => {
  // 頁面切換時停止朗誦
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel()
  }
})
</script>

<style scoped>
.items-per-page-select {
  min-width: 80px
}

.vocab-card {
  transition: transform 0.2s ease-in-out
}

.vocab-card:hover {
  transform: translateY(-2px)
}
</style>
