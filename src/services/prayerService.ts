import OpenAI from 'openai'
import { createHash } from 'crypto'
import { supabaseServer } from '@/lib/supabase-server'
import type { PrayerGenerationRequest, CachedPrayer } from '@/types/prayer'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'placeholder-key',
})

export class PrayerService {
  private static readonly CACHE_TABLE = 'prayer_cache'
  private static readonly CACHE_TTL_HOURS = 24

  static generateCacheKey(request: PrayerGenerationRequest): string {
    const normalizedRequest = {
      title: request.title.toLowerCase().trim(),
      category: request.category?.toLowerCase().trim() || '',
      situation: request.situation?.toLowerCase().trim() || '',
      tone: request.tone || 'warm',
      length: request.length || 'medium',
    }
    
    const dataString = JSON.stringify(normalizedRequest)
    return createHash('sha256').update(dataString).digest('hex')
  }

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

  static createPrayerPrompt(request: PrayerGenerationRequest): string {
    const { title, category, situation, tone = 'warm', length = 'short' } = request

    let prompt = `당신은 기독교 목회자로서 신앙인을 위한 따뜻하고 성경적인 기도문을 작성합니다.

다음 조건에 맞는 기도문을 작성해주세요:

제목: ${title}
`

    if (category) {
      prompt += `카테고리: ${category}\n`
    }

    if (situation) {
      prompt += `상황: ${situation}\n`
    }

    const lengthGuide = {
      short: '6-7문장의 간결한',
      long: '15-20문장의 상세한',
    }

    const toneGuide = {
      formal: '격식있고 경건한 어조',
      casual: '친근하고 편안한 어조',
      warm: '따뜻하고 위로가 되는 어조',
    }

    prompt += `
요구사항:
- ${lengthGuide[length]}로 작성
- ${toneGuide[tone]}로 작성
- 성경적 근거가 있는 내용
- 한국의 개신교 전통에 맞는 표현
- "하나님 아버지" 또는 "사랑하는 주님"으로 시작
- "예수님의 이름으로 기도합니다. 아멘"으로 마무리

기도문만 작성하고 다른 설명은 불필요합니다.`

    return prompt
  }

  static async generateFallbackPrayer(request: PrayerGenerationRequest): Promise<{
    id: string
    content: string
    title: string
    category?: string
    generatedAt: string
  }> {
    const length = request.length || 'short'
    const category = request.category || '간구'
    
    // Short prayer templates (6-7 sentences) with natural flow
    const shortTemplates = {
      감사: `사랑하는 하나님 아버지, ${request.title}로 인해 감사의 마음을 담아 주님께 나아옵니다.
${request.situation ? `${request.situation} 가운데서도 주님의 선하심을 경험하게 하셨습니다.` : '매일 주님께서 베풀어주시는 크고 작은 은혜들을 되돌아봅니다.'}
때로는 당연하게 여겼던 일상의 축복들이 모두 주님의 사랑에서 비롯된 것임을 깨닫습니다.
주님의 신실하심과 변함없는 돌보심에 마음 깊이 감사드립니다.
감사하는 마음으로 오늘도 주님을 섬기며 살아가기를 원합니다.
모든 좋은 것의 근원이 되시는 주님의 이름을 찬양하며, 예수님의 이름으로 기도합니다.
아멘.`,

      회개: `거룩하신 하나님 아버지, ${request.title}에 대해 통회하는 마음으로 주님께 나아옵니다.
${request.situation ? `${request.situation} 가운데 저의 부족함과 죄성이 드러나는 것을 보았습니다.` : '주님 앞에 서면 저의 연약함과 부족함이 여실히 드러납니다.'}
주님의 거룩하심 앞에서 저의 교만하고 이기적이었던 마음을 고백합니다.
주님의 뜻보다 제 생각을 앞세웠던 어리석음을 용서해 주시옵소서.
주님의 보배로운 피로 저를 깨끗케 하시고 새로운 마음을 허락해 주시옵소서.
앞으로는 주님의 뜻에 순종하며 거룩한 삶을 살기를 소망합니다.
예수님의 이름으로 기도드립니다. 아멘.`,

      간구: `전능하신 하나님 아버지, ${request.title}에 대해 간절한 마음으로 주님께 간구합니다.
${request.situation ? `${request.situation} 이 어려운 상황 앞에서 인간적인 지혜로는 한계를 느낍니다.` : '제 힘과 능력으로는 해결할 수 없는 문제 앞에 서 있습니다.'}
그러나 주님께서는 불가능이 없으시고 모든 것을 가능케 하시는 분이심을 믿습니다.
주님의 지혜로 이 상황을 헤쳐 나갈 수 있는 길을 열어 주시옵소서.
두려움과 염려를 내려놓고 주님께만 소망을 두기를 원합니다.
주님의 뜻이 이루어지고 영광받으시는 결과가 되기를 간구하며, 예수님의 이름으로 기도합니다.
아멘.`,

      중보: `자비로우신 하나님 아버지, ${request.title}을 위해 중보의 마음으로 기도드립니다.
${request.situation ? `${request.situation} 가운데 있는 소중한 사람들을 주님께 맡겨드립니다.` : '주님께서 사랑하시는 소중한 생명들을 위해 기도합니다.'}
그들이 겪고 있는 어려움과 아픔을 주님께서 아시고 위로해 주시옵소서.
주님의 평안과 소망이 그들의 마음에 임하여 새로운 힘을 얻게 하여 주시옵소서.
주님의 선하신 뜻 가운데 그들의 삶이 인도되기를 간구합니다.
그들을 통해 주님의 사랑과 은혜가 더욱 넓게 전해지기를 소망하며, 예수님의 이름으로 기도합니다.
아멘.`,

      찬양: `영광의 왕이신 하나님 아버지, ${request.title}로 주님을 높이며 찬양드립니다.
${request.situation ? `${request.situation} 가운데서도 주님의 신실하심을 경험하며 감격합니다.` : '주님의 크시고 놀라우신 사랑에 마음이 벅차오릅니다.'}
천지만물을 창조하시고 섭리로 다스리시는 주님의 능력을 찬양합니다.
죄와 사망에서 구원하시고 영생의 소망을 주신 은혜에 감사드립니다.
주님의 이름이 온 땅에서 높임 받으시고 영광을 받으시기를 원합니다.
제 삶을 통해 주님께 영광과 찬송을 올려드리며, 예수님의 이름으로 기도합니다.
아멘.`,

      묵상: `지혜의 근원이신 하나님 아버지, ${request.title}에 대해 깊이 묵상하고자 주님께 나아옵니다.
${request.situation ? `${request.situation} 를 통해 주님께서 주시는 교훈을 깨닫기를 원합니다.` : '일상 속에서 주님의 음성을 듣고 뜻을 헤아리기를 소망합니다.'}
성령님께서 저의 마음을 밝혀 주셔서 주님의 말씀을 올바르게 이해하게 하여 주시옵소서.
말씀이 제 마음에 깊이 새겨져 삶의 빛과 방향이 되게 하여 주시옵소서.
묵상을 통해 주님과 더욱 깊은 교제를 나누며 영적으로 성장하기를 원합니다.
말씀에 순종하는 삶을 살며 주님을 기쁘시게 해드리길 소망하며, 예수님의 이름으로 기도합니다.
아멘.`
    }

    // Long prayer templates (15-20 sentences)
    const longTemplates = {
      감사: `사랑이 많으신 하나님 아버지, 감사의 마음이 넘쳐 ${request.title}로 인해 주님께 나아옵니다.
${request.situation ? `${request.situation} 가운데 주님의 은혜를 깨달으며, 제 마음에 감사가 넘쳐흐릅니다.` : '하루하루 제게 베풀어주시는 주님의 선하심을 생각하며, 감격으로 가슴이 벅차오릅니다.'}
돌이켜보니 지금까지 제가 걸어온 모든 길에 주님의 손길이 함께 하셨음을 깨닫습니다.
어려운 순간에도 저를 포기하지 않으시고 끝까지 사랑해 주신 주님의 신실하심에 고개가 숙여집니다.
때로는 제가 깨닫지 못하는 사이에도 주님께서는 저를 위해 길을 예비하고 계셨습니다.
작은 것 하나까지도 헤아리시며 돌보아 주시는 주님의 세밀한 사랑에 마음이 뭉클해집니다.

건강한 몸과 맑은 정신을 허락하여 주심으로 오늘도 주님을 섬길 수 있게 하심을 감사드립니다.
소중한 가족들과 친구들, 동역자들을 통해 주님의 사랑을 체험하게 하심을 감사드립니다.
일용할 양식과 편안한 거처를 주심으로 염려 없이 살아갈 수 있음을 감사드립니다.
주님의 말씀을 통해 참된 지혜와 위로를 얻게 하심을 감사드립니다.
기도의 특권을 허락하시고 언제든지 주님께 나아갈 수 있게 하심을 감사드립니다.

무엇보다도 죄와 사망의 권세에서 구원하시고 하나님의 자녀 삼아 주신 은혜에 감격합니다.
예수 그리스도의 십자가 사랑을 통해 영원한 생명의 소망을 주심을 감사드립니다.
성령님께서 제 안에 거하시며 날마다 새롭게 하여 주심을 감사드립니다.
천국의 소망과 영원한 기업을 기업으로 주심을 감사드립니다.

주님, 이 모든 은혜에 합당한 감사의 삶으로 응답하기를 원합니다.
제 입술로는 찬양을, 제 삶으로는 순종을 올려드리며 주님께 영광 돌리겠습니다.
감사하는 마음을 잃지 않고 언제나 기뻐하며 주님과 동행하는 삶이 되게 하여 주시옵소서.
모든 좋은 것의 근원이 되시는 주님의 이름을 찬양하며, 예수님의 이름으로 기도합니다.
아멘.`,

      회개: `거룩하신 하나님 아버지, ${request.title}에 대해 겸손한 마음으로 회개하며 주님께 나아옵니다.
${request.situation ? `${request.situation} 가운데 제 자신의 모습을 돌아보며, 주님 앞에서 부끄러운 마음을 금할 수 없습니다.` : '주님의 거룩하심 앞에 설 때마다 저의 연약함과 죄성이 적나라하게 드러납니다.'}
제가 얼마나 교만하고 이기적이었는지, 주님의 뜻보다 제 생각과 욕심을 앞세웠는지 깨닫게 됩니다.
사랑해야 할 이웃을 판단하고 비판했으며, 때로는 미움의 마음까지 품었던 것을 고백합니다.

주님께서 주신 은혜와 축복들을 당연하게 여기며 감사할 줄 모르는 무감각한 마음이었습니다.
어려움이 닥치면 원망하고 불평했으며, 주님을 의심하기까지 했던 부족함을 회개합니다.
세상의 유혹 앞에 쉽게 넘어지고, 주님의 말씀보다 세상의 가치관을 따랐던 어리석음을 고백합니다.
기도와 말씀 묵상을 소홀히 하며 주님과의 교제를 등한시했던 영적 게으름을 용서해 주시옵소서.

주님의 사랑하는 자녀로서 마땅히 해야 할 전도와 선행에 무관심했던 죄를 고백합니다.
제게 맡겨주신 사명과 달란트를 제대로 사용하지 못했던 불충함을 회개합니다.
형제자매들과 화목하지 못하고 용서하지 못했던 마음의 완악함을 고백합니다.

그러나 주님, 십자가에서 흘리신 예수님의 보배로운 피가 이 모든 죄를 씻어주심을 믿습니다.
주님의 용서하심이 제 죄보다 크시며, 주님의 사랑이 제 부족함보다 깊으심을 고백합니다.
이제 새로운 마음과 새로운 영을 창조하여 주시옵소서.
성령님께서 저를 진리 가운데로 인도하시고, 날마다 주님의 형상을 닮아가게 하여 주시옵소서.
다시는 주님을 근심시켜드리지 않고 기쁘시게 하는 삶을 살기를 소망하며, 예수님의 이름으로 기도드립니다.
아멘.`,

      간구: `전능하신 하나님 아버지, ${request.title}에 대해 간절한 마음을 담아 주님께 간구드립니다.
${request.situation ? `${request.situation} 이 상황 앞에서 제 능력의 한계를 절감하며, 오직 주님만을 바라봅니다.` : '저의 지혜와 힘으로는 도저히 감당할 수 없는 문제 앞에서 주님께 매달립니다.'}
인간적인 방법과 노력으로는 해결할 수 없는 일임을 깨달으며, 주님의 능력을 의지합니다.
이 어려운 상황이 제게 닥친 이유와 목적을 주님만이 아시며, 주님의 뜻이 있으심을 믿습니다.

주님, 제가 가야 할 길을 분별할 수 있는 지혜를 허락해 주시옵소서.
혼란스러운 마음을 정리하고 올바른 판단을 내릴 수 있도록 도와주시옵소서.
두려움과 염려의 마음을 물리치시고, 주님께서 주시는 평안으로 마음을 채워 주시옵소서.
절망과 좌절 가운데서도 주님을 신뢰하고 소망을 잃지 않게 하여 주시옵소서.

이 시련을 통해 더욱 성숙한 신앙으로 자라게 하시고, 주님의 성품을 닮아가게 하여 주시옵소서.
어려움 가운데서도 감사할 수 있는 은혜를 주시고, 주님의 선하심을 경험하게 하여 주시옵소서.
필요한 도움과 지혜를 주변 사람들을 통해 보내 주시옵소서.
건강한 몸과 마음을 지켜 주셔서 이 시간을 잘 견딜 수 있게 하여 주시옵소서.
사랑하는 가족들과 함께 이 어려움을 극복하고 더욱 끈끈한 사랑으로 하나 되게 하여 주시옵소서.

주님, 제 뜻이 아닌 주님의 뜻이 이루어지기를 원합니다.
이 모든 과정을 통해 주님의 영광이 드러나고 많은 사람들이 주님을 알게 되기를 간구합니다.
주님께서 예비하신 최선의 길로 인도해 주시고, 주님의 때에 가장 좋은 방법으로 응답해 주시옵소서.
끝까지 주님만 바라보며 인내하고 기다리는 믿음을 주시옵소서.
주님의 신실하심과 사랑하심을 의지하며, 예수님의 이름으로 간구드립니다.
아멘.`,

      중보: `자비로우신 하나님 아버지, ${request.title}을 위해 중보의 마음으로 주님께 나아옵니다.
${request.situation ? `${request.situation} 가운데 있는 소중한 생명들을 주님께 맡겨드리며, 그들을 위해 간절히 기도합니다.` : '주님께서 사랑하시는 귀한 생명들을 생각하며, 그들의 필요와 아픔을 주님께 아뢰옵니다.'}
제가 직접 도울 수 없는 한계 앞에서 오직 주님만이 그들을 진정으로 위로하고 도우실 수 있음을 믿습니다.
그들이 겪고 있는 고통과 어려움을 주님께서 친히 아시고 계시며, 그들의 눈물 하나하나까지 기억하고 계심을 믿습니다.
주님의 크신 사랑이 그들의 마음을 감싸시고, 절망 가운데서도 소망을 발견하게 하여 주시옵소서.

육체의 질병으로 고통받는 분들에게는 주님의 치유의 손길이 임하기를 간구합니다.
마음의 상처와 아픔으로 힘들어하는 분들에게는 주님의 위로와 평안이 충만하기를 원합니다.
경제적 어려움과 생활의 걱정으로 무거워하는 분들에게는 주님의 공급하심과 도우심이 있기를 간구합니다.
가정의 불화와 관계의 어려움으로 상심하는 분들에게는 화해와 용서의 은혜가 임하기를 원합니다.
진로와 미래에 대한 불안함으로 방황하는 분들에게는 주님의 인도하심과 분명한 비전을 주시옵소서.

특별히 신앙의 연약함으로 고민하는 분들에게는 새로운 영적 활력과 성장의 기회를 허락하여 주시옵소서.
주님의 나라 확장을 위해 헌신하는 사역자들과 선교사님들에게는 건강과 지혜, 그리고 열매 맺는 사역을 허락하여 주시옵소서.
다음 세대인 어린이들과 청소년들이 주님을 알고 믿음 안에서 건강하게 자라갈 수 있게 하여 주시옵소서.
연로하신 어르신들께는 평안한 노년과 건강, 그리고 영원한 소망 가운데 거하는 복을 허락하여 주시옵소서.

주님, 이 모든 중보 기도를 통해 주님의 사랑이 더욱 넓게 전해지기를 원합니다.
그들 각자의 삶 가운데 주님의 선하신 뜻이 이루어지고, 주님께 영광 돌리는 삶을 살게 하여 주시옵소서.
제가 기도하는 모든 분들이 주님의 사랑 안에서 참된 평안과 기쁨을 누리며 살아가기를 간구합니다.
그들을 통해 더 많은 사람들이 주님의 은혜를 경험하고 구원에 이르는 역사가 일어나기를 소망하며, 예수님의 이름으로 중보 기도드립니다.
아멘.`,

      찬양: `영광의 왕이신 하나님 아버지, ${request.title}로 인해 마음 가득한 찬양을 올려드립니다.
${request.situation ? `${request.situation} 가운데 주님의 위대하심을 더욱 깊이 깨닫게 되었습니다.` : '오늘 이 순간 주님의 선하심과 은혜로움이 제 마음을 사로잡습니다.'} 
주님께서는 천지만물을 말씀으로 창조하시고 지금도 섭리로 다스리고 계십니다.
무에서 유를 창조하신 그 놀라운 능력 앞에 경외감으로 가득합니다.
인간을 하나님의 형상으로 지으시고 에덴동산의 복락을 허락하신 그 사랑을 찬양합니다.
죄로 인해 타락한 인류를 포기하지 아니하시고 구원의 계획을 세우신 그 긍휼을 찬양합니다.

독생자 예수 그리스도를 이 땅에 보내주신 하나님의 크신 사랑에 감격합니다.
십자가에서 피 흘려 죽으심으로 우리 죄의 값을 치러주신 그 은혜를 찬양합니다.
사망을 이기시고 부활하심으로 우리에게 영생의 소망을 주신 그 승리를 찬양합니다.
성령님을 보내주셔서 우리와 영원히 함께 하시겠다고 약속하신 그 신실함을 찬양합니다.
날마다 새로운 은혜로 우리를 인도하시고 필요한 모든 것을 공급하시는 그 돌보심을 찬양합니다.

시험과 환난 중에도 우리를 버리지 않으시고 끝까지 동행하시는 그 변함없음을 찬양합니다.
우리의 연약함을 아시고 우리의 눈물을 기억하시는 그 세심함을 찬양합니다.
기도할 때마다 우리의 간구를 들으시고 가장 좋은 것으로 응답하시는 그 사랑을 찬양합니다.
장차 우리를 하늘 본향으로 인도하시고 영원한 안식을 주시겠다는 그 약속을 찬양합니다.

주님, 제 온 생애가 주님을 찬양하는 삶이 되게 하여 주시옵소서.
제 입술로는 찬송을, 제 삶으로는 순종을 올려드리며 주님께 영광 돌리겠습니다.
온 땅 모든 피조물이 주님의 위대하심을 선포하고 그 이름을 높이는 날을 소망합니다.
영원토록 주님만이 찬양받으시기에 합당하신 분임을 고백하며, 예수님의 이름으로 기도드립니다.
아멘.`,

      묵상: `지혜의 근원이신 하나님 아버지, ${request.title}에 대해 깊이 묵상하고자 주님 앞에 나아옵니다.
${request.situation ? `${request.situation} 를 통해 주님께서 저에게 주시고자 하는 깊은 뜻을 헤아리고 싶습니다.` : '주님께서 제게 주신 말씀과 상황들을 통해 영적인 깨달음을 얻고자 합니다.'}
세상의 소란함과 바쁜 일상 속에서도 고요히 주님과 만나는 이 시간이 얼마나 소중한지 깨닫습니다.
제 마음의 문을 활짝 열고 성령님의 음성에 귀를 기울이고자 합니다.
인간적인 지혜와 경험으로는 깨달을 수 없는 하나님의 깊은 뜻을 알고 싶습니다.

성경 말씀을 읽을 때마다 단순히 글자로만 읽지 말고 그 속에 담긴 하나님의 마음을 읽게 하여 주시옵소서.
예수님의 생애와 가르침을 묵상하며 어떻게 살아야 할지 구체적인 방향을 깨닫게 하여 주시옵소서.
십자가의 사랑을 깊이 묵상하며 주님께서 저를 얼마나 사랑하시는지 가슴 깊이 느끼게 하여 주시옵소서.
부활의 능력을 묵상하며 절망과 죽음도 이겨낼 수 있는 소망의 확신을 갖게 하여 주시옵소서.
성령님의 임재하심을 묵상하며 혼자가 아니라 항상 주님과 함께 하는 삶임을 깨닫게 하여 주시옵소서.

이 묵상을 통해 단지 지식적으로만 아는 것이 아니라 삶으로 체험하고 실천하게 하여 주시옵소서.
주님의 성품을 닮아가며 사랑과 온유함, 인내와 겸손함이 제 안에서 자라나게 하여 주시옵소서.
어려운 상황에서도 주님의 뜻을 먼저 구하고 기도로 해결책을 찾는 믿음의 사람이 되게 하여 주시옵소서.
이웃을 사랑하고 섬기는 것이 주님을 사랑하는 것임을 깊이 깨닫고 실천하게 하여 주시옵소서.
세상의 가치관과 유혹에 흔들리지 않고 오직 하나님의 말씀을 기준으로 살아가게 하여 주시옵소서.

주님, 이 묵상의 시간이 단순한 개인적 경건이 아니라 주님과의 깊은 사랑의 교제가 되게 하여 주시옵소서.
묵상을 통해 받은 은혜와 깨달음을 다른 사람들과 나누며 함께 성장하는 공동체가 되게 하여 주시옵소서.
말씀 묵상이 제 삶의 습관이 되어 날마다 주님과 동행하는 기쁨을 누리게 하여 주시옵소서.
이 땅에서의 삶이 영원한 본향을 준비하는 순례의 여정임을 묵상하며 소망 중에 살아가게 하여 주시옵소서.
주님의 말씀이 제 발의 등이요 제 길의 빛이 되어 평생토록 주님의 뜻 안에서 걸어가게 하시며, 예수님의 이름으로 기도합니다.
아멘.`
    }

    // Select appropriate template based on category and length
    const templates = length === 'short' ? shortTemplates : longTemplates
    const template = templates[category as keyof typeof templates] || (length === 'short' ? shortTemplates['간구'] : longTemplates['간구'])

    return Promise.resolve({
      id: `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: template,
      title: request.title,
      category: request.category,
      generatedAt: new Date().toISOString(),
    })
  }

  static async generatePrayerWithOpenAI(request: PrayerGenerationRequest): Promise<{
    id: string
    content: string
    title: string
    category?: string
    generatedAt: string
  }> {
    const prompt = this.createPrayerPrompt(request)

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: '당신은 기독교 목회자로서 신앙인들을 위한 기도문을 작성하는 전문가입니다.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    })

    const content = completion.choices[0]?.message?.content?.trim()

    if (!content) {
      throw new Error('Failed to generate prayer content')
    }

    return {
      id: `prayer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      title: request.title,
      category: request.category,
      generatedAt: new Date().toISOString(),
    }
  }

  static async generatePrayer(request: PrayerGenerationRequest): Promise<{
    prayer: {
      id: string
      content: string
      title: string
      category?: string
      generatedAt: string
      cached: boolean
    }
  }> {
    const cacheKey = this.generateCacheKey(request)

    // Check cache first
    const cachedPrayer = await this.getCachedPrayer(cacheKey)
    if (cachedPrayer) {
      return {
        prayer: {
          id: cachedPrayer.id,
          content: cachedPrayer.content,
          title: cachedPrayer.title,
          category: cachedPrayer.category,
          generatedAt: cachedPrayer.generatedAt,
          cached: true,
        },
      }
    }

    // Generate new prayer (try OpenAI first, fallback if it fails)
    let prayer: {
      id: string
      content: string
      title: string
      category?: string
      generatedAt: string
    }
    
    try {
      prayer = await this.generatePrayerWithOpenAI(request)
    } catch (error) {
      console.log('OpenAI unavailable, using fallback prayer generation')
      prayer = await this.generateFallbackPrayer(request)
    }

    // Save to cache
    await this.savePrayerToCache(cacheKey, prayer)

    return {
      prayer: {
        ...prayer,
        cached: false,
      },
    }
  }
}

export const prayerService = PrayerService