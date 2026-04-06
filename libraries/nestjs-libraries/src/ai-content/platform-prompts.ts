import { PlatformStyle } from './ai-content.types';

export const PLATFORM_STYLES: Record<string, PlatformStyle> = {
  tiktok: { platform: 'TikTok', maxLength: 2200, style: 'Короткий, энергичный, с emoji, trending хештеги.', hashtagLimit: 10, includeTitle: false },
  instagram: { platform: 'Instagram Reels', maxLength: 2200, style: 'Средний текст с CTA. Хештеги в конце.', hashtagLimit: 30, includeTitle: false },
  youtube: { platform: 'YouTube', maxLength: 5000, style: 'SEO-описание. Первые 2 строки важнейшие.', hashtagLimit: 15, includeTitle: true },
  telegram: { platform: 'Telegram', maxLength: 4096, style: 'Форматированный пост с markdown.', hashtagLimit: 5, includeTitle: false },
  vk: { platform: 'ВКонтакте', maxLength: 4096, style: 'Дружелюбный текст с хештегами VK-стиля.', hashtagLimit: 10, includeTitle: false },
  ok: { platform: 'Одноклассники', maxLength: 4096, style: 'Простой текст. Аудитория 35+. Без сленга.', hashtagLimit: 5, includeTitle: false },
  pinterest: { platform: 'Pinterest', maxLength: 500, style: 'SEO-описание с ключевыми словами.', hashtagLimit: 10, includeTitle: true },
  yappy: { platform: 'Yappy', maxLength: 2200, style: 'Короткий, молодёжный, с emoji.', hashtagLimit: 10, includeTitle: false },
  dzen: { platform: 'Дзен', maxLength: 5000, style: 'Длинное SEO-описание. Информативный стиль.', hashtagLimit: 5, includeTitle: true },
  rutube: { platform: 'Rutube', maxLength: 5000, style: 'YouTube-стиль: SEO-заголовок + описание.', hashtagLimit: 15, includeTitle: true },
};

export function buildGenerationPrompt(
  baseDescription: string,
  platforms: string[],
  niche?: string,
  tone?: string,
  language?: string,
  blacklistWords?: string[],
  blacklistTags?: string[]
): string {
  const platformInstructions = platforms
    .map((p) => {
      const style = PLATFORM_STYLES[p];
      if (!style) return '';
      return `### ${style.platform}\n- Макс: ${style.maxLength} символов\n- Стиль: ${style.style}\n- Хештегов: до ${style.hashtagLimit}\n- ${style.includeTitle ? 'Нужен заголовок' : 'Без заголовка'}`;
    })
    .filter(Boolean)
    .join('\n\n');

  const langMap: Record<string, string> = { ru: 'русский', en: 'английский', auto: 'определи по контексту' };

  return `Ты — SMM-специалист. Адаптируй описание видео под каждую платформу.

## Базовое описание
${baseDescription}

${niche ? `## Ниша: ${niche}` : ''}
${tone ? `## Тон: ${tone}` : ''}
${language ? `## Язык: ${langMap[language] || language}` : ''}
${blacklistWords?.length ? `## Запрещённые слова: ${blacklistWords.join(', ')}` : ''}
${blacklistTags?.length ? `## Запрещённые хештеги: ${blacklistTags.join(', ')}` : ''}

## Платформы

${platformInstructions}

## Формат ответа — строго JSON:
\`\`\`json
{
  "contents": [
    { "platform": "platform_id", "title": "заголовок или null", "description": "текст", "hashtags": ["тег1", "тег2"] }
  ]
}
\`\`\``;
}
