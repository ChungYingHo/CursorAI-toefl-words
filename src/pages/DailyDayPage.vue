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
                每日閱讀 (一般) - {{ date }}
              </div>
              <div class="text-h4 text-white q-mb-sm font-weight-bold">
                {{ dayData.article.title }}
              </div>
            </div>

                    <div class="q-mb-md">
                      <div class="row q-gutter-sm">
                        <q-btn
                          v-if="dayData.article.link"
                          color="accent"
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
                        <q-btn
                          v-if="!isPlaying && !isPaused"
                          color="teal"
                          outline
                          icon="play_arrow"
                          label="全文朗誦"
                          @click="playArticleContent"
                        >
                          <q-tooltip class="bg-dark-card text-dark-text">
                            開始朗誦文章
                          </q-tooltip>
                        </q-btn>
                        <q-btn
                          v-if="!isPlaying && isPaused"
                          color="teal"
                          outline
                          icon="play_arrow"
                          label="繼續朗誦"
                          @click="playArticleContent"
                        >
                          <q-tooltip class="bg-dark-card text-dark-text">
                            繼續朗誦文章
                          </q-tooltip>
                        </q-btn>
                        <q-btn
                          v-if="!isPlaying && isPaused"
                          color="blue"
                          outline
                          icon="replay"
                          label="重頭朗誦"
                          @click="restartArticleContent"
                        >
                          <q-tooltip class="bg-dark-card text-dark-text">
                            從頭開始朗誦
                          </q-tooltip>
                        </q-btn>
                        <q-btn
                          v-if="isPlaying"
                          color="amber"
                          outline
                          icon="pause"
                          label="暫停朗誦"
                          @click="pauseArticleContent"
                        >
                          <q-tooltip class="bg-dark-card text-dark-text">
                            暫停朗誦
                          </q-tooltip>
                        </q-btn>
                        <q-btn
                          v-if="isPlaying"
                          color="red"
                          outline
                          icon="stop"
                          label="停止"
                          @click="stopArticleContent"
                        >
                          <q-tooltip class="bg-dark-card text-dark-text">
                            停止朗誦
                          </q-tooltip>
                        </q-btn>
                      </div>
                    </div>
            <div class="text-body1 text-white" v-html="formatArticleContent(dayData.article.content)">
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
        @click="$router.push('/daily/by-day')"
        class="q-mt-md"
      />
    </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import type { DayContent } from '../types/vocabulary'

const route = useRoute()
const loading = ref(true)
const error = ref('')
const dailyData = ref<DayContent[]>([])
const isPlaying = ref(false)
const isPaused = ref(false)

// 從路由參數獲取日期
const date = computed(() => {
  const encodedDate = route.params.date as string
  // 將 2025-09-21 轉換回 2025/09/21
  return encodedDate.replace(/-/g, '/')
})

// 獲取指定日期的資料
const dayData = computed(() => {
  return dailyData.value.find(day => day.date === date.value)
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
    const response = await fetch('/daily.json')
    if (!response.ok) {
      throw new Error('載入一般單字資料失敗')
    }
    dailyData.value = await response.json()
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
    utterance.rate = 0.8
    speechSynthesis.speak(utterance)
  }
}

// 朗誦文章內容
function playArticleContent() {
  if ('speechSynthesis' in window && dayData.value?.article?.content) {
    if (isPaused.value) {
      // 如果之前暫停了，繼續播放
      speechSynthesis.resume()
      isPlaying.value = true
      isPaused.value = false
    } else {
      // 重新開始播放
      speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(dayData.value.article.content)
      utterance.lang = 'en-US'
      utterance.rate = 1.0
      utterance.pitch = 1.0

      utterance.onstart = () => {
        isPlaying.value = true
        isPaused.value = false
      }

      utterance.onend = () => {
        isPlaying.value = false
        isPaused.value = false
      }

      utterance.onerror = () => {
        isPlaying.value = false
        isPaused.value = false
      }

      speechSynthesis.speak(utterance)
    }
  }
}

// 暫停朗誦
function pauseArticleContent() {
  if ('speechSynthesis' in window) {
    speechSynthesis.pause()
    isPlaying.value = false
    isPaused.value = true
  }
}

// 停止朗誦
function stopArticleContent() {
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel()
    isPlaying.value = false
    isPaused.value = false
  }
}

// 重頭朗誦
function restartArticleContent() {
  if ('speechSynthesis' in window && dayData.value?.article?.content) {
    speechSynthesis.cancel()
    isPaused.value = false

    const utterance = new SpeechSynthesisUtterance(dayData.value.article.content)
    utterance.lang = 'en-US'
    utterance.rate = 1.0
    utterance.pitch = 1.0

    utterance.onstart = () => {
      isPlaying.value = true
      isPaused.value = false
    }

    utterance.onend = () => {
      isPlaying.value = false
      isPaused.value = false
    }

    utterance.onerror = () => {
      isPlaying.value = false
      isPaused.value = false
    }

    speechSynthesis.speak(utterance)
  }
}

// 格式化文章內容
function formatArticleContent(content: string): string {
  return content
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
}

// 獲取 GitHub 編輯 URL
function getGitHubEditUrl(): string {
  // 將 2025/09/03 轉換為 2025-09-03
  const encodedDate = date.value.replace(/\//g, '-')
  return `https://github.com/ChungYingHo/CursorAI-toefl-words/blob/master/daily/${encodedDate}.md`
}

onMounted(() => {
  void loadVocabularyData()
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
