export interface AiArchiveItem<T = unknown> {
  id: string;
  type: string;
  title: string;
  createdAt: string;
  payload: T;
}

const AI_ARCHIVE_KEY = 'springnxt.aiGenerationArchive';
export const AI_ARCHIVE_NAVIGATE_EVENT = 'springnxt:navigate-ai-archives';

function readArchive(): AiArchiveItem[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(AI_ARCHIVE_KEY);
    return raw ? (JSON.parse(raw) as AiArchiveItem[]) : [];
  } catch {
    return [];
  }
}

export function archiveAiGeneration<T>(input: Omit<AiArchiveItem<T>, 'id' | 'createdAt'>) {
  const item: AiArchiveItem<T> = {
    ...input,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };

  const next = [item, ...readArchive()].slice(0, 50);
  window.localStorage.setItem(AI_ARCHIVE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(AI_ARCHIVE_NAVIGATE_EVENT));
  return item;
}

export function deleteAiArchive(id: string) {
  const next = readArchive().filter((item) => item.id !== id);
  window.localStorage.setItem(AI_ARCHIVE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(AI_ARCHIVE_NAVIGATE_EVENT));
}

export function getAiArchive() {
  return readArchive();
}
