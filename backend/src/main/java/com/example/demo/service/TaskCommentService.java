package com.example.demo.service;

import com.example.demo.dto.TaskCommentRequest;
import com.example.demo.dto.TaskCommentResponse;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.model.Task;
import com.example.demo.model.TaskComment;
import com.example.demo.model.User;
import com.example.demo.repository.TaskCommentRepository;
import com.example.demo.repository.TaskRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.ProjectMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TaskCommentService {

    private final TaskCommentRepository taskCommentRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final EmailService emailService;
    private final CurrentUserService currentUserService;

    @Transactional(readOnly = true)
    public List<TaskCommentResponse> getByTaskId(Long taskId) {
        Task task = findTask(taskId);
        currentUserService.requireCanViewTask(task);
        return taskCommentRepository.findByTaskIdOrderByCreatedAtDesc(taskId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public TaskCommentResponse addComment(Long taskId, TaskCommentRequest request, String authorEmail) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));
        currentUserService.requireCanViewTask(task);

        User author = userRepository.findByEmail(authorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + authorEmail));

        TaskComment saved = taskCommentRepository.save(TaskComment.builder()
                .task(task)
                .author(author)
                .text(request.getText().trim())
                .build());

        notifyCommentFollowers(task, author, request.getText().trim());

        return mapToResponse(saved);
    }

    private void notifyCommentFollowers(Task task, User author, String commentText) {
        Map<String, String> recipients = new LinkedHashMap<>();

        if (task.getAssignee() != null && !task.getAssignee().getId().equals(author.getId())) {
            recipients.put(task.getAssignee().getEmail(), task.getAssignee().getFirstName());
        }

        projectMemberRepository.findByProjectId(task.getProject().getId())
                .forEach(member -> {
                    User memberUser = member.getUser();
                    if (!memberUser.getId().equals(author.getId())) {
                        recipients.putIfAbsent(memberUser.getEmail(), memberUser.getFirstName());
                    }
                });

        recipients.forEach((email, firstName) -> emailService.sendTaskCommentAddedEmail(
                email,
                firstName,
                author.getFirstName() + " " + author.getLastName(),
                task.getProject().getName(),
                task.getTitle(),
                commentText));
    }

    private Task findTask(Long taskId) {
        return taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));
    }

    private TaskCommentResponse mapToResponse(TaskComment comment) {
        return TaskCommentResponse.builder()
                .id(comment.getId())
                .taskId(comment.getTask().getId())
                .authorId(comment.getAuthor().getId())
                .authorEmail(comment.getAuthor().getEmail())
                .authorName(comment.getAuthor().getFirstName() + " " + comment.getAuthor().getLastName())
                .text(comment.getText())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}
