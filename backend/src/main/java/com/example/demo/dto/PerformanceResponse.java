package com.example.demo.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PerformanceResponse {
    private int teamVelocity;
    private int deliveryRate;
    private double avgHealthScore;
    private int overdueTaskCount;
    private List<WeeklyTaskCountResponse> weeklyCompletedTasks;
    private List<MemberPerformanceResponse> memberStats;
}
