package com.example.demo.service;

import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.model.Project;
import com.example.demo.model.ProjectMember;
import com.example.demo.model.Role;
import com.example.demo.model.Task;
import com.example.demo.model.User;
import com.example.demo.repository.ProjectMemberRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CurrentUserService {

    private final UserRepository userRepository;
    private final ProjectMemberRepository projectMemberRepository;

    @Transactional(readOnly = true)
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new AccessDeniedException("Authentication required");
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + authentication.getName()));
    }

    public boolean canManage(User user) {
        return user.getRole() == Role.ADMIN || user.getRole() == Role.MANAGER;
    }

    public void requireManagerOrAdmin() {
        if (!canManage(getCurrentUser())) {
            throw new AccessDeniedException("This action is reserved for admin and manager roles");
        }
    }

    @Transactional(readOnly = true)
    public List<Project> visibleProjects(User user) {
        if (canManage(user)) {
            throw new IllegalArgumentException("visibleProjects is only needed for employee-scoped access");
        }

        return projectMemberRepository.findByUserId(user.getId()).stream()
                .map(ProjectMember::getProject)
                .distinct()
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Long> visibleProjectIds(User user) {
        return visibleProjects(user).stream()
                .map(Project::getId)
                .toList();
    }

    @Transactional(readOnly = true)
    public boolean canViewProject(User user, Project project) {
        return canManage(user)
                || projectMemberRepository.existsByProjectIdAndUserId(project.getId(), user.getId());
    }

    @Transactional(readOnly = true)
    public void requireCanViewProject(Project project) {
        User user = getCurrentUser();
        if (!canViewProject(user, project)) {
            throw new AccessDeniedException("Project is not visible for the current user");
        }
    }

    public boolean canViewTask(User user, Task task) {
        return canManage(user)
                || (task.getAssignee() != null && task.getAssignee().getId().equals(user.getId()));
    }

    public void requireCanViewTask(Task task) {
        User user = getCurrentUser();
        if (!canViewTask(user, task)) {
            throw new AccessDeniedException("Task is not visible for the current user");
        }
    }

    public void requireCanUpdateEmployeeTask(User user, Task task) {
        if (canManage(user)) {
            return;
        }

        if (task.getAssignee() == null || !task.getAssignee().getId().equals(user.getId())) {
            throw new AccessDeniedException("Employees can only update tasks assigned to them");
        }
    }
}
