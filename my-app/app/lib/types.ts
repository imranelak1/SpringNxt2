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
  | 'gantt';

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
  createdAt: string;
  projectId: number | null;
  projectName: string | null;
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
  projectId: number;
  assigneeId: number | null;
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
