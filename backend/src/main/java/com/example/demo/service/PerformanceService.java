package com.example.demo.service;

import com.example.demo.dto.MemberPerformanceResponse;
import com.example.demo.dto.PerformanceResponse;
import com.example.demo.dto.WeeklyTaskCountResponse;
import com.example.demo.model.HealthScore;
import com.example.demo.model.Task;
import com.example.demo.model.TaskStatus;
import com.example.demo.model.User;
import com.example.demo.repository.HealthScoreRepository;
import com.example.demo.repository.TaskRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PerformanceService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final HealthScoreRepository healthScoreRepository;

    @Transactional(readOnly = true)
    public PerformanceResponse getPerformance() {
        List<Task> allTasks = taskRepository.findAll();
        List<Task> completedTasks = allTasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.DONE)
                .toList();

        int totalTasks = allTasks.size();
        int totalCompleted = completedTasks.size();
        int deliveryRate = totalTasks == 0 ? 0 : (totalCompleted * 100) / totalTasks;

        int overdueCount = (int) allTasks.stream()
                .filter(t -> t.getDueDate() != null
                        && t.getDueDate().isBefore(LocalDate.now())
                        && t.getStatus() != TaskStatus.DONE)
                .count();

        int weeklyAvg = buildWeeklyCompleted(completedTasks).stream()
                .mapToInt(WeeklyTaskCountResponse::getCount)
                .sum() / 7;
        int velocity = Math.min(100, weeklyAvg * 4);

        double avgHealth = healthScoreRepository.findAll().stream()
                .mapToInt(HealthScore::getOverallScore)
                .average()
                .orElse(0.0);

        List<WeeklyTaskCountResponse> weekly = buildWeeklyCompleted(completedTasks);
        List<MemberPerformanceResponse> members = buildMemberStats(allTasks);

        return PerformanceResponse.builder()
                .teamVelocity(velocity)
                .deliveryRate(deliveryRate)
                .avgHealthScore(Math.round(avgHealth * 10.0) / 10.0)
                .overdueTaskCount(overdueCount)
                .weeklyCompletedTasks(weekly)
                .memberStats(members)
                .build();
    }

    private List<WeeklyTaskCountResponse> buildWeeklyCompleted(List<Task> completedTasks) {
        LocalDateTime now = LocalDateTime.now();
        List<WeeklyTaskCountResponse> result = new ArrayList<>();

        for (int i = 6; i >= 0; i--) {
            LocalDateTime weekStart = now.minusWeeks(i).with(java.time.DayOfWeek.MONDAY)
                    .toLocalDate().atStartOfDay();
            LocalDateTime weekEnd = weekStart.plusDays(7);
            String label = "S" + (7 - i);

            long count = completedTasks.stream()
                    .filter(t -> {
                        LocalDateTime created = t.getCreatedAt();
                        return created != null && !created.isBefore(weekStart) && created.isBefore(weekEnd);
                    })
                    .count();

            result.add(new WeeklyTaskCountResponse(label, (int) count));
        }

        return result;
    }

    private List<MemberPerformanceResponse> buildMemberStats(List<Task> allTasks) {
        List<User> users = userRepository.findAll();

        Map<Long, List<Task>> byAssignee = allTasks.stream()
                .filter(t -> t.getAssignee() != null)
                .collect(Collectors.groupingBy(t -> t.getAssignee().getId()));

        return users.stream()
                .filter(u -> byAssignee.containsKey(u.getId()))
                .map(u -> {
                    List<Task> userTasks = byAssignee.get(u.getId());
                    int total = userTasks.size();
                    int completed = (int) userTasks.stream()
                            .filter(t -> t.getStatus() == TaskStatus.DONE)
                            .count();
                    int onTime = (int) userTasks.stream()
                            .filter(t -> t.getStatus() == TaskStatus.DONE
                                    && (t.getDueDate() == null || !t.getCreatedAt().toLocalDate().isAfter(t.getDueDate())))
                            .count();
                    int onTimeRate = completed == 0 ? 0 : (onTime * 100) / completed;
                    String grade = grade(onTimeRate, completed, total);

                    return MemberPerformanceResponse.builder()
                            .userId(u.getId())
                            .firstName(u.getFirstName())
                            .lastName(u.getLastName())
                            .totalTasks(total)
                            .completedTasks(completed)
                            .onTimeRate(onTimeRate)
                            .grade(grade)
                            .build();
                })
                .sorted((a, b) -> Integer.compare(b.getOnTimeRate(), a.getOnTimeRate()))
                .toList();
    }

    private String grade(int onTimeRate, int completed, int total) {
        if (onTimeRate >= 95) return "A+";
        if (onTimeRate >= 88) return "A";
        if (onTimeRate >= 80) return "B+";
        if (onTimeRate >= 70) return "B";
        return "C";
    }
}
