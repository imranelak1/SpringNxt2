package com.example.demo.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VelocityPointResponse {
    private Long sprintId;
    private String sprintName;
    private Integer committedPoints;
    private Integer completedPoints;
}
