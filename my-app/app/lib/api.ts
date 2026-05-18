import type {
  AiChatResponse,
  AiInsightsResponse,
  AuthResponse,
  AuthSession,
  BudgetResponse,
  ProjectSimulationResponse,
  UpdateProfileInput,
  CalendarEvent,
  CreateProjectInput,
  CreateCalendarEventInput,
  CreateProjectMemberInput,
  CreateTaskInput,
  CreateUserInput,
  DashboardResponse,
  NotificationItem,
  PdfImportAnalysis,
  PdfImportCreateInput,
  PdfImportCreateResult,
  PagedResponse,
  PerformanceResponse,
  ProjectMember,
  Project,
  ReportsResponse,
  ScrumBoard,
  Sprint,
  SprintInput,
  Task,
  TaskComment,
  TaskScrumInput,
  UserSummary,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

function mapRole(role: string): AuthSession['role'] {
  if (role === 'ADMIN') {
    return 'admin';
  }

  if (role === 'MANAGER') {
    return 'pm';
  }

  return 'employee';
}

async function request<T>(path: string, init: RequestInit = {}, token?: string, timeoutMs = 12000): Promise<T> {
  const headers = new Headers(init.headers);

  if (!headers.has('Content-Type') && init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const shouldUseInternalTimeout = !init.signal;
  const controller = shouldUseInternalTimeout ? new AbortController() : null;
  const timeoutId = shouldUseInternalTimeout
    ? window.setTimeout(() => controller?.abort(), timeoutMs)
    : null;

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      signal: init.signal ?? controller?.signal,
    });
  } catch (fetchError) {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }

    if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
      throw new Error('Request timed out. Please check backend/database connectivity.');
    }

    throw fetchError;
  }

  if (timeoutId !== null) {
    window.clearTimeout(timeoutId);
  }

  const rawText = await response.text();
  const data = rawText ? (JSON.parse(rawText) as unknown) : null;

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    if (typeof data === 'object' && data !== null) {
      if ('message' in data && typeof data.message === 'string') {
        message = data.message;
      } else if ('errors' in data && typeof data.errors === 'object' && data.errors !== null) {
        const firstError = Object.values(data.errors)[0];
        if (typeof firstError === 'string') {
          message = firstError;
        }
      }
    }

    throw new Error(message);
  }

  return data as T;
}

export async function login(email: string, password: string): Promise<AuthSession> {
  const response = await request<AuthResponse>(
    '/api/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    },
  );

  return {
    userId: response.userId,
    token: response.token,
    email: response.email,
    role: mapRole(response.role),
    backendRole: response.role,
    firstName: response.firstName ?? '',
    lastName: response.lastName ?? '',
  };
}

export function getDashboard(token: string) {
  return request<DashboardResponse>('/api/dashboard', {}, token);
}

export function getProjects(token: string, search?: string, status?: string, size = 12) {
  const params = new URLSearchParams({
    page: '0',
    size: String(size),
    sortBy: 'createdAt',
    sortDir: 'desc',
  });

  if (search) {
    params.set('search', search);
  }

  if (status && status !== 'ALL') {
    params.set('status', status);
  }

  return request<PagedResponse<Project>>(`/api/projects?${params.toString()}`, {}, token);
}

export function getTasks(token: string, status?: string, priority?: string, projectId?: number) {
  const params = new URLSearchParams({
    page: '0',
    size: '100',
    sortBy: 'dueDate',
    sortDir: 'asc',
  });

  if (status && status !== 'ALL') params.set('status', status);
  if (priority && priority !== 'ALL') params.set('priority', priority);
  if (projectId !== undefined) params.set('projectId', String(projectId));

  return request<PagedResponse<Task>>(`/api/tasks?${params.toString()}`, {}, token);
}

export function getUsers(token: string) {
  return request<UserSummary[]>('/api/users', {}, token);
}

export function getProjectMembers(token: string, projectId: number) {
  return request<ProjectMember[]>(`/api/project-members?projectId=${projectId}`, {}, token);
}

export function createProjectMember(token: string, input: CreateProjectMemberInput) {
  return request<ProjectMember>(
    '/api/project-members',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );
}

export function updateProjectMember(token: string, memberId: number, input: CreateProjectMemberInput) {
  return request<ProjectMember>(
    `/api/project-members/${memberId}`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
    token,
  );
}

export function deleteProjectMember(token: string, memberId: number) {
  return request<void>(
    `/api/project-members/${memberId}`,
    {
      method: 'DELETE',
    },
    token,
  );
}

export function analyzePdfImport(token: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);

  return request<PdfImportAnalysis>(
    '/api/pdf-import/analyze',
    {
      method: 'POST',
      body: formData,
      headers: {},
    },
    token,
  );
}

export function createProjectFromPdfImport(token: string, input: PdfImportCreateInput) {
  return request<PdfImportCreateResult>(
    '/api/pdf-import/create',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );
}

export function createProject(token: string, input: CreateProjectInput) {
  return request<Project>(
    '/api/projects',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );
}

export function updateProject(token: string, projectId: number, input: CreateProjectInput) {
  return request<Project>(
    `/api/projects/${projectId}`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
    token,
  );
}

export function deleteProject(token: string, projectId: number) {
  return request<void>(
    `/api/projects/${projectId}`,
    {
      method: 'DELETE',
    },
    token,
  );
}

export function createTask(token: string, input: CreateTaskInput) {
  return request<Task>(
    '/api/tasks',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );
}

export function getTaskComments(token: string, taskId: number) {
  return request<TaskComment[]>(`/api/tasks/${taskId}/comments`, {}, token);
}

export function createTaskComment(token: string, taskId: number, text: string) {
  return request<TaskComment>(
    `/api/tasks/${taskId}/comments`,
    {
      method: 'POST',
      body: JSON.stringify({ text }),
    },
    token,
  );
}

export function getCalendarEvents(token: string, dateFrom?: string, dateTo?: string) {
  const params = new URLSearchParams();

  if (dateFrom) {
    params.set('dateFrom', dateFrom);
  }

  if (dateTo) {
    params.set('dateTo', dateTo);
  }

  const suffix = params.toString() ? `?${params.toString()}` : '';
  return request<CalendarEvent[]>(`/api/calendar-events${suffix}`, {}, token);
}

export function createCalendarEvent(token: string, input: CreateCalendarEventInput) {
  return request<CalendarEvent>(
    '/api/calendar-events',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );
}

export function updateCalendarEvent(token: string, eventId: number, input: CreateCalendarEventInput) {
  return request<CalendarEvent>(
    `/api/calendar-events/${eventId}`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
    token,
  );
}

export function deleteCalendarEvent(token: string, eventId: number) {
  return request<void>(
    `/api/calendar-events/${eventId}`,
    {
      method: 'DELETE',
    },
    token,
  );
}

export function updateTask(token: string, taskId: number, input: CreateTaskInput) {
  return request<Task>(
    `/api/tasks/${taskId}`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
    token,
  );
}

export function deleteTask(token: string, taskId: number) {
  return request<void>(
    `/api/tasks/${taskId}`,
    {
      method: 'DELETE',
    },
    token,
  );
}

export function getScrumBoard(token: string, projectId: number) {
  return request<ScrumBoard>(`/api/projects/${projectId}/scrum`, {}, token);
}

export function createSprint(token: string, projectId: number, input: SprintInput) {
  return request<Sprint>(
    `/api/projects/${projectId}/sprints`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );
}

export function updateSprint(token: string, sprintId: number, input: SprintInput) {
  return request<Sprint>(
    `/api/sprints/${sprintId}`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
    token,
  );
}

export function startSprint(token: string, sprintId: number) {
  return request<Sprint>(
    `/api/sprints/${sprintId}/start`,
    {
      method: 'PUT',
    },
    token,
  );
}

export function closeSprint(token: string, sprintId: number) {
  return request<Sprint>(
    `/api/sprints/${sprintId}/close`,
    {
      method: 'PUT',
    },
    token,
  );
}

export function assignTaskToSprint(token: string, sprintId: number, taskId: number) {
  return request<Task>(
    `/api/sprints/${sprintId}/tasks/${taskId}`,
    {
      method: 'PUT',
    },
    token,
  );
}

export function removeTaskFromSprint(token: string, sprintId: number, taskId: number) {
  return request<Task>(
    `/api/sprints/${sprintId}/tasks/${taskId}`,
    {
      method: 'DELETE',
    },
    token,
  );
}

export function updateTaskScrum(token: string, taskId: number, input: TaskScrumInput) {
  return request<Task>(
    `/api/tasks/${taskId}/scrum`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
    token,
  );
}

export function createUser(token: string, input: CreateUserInput) {
  return request<UserSummary>(
    '/api/users',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );
}

export function updateUser(token: string, userId: number, input: CreateUserInput) {
  return request<UserSummary>(
    `/api/users/${userId}`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
    token,
  );
}

export function deleteUser(token: string, userId: number) {
  return request<void>(
    `/api/users/${userId}`,
    {
      method: 'DELETE',
    },
    token,
  );
}

export function getBudget(token: string) {
  return request<BudgetResponse>('/api/budget', {}, token);
}

export function getPerformance(token: string) {
  return request<PerformanceResponse>('/api/performance', {}, token);
}

export function getReports(token: string) {
  return request<ReportsResponse>('/api/reports', {}, token);
}

export function getNotifications(token: string) {
  return request<NotificationItem[]>('/api/notifications', {}, token);
}

const AI_TIMEOUT = 60_000;

export function askAi(token: string, message: string, projectId?: number) {
  return request<AiChatResponse>(
    '/api/ai/ask',
    { method: 'POST', body: JSON.stringify({ message, projectId: projectId ?? null }) },
    token,
    AI_TIMEOUT,
  );
}

export function getAiInsights(token: string) {
  return request<AiInsightsResponse>('/api/ai/insights', {}, token, AI_TIMEOUT);
}

export function decomposeTasks(token: string, goal: string, projectId?: number) {
  return request<AiChatResponse>(
    '/api/ai/tasks/decompose',
    { method: 'POST', body: JSON.stringify({ goal, projectId: projectId ?? null }) },
    token,
    AI_TIMEOUT,
  );
}

export function analyzeProjectRisk(token: string, projectId: number) {
  return request<AiChatResponse>(`/api/ai/project/${projectId}/risk`, {}, token, AI_TIMEOUT);
}

export function simulateProject(
  token: string,
  description: string,
  budget: number | null,
  duration: string,
  teamSize: number,
) {
  return request<ProjectSimulationResponse>(
    '/api/ai/project/simulate',
    { method: 'POST', body: JSON.stringify({ description, budget, duration, teamSize }) },
    token,
    AI_TIMEOUT,
  );
}

export function updateProfile(token: string, input: UpdateProfileInput) {
  return request<AuthResponse>(
    '/api/auth/me',
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
    token,
  );
}
