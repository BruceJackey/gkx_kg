/** Shared reviewer assignment for graph construction → human review */

export interface ReviewerOption {
  id: string;
  name: string;
  username: string;
}

/** Active reviewers available for task assignment */
export const REVIEWER_OPTIONS: ReviewerOption[] = [
  { id: 'user_001', name: '管理员', username: 'admin' },
  { id: 'user_002', name: '王研', username: 'wang_yan' },
  { id: 'user_003', name: '张三', username: 'zhang_san' },
  { id: 'user_005', name: '赵六', username: 'zhao_liu' },
  { id: 'user_006', name: '钱七', username: 'qian_qi' },
];

export type PeerReviewResult = 'pending' | 'approved' | 'rejected' | 'modified';

export interface PeerReviewMark {
  userId: string;
  name: string;
  result: PeerReviewResult;
}

export interface ConstructionReviewTask {
  id: string;
  createdAt: string;
  ontologyName: string;
  datasourceName: string;
  reviewerIds: string[]; // 1–2
}

const TASKS_KEY = 'kg_construction_review_tasks';
const CURRENT_USER_KEY = 'kg_current_reviewer_id';

export function getReviewerById(id: string): ReviewerOption | undefined {
  return REVIEWER_OPTIONS.find(r => r.id === id);
}

export function getReviewTasks(): ConstructionReviewTask[] {
  try {
    return JSON.parse(localStorage.getItem(TASKS_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function saveReviewTask(task: ConstructionReviewTask): void {
  const existing = getReviewTasks().filter(t => t.id !== task.id);
  localStorage.setItem(TASKS_KEY, JSON.stringify([task, ...existing]));
}

export function getLatestReviewTask(): ConstructionReviewTask | null {
  return getReviewTasks()[0] ?? null;
}

export function getCurrentReviewerId(): string {
  try {
    return localStorage.getItem(CURRENT_USER_KEY) || REVIEWER_OPTIONS[2].id; // default 张三
  } catch {
    return REVIEWER_OPTIONS[2].id;
  }
}

export function setCurrentReviewerId(id: string): void {
  localStorage.setItem(CURRENT_USER_KEY, id);
}

/** Build initial peer-review slots for assigned reviewers */
export function buildPeerReviews(reviewerIds: string[]): PeerReviewMark[] {
  return reviewerIds.map(id => {
    const r = getReviewerById(id);
    return { userId: id, name: r?.name ?? id, result: 'pending' as PeerReviewResult };
  });
}
