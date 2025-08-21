import OpenAI from 'openai'
import { createHash } from 'crypto'
import { supabaseServer } from '@/lib/supabase-server'
import type { PrayerGenerationRequest, CachedPrayer } from '@/types/prayer'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'placeholder-key',
})

interface PrayerFeedback {
  prayerId: string
  rating: number // 1-5
  feedback: string
  improvements: string[]
  userId?: string
}

export class EnhancedPrayerService {
  private static readonly CACHE_TABLE = 'prayer_cache'
  private static readonly FEEDBACK_TABLE = 'prayer_feedback'
  private static readonly LEARNING_TABLE = 'prayer_learning_data'
  private static readonly CACHE_TTL_HOURS = 24

  static generateCacheKey(request: PrayerGenerationRequest): string {
    const normalizedRequest = {
      title: request.title.toLowerCase().trim(),
      category: request.category?.toLowerCase().trim() || '',
      situation: request.situation?.toLowerCase().trim() || '',
      tone: request.tone || 'warm',
      length: request.length || 'short',
    }
    
    const dataString = JSON.stringify(normalizedRequest)
    return createHash('sha256').update(dataString).digest('hex')
  }

  // 입력 내용을 자연스러운 표현으로 변환
  static async transformUserInput(title: string, situation?: string): Promise<{
    transformedTitle: string
    transformedSituation?: string
    prayerContext: string
  }> {
    const transformationPrompt = `다음 기도 제목과 상황을 더 자연스럽고 기도문에 적합한 표현으로 변환해주세요:

제목: "${title}"
${situation ? `상황: "${situation}"` : ''}

변환 규칙:
1. 직접적인 표현을 간접적이고 겸손한 표현으로
2. 명령조를 간구하는 어조로
3. 구체적인 단어를 기도문에 어울리는 표현으로
4. 한국 기독교 문화에 맞는 정중한 표현으로

응답은 다음 JSON 형식으로:
{
  "transformedTitle": "변환된 제목",
  "transformedSituation": "변환된 상황 (없으면 null)",
  "prayerContext": "기도문 작성에 도움될 배경 설명"
}

JSON만 응답하세요.`

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: transformationPrompt }],
        temperature: 0.7,
        max_tokens: 500,
      })

      const content = response.choices[0]?.message?.content?.trim()
      if (!content) throw new Error('No transformation response')

      const parsed = JSON.parse(content)
      return {
        transformedTitle: parsed.transformedTitle || title,
        transformedSituation: parsed.transformedSituation || situation,
        prayerContext: parsed.prayerContext || ''
      }
    } catch (error) {
      console.error('Input transformation error:', error)
      // 실패 시 기본 변환 로직
      return {
        transformedTitle: title,
        transformedSituation: situation,
        prayerContext: `${title}에 대한 기도가 필요한 상황입니다.`
      }
    }
  }

  // 학습 데이터를 활용한 기도문 생성
  static async createEnhancedPrayerPrompt(request: PrayerGenerationRequest): Promise<string> {
    const { title, category, situation, tone = 'warm', length = 'short' } = request

    // 개선된 오프라인 분석 사용 (상황 그대로 사용하지 않음)
    const transformed = this.transformUserInputOffline(title, situation)
    
    // OpenAI 사용 가능한 경우에만 추가 변환 시도
    let apiTransformed = transformed
    try {
      const apiResult = await this.transformUserInput(title, situation)
      apiTransformed = {
        ...transformed,
        transformedTitle: apiResult.transformedTitle,
        transformedSituation: apiResult.transformedSituation,
        prayerContext: apiResult.prayerContext
      }
    } catch (error) {
      console.log('Using offline transformation due to API unavailability')
    }
    
    // 과거 피드백 데이터 가져오기
    const learningData = await this.getLearningData(category, tone)
    
    let prompt = `당신은 20년 경력의 기독교 목회자로서, 개인의 마음에 깊이 와닿는 기도문을 작성하는 전문가입니다.

기도문 작성 요청:
- 주제: ${apiTransformed.transformedTitle}
- 배경: ${apiTransformed.prayerContext}
${apiTransformed.transformedSituation ? `- 상황적 맥락: ${apiTransformed.transformedSituation}` : ''}
${category ? `- 카테고리: ${category}` : ''}
- 분석된 주제: ${transformed.analysis.mainTopic}
- 감정적 상태: ${transformed.analysis.emotionalContext}
- 세부 관심사: ${transformed.analysis.subTopics.join(', ')}

중요한 작성 원칙:
1. 사용자의 입력 내용을 그대로 반복하지 말고, 다른 표현과 문장으로 자연스럽게 풀어서 작성
2. 분석된 주제와 감정 상태에 맞는 구체적이고 적절한 기도 내용 작성
3. 실제 목회자가 성도와 함께 기도하는 듯한 자연스러운 흐름
4. 개인적이고 구체적인 언어 사용 (추상적이지 않게)
5. 감정적 공감과 영적 위로가 담긴 표현
6. 성경적 근거가 자연스럽게 녹아든 내용
7. 상황 설명을 그대로 인용하지 말고 기도문에 어울리는 표현으로 재해석`

    const lengthGuide = {
      short: '6-8문장의 간결하면서도 충분한',
      long: '15-20문장의 깊이 있고 상세한',
    }

    const toneGuide = {
      formal: '정중하고 경건한 어조로, 격식을 갖춘',
      casual: '친근하고 편안한 어조로, 일상적인 언어를 사용한',
      warm: '따뜻하고 위로가 되는 어조로, 부드럽고 포근한',
    }

    prompt += `
6. ${lengthGuide[length]} 기도문으로 작성
7. ${toneGuide[tone]} 표현 사용
8. "하나님 아버지" 또는 "사랑하는 주님"으로 자연스럽게 시작
9. "예수님의 이름으로 기도드립니다. 아멘"으로 마무리

기도문 구조 (기승전결):
- 기(起): 하나님께 나아가는 마음, 현재 상황 인정
- 승(承): 구체적인 고민이나 감정 표현, 하나님과의 관계 확인  
- 전(轉): 하나님의 은혜와 도움을 구하는 간구
- 결(結): 감사와 믿음의 고백, 결단`

    // 학습 데이터가 있으면 추가
    if (learningData.positivePatterns.length > 0) {
      prompt += `

과거 좋은 평가를 받은 패턴들:
${learningData.positivePatterns.slice(0, 3).map(pattern => `- ${pattern}`).join('\n')}`
    }

    if (learningData.avoidPatterns.length > 0) {
      prompt += `

피해야 할 패턴들:
${learningData.avoidPatterns.slice(0, 3).map(pattern => `- ${pattern}`).join('\n')}`
    }

    prompt += `

기도문만 작성하고 다른 설명은 포함하지 마세요.`

    return prompt
  }

  // 학습 데이터 조회
  static async getLearningData(category?: string, tone?: string): Promise<{
    positivePatterns: string[]
    avoidPatterns: string[]
  }> {
    try {
      const { data, error } = await supabaseServer
        .from(this.LEARNING_TABLE)
        .select('pattern_type, pattern_text, effectiveness_score')
        .gte('effectiveness_score', 0)
        .order('effectiveness_score', { ascending: false })
        .limit(20)

      if (error || !data) {
        return { positivePatterns: [], avoidPatterns: [] }
      }

      const positivePatterns = data
        .filter(item => item.effectiveness_score > 0.6)
        .map(item => item.pattern_text)

      const avoidPatterns = data
        .filter(item => item.effectiveness_score < 0.3)
        .map(item => item.pattern_text)

      return { positivePatterns, avoidPatterns }
    } catch (error) {
      console.error('Error fetching learning data:', error)
      return { positivePatterns: [], avoidPatterns: [] }
    }
  }

  // 개선된 기도문 생성
  static async generateEnhancedPrayer(request: PrayerGenerationRequest): Promise<{
    id: string
    content: string
    title: string
    category?: string
    generatedAt: string
    cached?: boolean
  }> {
    const cacheKey = this.generateCacheKey(request)
    
    // 캐시 확인
    const cached = await this.getCachedPrayer(cacheKey)
    if (cached) {
      return {
        id: cached.id,
        content: cached.content,
        title: cached.title,
        category: cached.category,
        generatedAt: cached.generatedAt,
        cached: true,
      }
    }

    try {
      console.log('Generating enhanced prayer with OpenAI...')
      
      const prompt = await this.createEnhancedPrayerPrompt(request)
      
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: '당신은 경험 많은 기독교 목회자입니다. 성도들의 마음에 깊이 와닿는 자연스럽고 따뜻한 기도문을 작성합니다.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8, // 창의성을 위해 약간 높게
        max_tokens: 800,
        presence_penalty: 0.1, // 반복 방지
        frequency_penalty: 0.1, // 다양한 표현 유도
      })

      const content = response.choices[0]?.message?.content?.trim()
      if (!content) {
        throw new Error('No content generated')
      }

      const prayer = {
        id: `prayer_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        content,
        title: request.title,
        category: request.category,
        generatedAt: new Date().toISOString(),
      }

      // 캐시에 저장
      await this.savePrayerToCache(cacheKey, prayer)
      
      // 사용 패턴 학습을 위한 데이터 저장
      await this.saveGenerationData(prayer, request)

      return prayer
    } catch (error) {
      console.error('Enhanced prayer generation error:', error)
      
      // 실패 시 기본 서비스로 폴백
      return this.generateFallbackPrayer(request)
    }
  }

  // 피드백 저장
  static async saveFeedback(feedback: PrayerFeedback): Promise<void> {
    try {
      await supabaseServer.from(this.FEEDBACK_TABLE).insert({
        prayer_id: feedback.prayerId,
        rating: feedback.rating,
        feedback_text: feedback.feedback,
        improvements: feedback.improvements,
        user_id: feedback.userId,
        created_at: new Date().toISOString(),
      })

      // 피드백을 바탕으로 학습 데이터 업데이트
      await this.updateLearningData(feedback)
    } catch (error) {
      console.error('Error saving feedback:', error)
    }
  }

  // 학습 데이터 업데이트
  static async updateLearningData(feedback: PrayerFeedback): Promise<void> {
    try {
      // 피드백 분석하여 패턴 추출
      const patterns = this.extractPatternsFromFeedback(feedback)
      
      for (const pattern of patterns) {
        await supabaseServer.from(this.LEARNING_TABLE).upsert({
          pattern_text: pattern.text,
          pattern_type: pattern.type,
          effectiveness_score: pattern.score,
          last_updated: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.error('Error updating learning data:', error)
    }
  }

  // 피드백에서 패턴 추출
  static extractPatternsFromFeedback(feedback: PrayerFeedback): Array<{
    text: string
    type: string
    score: number
  }> {
    const patterns: Array<{ text: string; type: string; score: number }> = []
    
    // 평점에 따른 효과성 점수
    const effectivenessScore = feedback.rating / 5.0
    
    // 개선 사항에서 부정적 패턴 추출
    feedback.improvements.forEach(improvement => {
      patterns.push({
        text: improvement,
        type: 'avoid_pattern',
        score: 1 - effectivenessScore, // 낮은 점수일수록 피해야 할 패턴
      })
    })

    // 긍정적 피드백에서 좋은 패턴 추출
    if (feedback.rating >= 4) {
      patterns.push({
        text: '자연스럽고 감동적인 표현 사용',
        type: 'positive_pattern',
        score: effectivenessScore,
      })
    }

    return patterns
  }

  // 생성 데이터 저장 (사용 패턴 분석용)
  static async saveGenerationData(
    prayer: { id: string; content: string; title: string; category?: string },
    request: PrayerGenerationRequest
  ): Promise<void> {
    try {
      await supabaseServer.from('prayer_generations').insert({
        prayer_id: prayer.id,
        title: request.title,
        category: request.category,
        situation: request.situation,
        tone: request.tone,
        length: request.length,
        content_length: prayer.content.length,
        generated_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error saving generation data:', error)
    }
  }

  // 기존 메서드들
  static async getCachedPrayer(cacheKey: string): Promise<CachedPrayer | null> {
    try {
      const { data, error } = await supabaseServer
        .from(this.CACHE_TABLE)
        .select('*')
        .eq('cache_key', cacheKey)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (error || !data) {
        return null
      }

      return {
        id: data.id,
        content: data.content,
        title: data.title,
        category: data.category,
        generatedAt: data.generated_at,
        cacheKey: data.cache_key,
        expiresAt: data.expires_at,
      }
    } catch (error) {
      console.error('Error fetching cached prayer:', error)
      return null
    }
  }

  static async savePrayerToCache(
    cacheKey: string,
    prayer: { id: string; content: string; title: string; category?: string }
  ): Promise<void> {
    try {
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + this.CACHE_TTL_HOURS)

      await supabaseServer.from(this.CACHE_TABLE).upsert({
        cache_key: cacheKey,
        id: prayer.id,
        content: prayer.content,
        title: prayer.title,
        category: prayer.category,
        generated_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      })
    } catch (error) {
      console.error('Error saving prayer to cache:', error)
    }
  }

  // 주제별 기도 템플릿 정의 (개선된 분석 기반)
  static getPrayerTemplate(title: string, situation?: string): {
    category: string
    specificPrayers: string[]
    blessings: string[]
    concerns: string[]
  } {
    // 종합 분석을 통한 주제 결정
    const analysis = this.analyzeTopicFromTitleAndSituation(title, situation)
    const mainTopic = analysis.mainTopic
    
    // 분석된 주제에 따른 템플릿 반환
    if (mainTopic === '건강') {
      return {
        category: '건강',
        specificPrayers: [
          '몸과 마음이 온전히 치유되게 하시옵소서',
          '질병을 물리치시고 강건함을 회복시켜 주시옵소서',
          '의료진들에게 지혜를 주시고 올바른 치료가 이루어지게 하시옵소서',
          '고통 가운데서도 주님의 사랑을 느낄 수 있게 하시옵소서'
        ],
        blessings: [
          '건강한 몸으로 주님을 섬길 수 있는 은혜',
          '가족들과 함께 기쁨을 나눌 수 있는 시간',
          '회복의 과정을 통해 더욱 성숙해지는 믿음'
        ],
        concerns: [
          '치료 과정에서의 어려움과 고통',
          '경제적 부담과 가족들의 걱정',
          '회복에 대한 불안과 두려움'
        ]
      }
    }
    
    // 취업/직장 관련
    if (mainTopic === '취업') {
      return {
        category: '취업',
        specificPrayers: [
          '하나님께서 예비하신 일터로 인도해 주시옵소서',
          '면접과 준비 과정에서 지혜와 능력을 주시옵소서',
          '재능과 은사를 발휘할 수 있는 적합한 직장을 허락하시옵소서',
          '동료들과 상사와의 좋은 관계를 맺을 수 있게 하시옵소서'
        ],
        blessings: [
          '안정된 직장에서 성실히 일할 수 있는 기회',
          '경제적 안정과 가족을 돌볼 수 있는 능력',
          '일터에서 하나님의 사랑을 전할 수 있는 기회'
        ],
        concerns: [
          '취업 준비 과정의 스트레스와 불안',
          '경쟁과 거절에 대한 두려움',
          '가족의 기대와 경제적 압박'
        ]
      }
    }
    
    // 가족 관련
    if (mainTopic === '가족') {
      return {
        category: '가족',
        specificPrayers: [
          '가족 모두가 건강하고 평안하게 하시옵소서',
          '서로 사랑하고 이해하며 화목한 가정이 되게 하시옵소서',
          '각자의 자리에서 하나님의 뜻대로 살아가게 하시옵소서',
          '가족 간의 갈등이 있다면 용서와 화해의 은혜를 주시옵소서'
        ],
        blessings: [
          '함께 모여 기쁨을 나누는 소중한 시간',
          '서로를 위해 기도하고 격려하는 관계',
          '하나님 중심의 신앙 가정으로 성장하는 은혜'
        ],
        concerns: [
          '가족 구성원들의 건강과 안전',
          '경제적 어려움과 생활의 염려',
          '세대 간의 차이와 소통의 어려움'
        ]
      }
    }
    
    // 시험/학업 관련
    if (mainTopic === '학업') {
      return {
        category: '학업',
        specificPrayers: [
          '집중력과 기억력을 주시고 최선을 다할 수 있게 하시옵소서',
          '시험에서 그동안 준비한 것들을 잘 발휘할 수 있게 하시옵소서',
          '결과에 대한 염려보다 과정에서 최선을 다하는 마음을 주시옵소서',
          '좋은 결과든 아쉬운 결과든 하나님의 뜻으로 받아들일 수 있게 하시옵소서'
        ],
        blessings: [
          '성실히 공부할 수 있는 건강과 환경',
          '배움을 통해 성장하고 발전하는 기쁨',
          '좋은 결과로 가족들을 기쁘게 할 수 있는 기회'
        ],
        concerns: [
          '시험에 대한 부담과 스트레스',
          '경쟁에서 뒤처질 것에 대한 두려움',
          '기대에 부응하지 못할까 하는 걱정'
        ]
      }
    }
    
    // 결혼 관련
    if (mainTopic === '결혼') {
      return {
        category: '결혼',
        specificPrayers: [
          '하나님께서 예비하신 평생의 동반자를 만나게 하시옵소서',
          '서로를 진실로 사랑하고 존중하는 관계가 되게 하시옵소서',
          '하나님 중심의 신앙 가정을 이루어가게 하시옵소서',
          '결혼 준비 과정에서 지혜롭게 준비할 수 있게 하시옵소서'
        ],
        blessings: [
          '서로를 아끼고 사랑하는 소중한 만남',
          '함께 꿈을 이루어가는 아름다운 동행',
          '하나님의 사랑을 나누는 축복된 가정'
        ],
        concerns: [
          '올바른 사람을 만날 수 있을지에 대한 불안',
          '관계에서의 갈등과 어려움',
          '결혼에 대한 준비와 책임에 대한 부담'
        ]
      }
    }
    
    // 감사 관련
    if (mainTopic === '감사') {
      return {
        category: '감사',
        specificPrayers: [
          '주신 모든 은혜에 진심으로 감사드립니다',
          '때로는 당연하게 여겼던 일상의 축복들을 깨닫게 하시옵소서',
          '감사하는 마음으로 더욱 겸손하게 살아가게 하시옵소서',
          '받은 은혜를 다른 이들과 나눌 수 있는 기회를 주시옵소서'
        ],
        blessings: [
          '생명과 건강, 그리고 하루하루의 은혜',
          '사랑하는 사람들과 함께하는 소중한 시간',
          '어려움 속에서도 함께하시는 주님의 동행'
        ],
        concerns: [
          '감사를 잊고 불평하는 마음',
          '현재의 축복을 당연하게 여기는 태도',
          '어려운 상황에서도 감사할 수 있는 믿음'
        ]
      }
    }
    
    // 일반적인 경우
    return {
      category: '일반',
      specificPrayers: [
        '이 마음의 소원을 주님께서 들어주시기를 간구합니다',
        '주님의 뜻이 이루어지는 것이 가장 좋은 길임을 믿습니다',
        '이 과정을 통해 더욱 성숙한 믿음으로 자라가게 하시옵소서',
        '어떤 결과든 감사하는 마음으로 받아들일 수 있게 하시옵소서'
      ],
      blessings: [
        '하나님의 사랑 안에서 누리는 평안',
        '어려움 속에서도 변치 않는 하나님의 신실하심',
        '기도할 수 있는 특권과 응답하시는 은혜'
      ],
      concerns: [
        '우리의 한계와 부족함',
        '앞으로의 길에 대한 불확실함',
        '하나님의 뜻을 분별하는 것의 어려움'
      ]
    }
  }

  // 개선된 상황 분석 및 주제 도출
  static analyzeTopicFromTitleAndSituation(title: string, situation?: string): {
    mainTopic: string
    subTopics: string[]
    emotionalContext: string
    urgencyLevel: string
    specificConcerns: string[]
  } {
    const titleLower = title.toLowerCase()
    const situationLower = situation?.toLowerCase() || ''
    const combinedText = `${titleLower} ${situationLower}`

    // 주요 키워드 분석
    const healthKeywords = ['건강', '병', '치료', '회복', '아픈', '몸', '마음', '정신', '우울', '스트레스']
    const jobKeywords = ['취업', '직장', '일자리', '면접', '회사', '사업', '승진', '이직']
    const familyKeywords = ['가족', '부모', '자녀', '아이', '형제', '자매', '남편', '아내', '시부모', '처가']
    const studyKeywords = ['시험', '공부', '학업', '입시', '대학', '학교', '성적', '졸업', '진학']
    const marriageKeywords = ['결혼', '연애', '배우자', '만남', '데이트', '약혼', '신혼']
    const gratitudeKeywords = ['감사', '고마', '축복', '은혜', '기쁨', '행복']
    
    // 감정 키워드 분석
    const anxietyKeywords = ['불안', '걱정', '두려', '무서', '염려', '근심']
    const urgentKeywords = ['급히', '빨리', '시급', '긴급', '당장', '즉시']
    const sadnessKeywords = ['슬픈', '힘든', '어려운', '괴로운', '고통', '아픈']
    
    let mainTopic = '일반'
    let subTopics: string[] = []
    let emotionalContext = '평온'
    let urgencyLevel = '보통'
    let specificConcerns: string[] = []

    // 주제 결정
    if (healthKeywords.some(keyword => combinedText.includes(keyword))) {
      mainTopic = '건강'
      if (combinedText.includes('정신') || combinedText.includes('우울') || combinedText.includes('스트레스')) subTopics.push('정신건강')
      if (combinedText.includes('치료') || combinedText.includes('병원')) subTopics.push('치료과정')
      if (combinedText.includes('회복')) subTopics.push('회복기원')
    } else if (jobKeywords.some(keyword => combinedText.includes(keyword))) {
      mainTopic = '취업'
      if (combinedText.includes('면접')) subTopics.push('면접')
      if (combinedText.includes('사업')) subTopics.push('사업')
      if (combinedText.includes('승진') || combinedText.includes('이직')) subTopics.push('경력발전')
    } else if (familyKeywords.some(keyword => combinedText.includes(keyword))) {
      mainTopic = '가족'
      if (combinedText.includes('자녀') || combinedText.includes('아이')) subTopics.push('자녀문제')
      if (combinedText.includes('부모')) subTopics.push('부모님')
      if (combinedText.includes('갈등') || combinedText.includes('싸움')) subTopics.push('가족갈등')
    } else if (studyKeywords.some(keyword => combinedText.includes(keyword))) {
      mainTopic = '학업'
      if (combinedText.includes('입시') || combinedText.includes('대학')) subTopics.push('진학')
      if (combinedText.includes('시험')) subTopics.push('시험')
    } else if (marriageKeywords.some(keyword => combinedText.includes(keyword))) {
      mainTopic = '결혼'
      if (combinedText.includes('만남')) subTopics.push('만남')
      if (combinedText.includes('준비')) subTopics.push('결혼준비')
    } else if (gratitudeKeywords.some(keyword => combinedText.includes(keyword))) {
      mainTopic = '감사'
    }

    // 감정적 맥락 분석
    if (anxietyKeywords.some(keyword => combinedText.includes(keyword))) {
      emotionalContext = '불안'
    } else if (sadnessKeywords.some(keyword => combinedText.includes(keyword))) {
      emotionalContext = '슬픔'
    } else if (gratitudeKeywords.some(keyword => combinedText.includes(keyword))) {
      emotionalContext = '감사'
    }

    // 긴급도 분석
    if (urgentKeywords.some(keyword => combinedText.includes(keyword))) {
      urgencyLevel = '높음'
    }

    // 구체적 걱정사항 추출
    if (combinedText.includes('돈') || combinedText.includes('경제') || combinedText.includes('재정')) {
      specificConcerns.push('경제적 어려움')
    }
    if (combinedText.includes('관계') || combinedText.includes('소통')) {
      specificConcerns.push('인간관계')
    }
    if (combinedText.includes('미래') || combinedText.includes('앞으로')) {
      specificConcerns.push('미래에 대한 불안')
    }

    return {
      mainTopic,
      subTopics,
      emotionalContext,
      urgencyLevel,
      specificConcerns
    }
  }

  // 상황을 자연스러운 기도 맥락으로 변환 (그대로 사용하지 않음)
  static transformSituationToContext(situation: string, analysis: {
    mainTopic: string
    subTopics: string[]
    emotionalContext: string
    urgencyLevel: string
    specificConcerns: string[]
  }): string {
    const { mainTopic, emotionalContext, urgencyLevel, specificConcerns } = analysis
    
    // 상황을 추상화하여 기도 맥락으로 변환
    let context = ''
    
    switch (mainTopic) {
      case '건강':
        if (emotionalContext === '불안') {
          context = '몸과 마음의 건강에 대한 염려가 있는 상황에서'
        } else {
          context = '건강에 관한 절실한 마음을 갖고'
        }
        break
      case '취업':
        if (urgencyLevel === '높음') {
          context = '진로에 대한 간절한 소망과 함께'
        } else {
          context = '앞으로의 일터와 삶의 방향에 대해'
        }
        break
      case '가족':
        if (specificConcerns.includes('인간관계')) {
          context = '가족과의 관계에서 지혜가 필요한 때에'
        } else {
          context = '사랑하는 가족들을 위한 마음으로'
        }
        break
      case '학업':
        if (emotionalContext === '불안') {
          context = '학업에 대한 부담과 걱정을 안고'
        } else {
          context = '배움의 길에서 최선을 다하고자 하는 마음으로'
        }
        break
      case '결혼':
        context = '인생의 동반자에 대한 소망을 품고'
        break
      case '감사':
        context = '받은 은혜와 축복에 대한 감사한 마음으로'
        break
      default:
        context = '이 마음의 소원을 품고'
    }
    
    return `${context} 주님 앞에 나아옵니다`
  }

  // 개선된 오프라인 입력 변환
  static transformUserInputOffline(title: string, situation?: string): {
    transformedTitle: string
    transformedSituation?: string
    prayerContext: string
    template: any
    analysis: any
  } {
    // 제목과 상황을 종합 분석
    const analysis = this.analyzeTopicFromTitleAndSituation(title, situation)
    
    // 분석 결과를 바탕으로 템플릿 가져오기
    const template = this.getPrayerTemplate(title, situation)
    
    // 상황을 자연스러운 기도 맥락으로 변환 (원문 그대로 사용하지 않음)
    let prayerContext = ''
    if (situation) {
      prayerContext = this.transformSituationToContext(situation, analysis)
    } else {
      prayerContext = `${analysis.mainTopic}에 관한 마음을 품고 주님께 간절히 기도드립니다`
    }

    return {
      transformedTitle: title,
      transformedSituation: situation,
      prayerContext,
      template,
      analysis
    }
  }

  static async generateFallbackPrayer(request: PrayerGenerationRequest): Promise<{
    id: string
    content: string
    title: string
    category?: string
    generatedAt: string
  }> {
    const { title, situation, tone = 'warm', length = 'short' } = request
    
    // 개선된 오프라인 변환 사용 (상황 그대로 사용하지 않음)
    const transformed = this.transformUserInputOffline(title, situation)
    
    // 어조별 시작 문구
    const openings = {
      formal: '전능하신 하나님 아버지, 주님의 보좌 앞에 경건하게 나아와',
      casual: '사랑하는 하나님, 편안한 마음으로 주님께 이야기하듯',
      warm: '사랑하는 하나님 아버지, 따뜻한 사랑 안에서'
    }

    // 어조별 마무리 문구
    const closings = {
      formal: '이 모든 기도를 우리 주 예수 그리스도의 거룩하신 이름으로 올려드립니다. 아멘.',
      casual: '예수님의 이름으로 기도해요. 아멘.',
      warm: '예수님의 사랑 안에서 기도드립니다. 아멘.'
    }

    // 길이별 기도문 구성
    let prayerContent = ''
    
    // 주제별 구체적인 기도 내용 생성 (분석 결과 활용)
    const { template, analysis } = transformed
    const specificPrayer = template.specificPrayers[Math.floor(Math.random() * template.specificPrayers.length)]
    const blessing = template.blessings[Math.floor(Math.random() * template.blessings.length)]
    const concern = template.concerns[Math.floor(Math.random() * template.concerns.length)]
    
    // 분석된 감정 상태에 따른 추가 표현
    let emotionalExpression = ''
    if (analysis.emotionalContext === '불안') {
      emotionalExpression = '마음의 염려와 불안을 잠재우시고'
    } else if (analysis.emotionalContext === '슬픔') {
      emotionalExpression = '이 어려운 시간을 견딜 수 있는 힘을 주시고'
    } else if (analysis.emotionalContext === '감사') {
      emotionalExpression = '더욱 감사하는 마음으로 살아갈 수 있게 하시고'
    } else {
      emotionalExpression = '평안한 마음으로 주님을 신뢰할 수 있게 하시고'
    }

    if (length === 'short') {
      // 짧은 기도문 (6-8문장) - 분석된 맥락에 맞는 자연스러운 내용
      prayerContent = `${openings[tone]} ${transformed.prayerContext}

주님께서 이 마음을 깊이 아시고 계심을 믿습니다. ${specificPrayer}

${concern}이 있지만, ${emotionalExpression} 주님께서 모든 것을 아시고 가장 좋은 길로 인도해 주실 것을 믿습니다.

${blessing}을 허락하시고, 이 모든 과정을 통해 주님을 더욱 신뢰하게 하시옵소서. ${closings[tone]}`
    } else {
      // 긴 기도문 (15-20문장) - 주제에 맞는 풍성한 내용
      const additionalPrayer = template.specificPrayers.filter(p => p !== specificPrayer)[Math.floor(Math.random() * (template.specificPrayers.length - 1))]
      const additionalBlessing = template.blessings.filter(b => b !== blessing)[Math.floor(Math.random() * (template.blessings.length - 1))]
      
      prayerContent = `${openings[tone]} ${transformed.prayerContext}

주님께서는 우리의 모든 필요를 아시고, 때를 따라 돕는 은혜를 주시는 분이심을 고백합니다. 이 간절한 마음을 주님께서 받아주시기를 원합니다.

${specificPrayer} 또한 ${additionalPrayer}

때로는 ${concern}이 있어서 마음이 무거울 때가 있습니다. ${emotionalExpression} 주님께서는 우리의 길을 인도하시고 올바른 방향으로 이끄시는 분이심을 믿습니다.

주님의 지혜와 명철이 필요한 이 시간입니다. 우리의 생각과 계획이 주님의 뜻과 다를 수 있음을 인정하며, 주님의 완전하신 계획에 순복하는 마음을 주시옵소서.

${blessing}을 허락하시고, ${additionalBlessing}도 함께 누릴 수 있게 하여 주시옵소서.

어떤 결과가 주어지든지 그 모든 것이 합력하여 선을 이루시는 주님의 손길임을 믿습니다. 감사하는 마음과 찬양하는 영으로 이 시간들을 보낼 수 있게 하여 주시옵소서.

주변의 사랑하는 사람들과도 이 은혜를 함께 나누며, 서로 격려하고 기도할 수 있는 복된 공동체가 되게 하여 주시옵소서.

무엇보다 이 모든 과정을 통해 주님을 더욱 깊이 알아가고, 주님과의 관계가 더욱 친밀해지는 귀한 시간이 되기를 소망합니다. ${closings[tone]}`
    }

    const prayer = {
      id: `fallback_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      content: prayerContent,
      title: request.title,
      category: request.category,
      generatedAt: new Date().toISOString(),
    }

    return prayer
  }
}