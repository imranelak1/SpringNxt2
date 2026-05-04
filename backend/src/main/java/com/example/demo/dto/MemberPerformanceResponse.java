package com.example.demo.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberPerformanceResponse {
    private Long userId;
    private String firstName;
    private String lastName;
    private int totalTasks;
    private int completedTasks;
    private int onTimeRate;
    private String grade;
}
