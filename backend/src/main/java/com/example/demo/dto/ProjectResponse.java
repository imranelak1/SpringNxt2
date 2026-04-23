package com.example.demo.dto;

import com.example.demo.model.ProjectStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectResponse {

    private Long id;
    private String name;
    private String description;
    private ProjectStatus status;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal budget;
    private Integer progressPercentage;
    private LocalDateTime createdAt;
    private int taskCount;
    private int memberCount;
    private String githubRepo;
}
