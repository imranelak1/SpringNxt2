export type View =
  | 'dashboard'
  | 'projets'
  | 'taches'
  | 'calendrier'
  | 'ressources'
  | 'rapports'
  | 'budgets'
  | 'performance'
  | 'notifications'
  | 'parametres'
  | 'utilisateurs'
  | 'import-pdf'
  | 'gantt'
  | 'simulation'
  | 'archives-ia';

export type AppRole = 'admin' | 'pm' | 'employee';

export interface AuthSession {
  userId: number;
  token: string;
  email: string;
  role: AppRole;
  backendRole: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  userId: number;
  token: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
}

export interface AppNotification {
  id: number;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export interface DashboardProjectSummary {
  projectId: number;
  projectName: string;
  status: string;
  progressPercentage: number;
  taskCount: number;
  completedTaskCount: number;
  memberCount: number;
  overallHealthScore: number | null;
}

export interface DashboardResponse {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
  totalUsers: number;
  projects: DashboardProjectSummary[];
}

export interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  spentAmount: number | null;
  progressPercentage: number | null;
  createdAt: string;
  taskCount: number;
  memberCount: number;
  githubRepo: string | null;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  startDate: string | null;
  dueDate: string | null;
  estimatedHours: number | null;
  actualHours: number | null;
  storyPoints: number | null;
  backlogRank: number | null;
  acceptanceCriteria: string | null;
  createdAt: string;
  completedAt: string | null;
  projectId: number | null;
  projectName: string | null;
  sprintId: number | null;
  sprintName: string | null;
  assigneeId: number | null;
  assigneeEmail: string | null;
}

export interface TaskComment {
  id: number;
  taskId: number;
  authorId: number;
  authorEmail: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface UserSummary {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  enabled: boolean;
  createdAt: string;
}

export interface ProjectMember {
  id: number;
  projectId: number;
  projectName: string;
  userId: number;
  userEmail: string;
  firstName: string;
  lastName: string;
  role: string;
  allocationPercentage: number | null;
  createdAt: string;
}

export interface CreateProjectMemberInput {
  projectId: number;
  userId: number;
  role: string;
  allocationPercentage: number | null;
}

export interface PdfImportEntity {
  type: 'project' | 'task' | 'date' | 'member';
  label: string;
  value: string;
  sub?: string;
  editable?: boolean;
}

export interface PdfImportAnalysis {
  fileName: string;
  projectName: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
  entities: PdfImportEntity[];
}

export interface PdfImportCreateInput {
  projectName: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
  tasks: string[];
}

export interface PdfImportCreateResult {
  projectId: number;
  projectName: string;
  taskCount: number;
}

export interface CreateProjectInput {
  name: string;
  description: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  spentAmount: number | null;
  progressPercentage: number;
  githubRepo: string | null;
}

export interface CreateTaskInput {
  title: string;
  description: string;
  status: string;
  priority: string;
  startDate: string | null;
  dueDate: string | null;
  estimatedHours: number | null;
  actualHours: number | null;
  storyPoints?: number | null;
  backlogRank?: number | null;
  acceptanceCriteria?: string | null;
  projectId: number;
  assigneeId: number | null;
  sprintId?: number | null;
}

export interface Sprint {
  id: number;
  projectId: number;
  projectName: string;
  name: string;
  goal: string | null;
  startDate: string;
  endDate: string;
  status: 'PLANNED' | 'ACTIVE' | 'CLOSED';
  capacityPoints: number;
  committedPoints: number;
  completedPoints: number;
  remainingPoints: number;
  taskCount: number;
  doneTaskCount: number;
  createdAt: string;
  closedAt: string | null;
}

export interface SprintInput {
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  capacityPoints: number;
}

export interface BurndownPoint {
  date: string;
  idealRemainingPoints: number;
  actualRemainingPoints: number | null;
}

export interface VelocityPoint {
  sprintId: number;
  sprintName: string;
  committedPoints: number;
  completedPoints: number;
}

export interface ScrumMetrics {
  backlogItems: number;
  backlogPoints: number;
  activeCommittedPoints: number;
  activeCompletedPoints: number;
  activeRemainingPoints: number;
  activeBlockedItems: number;
  activeCapacityPoints: number;
  averageVelocity: number;
}

export interface ScrumBoard {
  projectId: number;
  projectName: string;
  activeSprint: Sprint | null;
  plannedSprints: Sprint[];
  closedSprints: Sprint[];
  backlog: Task[];
  activeSprintTasks: Task[];
  burndown: BurndownPoint[];
  velocity: VelocityPoint[];
  metrics: ScrumMetrics;
}

export interface TaskScrumInput {
  storyPoints?: number | null;
  backlogRank?: number | null;
  acceptanceCriteria?: string | null;
}

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
}

export interface CalendarEvent {
  id: number;
  title: string;
  description: string | null;
  eventDate: string;
  type: 'MEETING' | 'DEADLINE' | 'MILESTONE' | 'CUSTOM';
  createdByEmail: string | null;
  createdAt: string;
}

export interface CreateCalendarEventInput {
  title: string;
  description: string;
  eventDate: string;
  type: 'MEETING' | 'DEADLINE' | 'MILESTONE' | 'CUSTOM';
}

// Project Simulation
export interface SimTask {
  title: string;
  priority: string;
  estimatedHours: number;
  role: string;
}

export interface SimPhase {
  name: string;
  weeks: number;
  tasks: SimTask[];
}

export interface SimBudgetItem {
  category: string;
  amount: number;
  percentage: number;
}

export interface SimTeamRole {
  role: string;
  count: number;
  allocationPercentage: number;
}

export interface SimRisk {
  level: string;
  title: string;
  description: string;
}

export interface ProjectSimulationResponse {
  projectName: string;
  description: string;
  estimatedWeeks: number;
  totalBudget: number;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  phases: SimPhase[];
  budgetBreakdown: SimBudgetItem[];
  teamRoles: SimTeamRole[];
  risks: SimRisk[];
  keyInsights: string[];
}

// AI
export interface AiChatResponse {
  content: string;
  aiAvailable: boolean;
}

export interface AiInsightsResponse {
  insights: string[];
  aiAvailable: boolean;
}

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface UpdateProfileInput {
  firstName: string;
  lastName: string;
}

// Budget
export interface BudgetProjectItem {
  projectId: number;
  projectName: string;
  status: string;
  budgetAllocated: number;
  budgetSpent: number;
  budgetRemaining: number;
  progressPercentage: number;
  overBudget: boolean;
}

export interface BudgetResponse {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  overBudgetCount: number;
  projects: BudgetProjectItem[];
}

// Performance
export interface MemberPerformance {
  userId: number;
  firstName: string;
  lastName: string;
  totalTasks: number;
  completedTasks: number;
  onTimeRate: number;
  grade: string;
}

export interface WeeklyTaskCount {
  label: string;
  count: number;
}

export interface PerformanceResponse {
  teamVelocity: number;
  deliveryRate: number;
  avgHealthScore: number;
  overdueTaskCount: number;
  weeklyCompletedTasks: WeeklyTaskCount[];
  memberStats: MemberPerformance[];
}

// Reports
export interface MonthlyCount {
  label: string;
  count: number;
}

export interface StatusCount {
  status: string;
  count: number;
}

export interface ReportsResponse {
  totalProjects: number;
  completedProjects: number;
  activeProjects: number;
  deliveryRate: number;
  avgHealthScore: number;
  totalTasks: number;
  completedTasks: number;
  monthlyProjectCounts: MonthlyCount[];
  projectsByStatus: StatusCount[];
}

// Notifications
export interface NotificationItem {
  id: string;
  type: 'ALERT' | 'WARNING' | 'SUCCESS' | 'INFO';
  title: string;
  description: string;
  timeAgo: string;
  read: boolean;
}
