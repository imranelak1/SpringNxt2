package com.example.demo.dto;

import jakarta.validation.constraints.Min;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskScrumUpdateRequest {
    @Min(value = 0, message = "Story points must be at least 0")
    private Integer storyPoints;

    @Min(value = 0, message = "Backlog rank must be at least 0")
    private Integer backlogRank;

    private String acceptanceCriteria;
}
