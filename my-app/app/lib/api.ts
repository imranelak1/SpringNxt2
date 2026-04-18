import type {
  AuthResponse,
  AuthSession,
  CalendarEvent,
  CreateProjectInput,
  CreateCalendarEventInput,
  CreateProjectMemberInput,
  CreateTaskInput,
  CreateUserInput,
  DashboardResponse,
  PdfImportAnalysis,
  PdfImportCreateInput,
  PdfImportCreateResult,
  PagedResponse,
  ProjectMember,
  Project,
  Task,
  TaskComment,
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

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
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
    ? window.setTimeout(() => controller?.abort(), 12000)
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
  let data: unknown = null;

  if (rawText) {
    try {
      data = JSON.parse(rawText) as unknown;
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    let message =
      response.status === 401
        ? 'Session expired. Please log in again.'
        : response.status === 403
          ? 'Access denied for your current role.'
          : `Request failed with status ${response.status}`;

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

export function getProjects(token: string, search?: string, status?: string) {
  const params = new URLSearchParams({
    page: '0',
    size: '12',
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

export function getTasks(token: string, status?: string, priority?: string) {
  const params = new URLSearchParams({
    page: '0',
    size: '30',
    sortBy: 'dueDate',
    sortDir: 'asc',
  });

  if (status && status !== 'ALL') {
    params.set('status', status);
  }

  if (priority && priority !== 'ALL') {
    params.set('priority', priority);
  }

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
