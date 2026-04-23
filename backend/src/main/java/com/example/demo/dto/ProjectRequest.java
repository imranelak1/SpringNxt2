package com.example.demo.dto;

import com.example.demo.model.ProjectStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectRequest {

    @NotBlank(message = "Project name is required")
    private String name;

    private String description;

    private ProjectStatus status;

    private LocalDate startDate;

    private LocalDate endDate;

    private BigDecimal budget;

    @Min(value = 0, message = "Progress percentage must be at least 0")
    @Max(value = 100, message = "Progress percentage must be at most 100")
    private Integer progressPercentage;

    private String githubRepo;
}
