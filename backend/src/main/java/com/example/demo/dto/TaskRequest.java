package com.example.demo.dto;

import com.example.demo.model.TaskPriority;
import com.example.demo.model.TaskStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskRequest {

    @NotBlank(message = "Task title is required")
    private String title;

    private String description;

    private TaskStatus status;

    private TaskPriority priority;

    private LocalDate startDate;

    private LocalDate dueDate;

    @Min(value = 0, message = "Estimated hours must be at least 0")
    private Integer estimatedHours;

    @Min(value = 0, message = "Actual hours must be at least 0")
    private Integer actualHours;

    @NotNull(message = "Project id is required")
    private Long projectId;

    private Long assigneeId;
}
