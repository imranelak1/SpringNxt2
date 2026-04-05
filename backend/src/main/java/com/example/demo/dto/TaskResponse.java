package com.example.demo.dto;

import com.example.demo.model.TaskPriority;
import com.example.demo.model.TaskStatus;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskResponse {

    private Long id;
    private String title;
    private String description;
    private TaskStatus status;
    private TaskPriority priority;
    private LocalDate startDate;
    private LocalDate dueDate;
    private Integer estimatedHours;
    private Integer actualHours;
    private LocalDateTime createdAt;
    private Long projectId;
    private String projectName;
    private Long assigneeId;
    private String assigneeEmail;
}
