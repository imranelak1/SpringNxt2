package com.example.demo.dto;

import com.example.demo.model.ProjectMemberRole;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectMemberRequest {

    @NotNull(message = "Project id is required")
    private Long projectId;

    @NotNull(message = "User id is required")
    private Long userId;

    private ProjectMemberRole role;

    @Min(value = 0, message = "Allocation percentage must be at least 0")
    @Max(value = 100, message = "Allocation percentage must be at most 100")
    private Integer allocationPercentage;
}
