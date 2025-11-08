<template>
  <q-page class="q-pa-md" style="min-height: 100vh;">

    <!-- 隨機英聽推薦區塊 -->
    <div class="q-mb-lg">
      <div class="text-center q-mb-md">
        <h2 class="text-h5 text-dark-text q-mb-sm font-weight-bold">每日推薦英聽</h2>
      </div>

      <div class="row justify-center q-px-md">
        <div class="col-12 col-md-8 col-lg-6">
          <q-card class="vocab-card bg-dark-card q-pa-none featured-listening-card">
            <div v-if="listeningLoading" class="text-center q-pa-xl">
              <q-spinner-dots color="primary" size="40px" />
              <div class="text-dark-text-secondary q-mt-sm">載入中...</div>
            </div>

            <div v-else-if="listeningError" class="text-center q-pa-xl text-negative">
              {{ listeningError }}
            </div>

            <template v-else-if="currentListening">
              <div class="featured-video-wrapper">
                <iframe
                  :src="currentListening.embedUrl"
                  title="每日推薦英聽"
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowfullscreen
                />
              </div>
              <div class="q-pa-md" />
              <q-separator dark />
              <q-card-actions align="right" class="q-pa-md">
                <q-btn
                  flat
                  color="primary"
                  icon="open_in_new"
                  label="在 YouTube 開啟"
                  :href="currentListening.link"
                  target="_blank"
                  rel="noopener"
                />
                <q-btn
                  flat
                  color="secondary"
                  icon="shuffle"
                  label="換一部"
                  @click="pickRandomListening"
                />
              </q-card-actions>
            </template>

            <div v-else class="text-center q-pa-xl text-dark-text-secondary">
              目前沒有英聽資料可用。
            </div>
          </q-card>
        </div>
      </div>
    </div>

    <!-- 功能卡片區塊 -->
    <div class="vocab-grid">
      <div class="vocab-card-wrapper">
        <q-card
          class="vocab-card cursor-pointer"
          @click="$router.push('/toefl/by-day')"
        >
          <q-card-section class="text-center q-pa-lg">
            <q-icon name="calendar_today" size="48px" color="secondary" class="q-mb-md" />
            <div class="text-h6 text-dark-text q-mb-sm font-weight-bold">每日閱讀 (托福)</div>
            <div class="text-body1 text-dark-text-secondary">
              每日托福閱讀文章，循序漸進學習
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="vocab-card-wrapper">
        <q-card
          class="vocab-card cursor-pointer"
          @click="$router.push('/daily/by-day')"
        >
          <q-card-section class="text-center q-pa-lg">
            <q-icon name="event" size="48px" color="info" class="q-mb-md" />
            <div class="text-h6 text-dark-text q-mb-sm font-weight-bold">每日閱讀 (一般)</div>
            <div class="text-body1 text-dark-text-secondary">
              每日一般閱讀文章，持續累積單字
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="vocab-card-wrapper">
        <q-card
          class="vocab-card cursor-pointer"
          @click="$router.push('/toefl')"
        >
          <q-card-section class="text-center q-pa-lg">
            <q-icon name="school" size="48px" color="primary" class="q-mb-md" />
            <div class="text-h6 text-dark-text q-mb-sm font-weight-bold">全部托福單字</div>
            <div class="text-body1 text-dark-text-secondary">
              瀏覽所有托福單字，系統化學習
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="vocab-card-wrapper">
        <q-card
          class="vocab-card cursor-pointer"
          @click="$router.push('/daily')"
        >
          <q-card-section class="text-center q-pa-lg">
            <q-icon name="book" size="48px" color="accent" class="q-mb-md" />
            <div class="text-h6 text-dark-text q-mb-sm font-weight-bold">全部一般單字</div>
            <div class="text-body1 text-dark-text-secondary">
              瀏覽所有一般單字，擴充詞彙量
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="vocab-card-wrapper">
        <q-card
          class="vocab-card cursor-pointer"
          @click="$router.push('/quiz-toefl')"
        >
          <q-card-section class="text-center q-pa-lg">
            <q-icon name="quiz" size="48px" color="positive" class="q-mb-md" />
            <div class="text-h6 text-dark-text q-mb-sm font-weight-bold">托福單字測驗</div>
            <div class="text-body1 text-dark-text-secondary">
              測試托福單字掌握程度
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="vocab-card-wrapper">
        <q-card
          class="vocab-card cursor-pointer"
          @click="$router.push('/quiz-daily')"
        >
          <q-card-section class="text-center q-pa-lg">
            <q-icon name="assignment" size="48px" color="warning" class="q-mb-md" />
            <div class="text-h6 text-dark-text q-mb-sm font-weight-bold">一般單字測驗</div>
            <div class="text-body1 text-dark-text-secondary">
              測試一般單字掌握程度
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

interface ListeningItem {
  date: string
  topic: string
  link: string
  embedUrl: string
}

const listeningItems = ref<ListeningItem[]>([])
const listeningLoading = ref(true)
const listeningError = ref('')
const currentListeningIndex = ref<number | null>(null)

const currentListening = computed(() => {
  if (currentListeningIndex.value === null) {
    return null
  }
  return listeningItems.value[currentListeningIndex.value] ?? null
})

function parseListeningMarkdown(markdown: string): ListeningItem[] {
  const lines = markdown
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('|') && !line.startsWith('| Date'))

  const dataLines = lines.filter(line => !line.startsWith('|----------'))

  const items: ListeningItem[] = []

  dataLines.forEach(line => {
    const columns = line
      .split('|')
      .map(col => col.trim())
      .filter(Boolean)

    if (columns.length < 3) {
      return
    }

    const date = columns[0]
    const topic = columns[1]
    const link = columns[2]

    if (!date || !topic || !link) {
      return
    }

    items.push({
      date,
      topic,
      link,
      embedUrl: toEmbedUrl(link)
    })
  })

  return items
}

function toEmbedUrl(url: string): string {
  try {
    const parsed = new URL(url)

    if (parsed.hostname.includes('youtu.be')) {
      const videoId = parsed.pathname.replace('/', '')
      const embed = new URL(`https://www.youtube.com/embed/${videoId}`)
      const start = extractStartSeconds(parsed.searchParams)
      if (start) {
        embed.searchParams.set('start', start.toString())
      }
      embed.searchParams.set('rel', '0')
      return embed.toString()
    }

    if (parsed.hostname.includes('youtube.com')) {
      if (parsed.pathname === '/watch') {
        const videoId = parsed.searchParams.get('v')
        if (videoId) {
          const embed = new URL(`https://www.youtube.com/embed/${videoId}`)
          const start = extractStartSeconds(parsed.searchParams)
          if (start) {
            embed.searchParams.set('start', start.toString())
          }
          embed.searchParams.set('rel', '0')
          return embed.toString()
        }
      } else if (parsed.pathname.startsWith('/embed/')) {
        const embed = new URL(url)
        embed.searchParams.set('rel', '0')
        return embed.toString()
      }
    }

    return url
  } catch {
    return url
  }
}

function extractStartSeconds(params: URLSearchParams): number | null {
  const start = params.get('start') || params.get('t')
  if (!start) {
    return null
  }

  if (/^\d+$/.test(start)) {
    return Number(start)
  }

  const match = start.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/)
  if (!match) {
    return null
  }

  const hours = Number(match[1] || 0)
  const minutes = Number(match[2] || 0)
  const seconds = Number(match[3] || 0)

  const totalSeconds = hours * 3600 + minutes * 60 + seconds
  return totalSeconds > 0 ? totalSeconds : null
}

function pickRandomListening() {
  if (!listeningItems.value.length) {
    currentListeningIndex.value = null
    return
  }

  if (listeningItems.value.length === 1) {
    currentListeningIndex.value = 0
    return
  }

  let nextIndex = Math.floor(Math.random() * listeningItems.value.length)
  if (nextIndex === currentListeningIndex.value) {
    nextIndex = (nextIndex + 1) % listeningItems.value.length
  }
  currentListeningIndex.value = nextIndex
}

onMounted(async () => {
  try {
    const listeningMarkdownUrl = new URL('../../listening/listening.md', import.meta.url)
    const response = await fetch(listeningMarkdownUrl.toString())
    if (!response.ok) {
      throw new Error('載入英聽資料失敗')
    }
    const markdown = await response.text()
    const items = parseListeningMarkdown(markdown)

    if (items.length === 0) {
      listeningItems.value = []
      currentListeningIndex.value = null
    } else {
      // 依日期排序（最新在前）
      listeningItems.value = items.sort((a, b) => {
        const aDate = new Date(a.date.replace(/\//g, '-')).getTime()
        const bDate = new Date(b.date.replace(/\//g, '-')).getTime()
        return bDate - aDate
      })
      pickRandomListening()
    }
  } catch (err) {
    listeningError.value = err instanceof Error ? err.message : '載入英聽資料時發生錯誤'
  } finally {
    listeningLoading.value = false
  }
})
</script>

<style scoped>
.featured-listening-card {
  overflow: hidden;
}

.featured-video-wrapper {
  position: relative;
  padding-top: 56.25%;
  background: #000;
}

.featured-video-wrapper iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 0;
}
</style>
