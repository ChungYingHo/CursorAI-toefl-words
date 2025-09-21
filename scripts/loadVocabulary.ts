import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs'
import { join, basename } from 'path'
import type { DayVocabulary, Word, DayContent, Article } from '../src/types/vocabulary'

// 解析 markdown 表格行
function parseMarkdownTableRow(line: string): Word | null {
  // 移除表格分隔符號
  const cleanLine = line.replace(/^\|/, '').replace(/\|$/, '')
  const columns = cleanLine.split('|').map(col => col.trim())

  if (columns.length < 4) {
    return null
  }

  const [word, partOfSpeech, definition, example] = columns

  // 檢查是否為表格標題行或分隔行
  if (!word || word.includes('---') || word === '單字' || word === '詞性' || word === '中文' || word === '例句') {
    return null
  }

  if (!word || word.length === 0) {
    return null
  }

  return {
    id: 0, // 稍後會重新編號
    word: word.trim(),
    partOfSpeech: partOfSpeech ? partOfSpeech.trim() : '',
    definition: definition ? definition.trim() : '',
    example: example ? example.trim() : ''
  }
}

// 解析 frontmatter
function parseFrontmatter(content: string): { frontmatter: any, content: string } | null {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/
  const match = content.match(frontmatterRegex)

  if (!match) {
    return null
  }

  const frontmatterText = match[1]
  const contentText = match[2]

  if (!frontmatterText || !contentText) {
    return null
  }

  // 解析 YAML frontmatter
  const frontmatter: any = {}
  frontmatterText.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':')
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim()
      let value: string | null = line.substring(colonIndex + 1).trim()

      // 處理 null 值
      if (value === 'null') {
        value = null
      }

      frontmatter[key] = value
    }
  })

  return { frontmatter, content: contentText }
}

// 解析 note 和 summary 區塊
function parseBlocks(content: string): { note?: string, summary?: string, content: string } {
  let note: string | undefined
  let summary: string | undefined
  let cleanContent = content

  // 解析 note 區塊
  const noteMatch = content.match(/:::note\s*([\s\S]*?)\s*:::/g)
  if (noteMatch) {
    note = noteMatch[0].replace(/:::note\s*/, '').replace(/\s*:::/, '').trim()
    cleanContent = cleanContent.replace(/:::note\s*([\s\S]*?)\s*:::/g, '')
  }

  // 解析 summary 區塊
  const summaryMatch = content.match(/:::summary\s*([\s\S]*?)\s*:::/g)
  if (summaryMatch) {
    summary = summaryMatch[0].replace(/:::summary\s*/, '').replace(/\s*:::/, '').trim()
    cleanContent = cleanContent.replace(/:::summary\s*([\s\S]*?)\s*:::/g, '')
  }

  const result: { note?: string, summary?: string, content: string } = {
    content: cleanContent.trim()
  }

  if (note) result.note = note
  if (summary) result.summary = summary

  return result
}

// 解析單個 markdown 檔案（新格式）
function parseMarkdownFile(filePath: string): DayContent | null {
  try {
    const content = readFileSync(filePath, 'utf-8')
    const parsed = parseFrontmatter(content)

    if (!parsed) {
      console.warn(`檔案 ${filePath} 沒有有效的 frontmatter`)
      return null
    }

    const { frontmatter, content: contentText } = parsed
    const words: Word[] = []
    let articleContent = ''
    let inWordsSection = false

    // 解析 note 和 summary 區塊
    const { note, summary, content: cleanContent } = parseBlocks(contentText)

    const lines = cleanContent.split('\n')

    for (const line of lines) {
      // 檢查是否進入單字區段
      if (line.trim() === '## 單字' || line.trim() === '# 單字') {
        inWordsSection = true
        continue
      }

      // 如果遇到表格行且還沒進入單字區段，自動進入
      if (!inWordsSection && line.trim().startsWith('|') && line.includes('單字')) {
        inWordsSection = true
        continue
      }

      if (inWordsSection) {
        const word = parseMarkdownTableRow(line)
        if (word) {
          words.push(word)
        }
      } else {
        // 收集文章內容（但排除單字表格）
        if (!line.trim().startsWith('|')) {
          articleContent += line + '\n'
        }
      }
    }

    // 重新編號單字
    words.forEach((word, index) => {
      word.id = index + 1
    })

    // 建立文章物件
    const article: Article | null = frontmatter.title ? {
      date: frontmatter.date || '',
      title: frontmatter.title,
      link: frontmatter.link,
      content: articleContent.trim(),
      ...(note && { note }),
      ...(summary && { summary })
    } : null

    return {
      date: frontmatter.date || '',
      article,
      words
    }
  } catch (error) {
    console.error(`解析檔案 ${filePath} 時發生錯誤:`, error)
    return null
  }
}

// 載入指定資料夾的所有 markdown 檔案
function loadVocabularyFromFolder(folderPath: string): DayContent[] {
  const vocabulary: DayContent[] = []

  if (!existsSync(folderPath)) {
    console.warn(`資料夾 ${folderPath} 不存在`)
    return vocabulary
  }

  const files = readdirSync(folderPath)
  const markdownFiles = files.filter(file => file.endsWith('.md'))

  for (const file of markdownFiles) {
    const filePath = join(folderPath, file)
    const dayContent = parseMarkdownFile(filePath)

    if (dayContent) {
      vocabulary.push(dayContent)
    }
  }

  // 按日期排序
  vocabulary.sort((a, b) => a.date.localeCompare(b.date))

  return vocabulary
}

// 主函數
function main() {
  console.log('開始載入單字資料...')

  // 載入托福單字
  console.log('載入托福單字...')
  const toeflVocabulary = loadVocabularyFromFolder('./toefl')
  console.log(`載入了 ${toeflVocabulary.length} 天的托福單字`)

  // 載入一般單字
  console.log('載入一般單字...')
  const dailyVocabulary = loadVocabularyFromFolder('./daily')
  console.log(`載入了 ${dailyVocabulary.length} 天的一般單字`)

  // 確保 public 資料夾存在
  if (!existsSync('./public')) {
    mkdirSync('./public')
  }

  // 寫入 JSON 檔案
  console.log('寫入 JSON 檔案...')
  writeFileSync('./public/toefl.json', JSON.stringify(toeflVocabulary, null, 2))
  writeFileSync('./public/daily.json', JSON.stringify(dailyVocabulary, null, 2))

  console.log('單字資料載入完成!')
  console.log(`托福單字: ${toeflVocabulary.length} 天`)
  console.log(`一般單字: ${dailyVocabulary.length} 天`)

  // 顯示統計資訊
  const totalToeflWords = toeflVocabulary.reduce((sum, day) => sum + day.words.length, 0)
  const totalDailyWords = dailyVocabulary.reduce((sum, day) => sum + day.words.length, 0)

  console.log(`總計托福單字: ${totalToeflWords} 個`)
  console.log(`總計一般單字: ${totalDailyWords} 個`)
}

// 執行主函數
main()
