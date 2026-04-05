package com.example.demo.dto;

import com.example.demo.model.ProjectMemberRole;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectMemberResponse {

    private Long id;
    private Long projectId;
    private String projectName;
    private Long userId;
    private String userEmail;
    private String firstName;
    private String lastName;
    private ProjectMemberRole role;
    private Integer allocationPercentage;
    private LocalDateTime createdAt;
}
