package com.example.demo.service;

import com.example.demo.dto.BudgetProjectItem;
import com.example.demo.dto.BudgetResponse;
import com.example.demo.model.Project;
import com.example.demo.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private final ProjectRepository projectRepository;

    @Transactional(readOnly = true)
    public BudgetResponse getBudget() {
        List<Project> projects = projectRepository.findAll();

        List<BudgetProjectItem> items = projects.stream()
                .filter(p -> p.getBudget() != null && p.getBudget().compareTo(BigDecimal.ZERO) > 0)
                .map(this::toItem)
                .toList();

        BigDecimal totalBudget = items.stream()
                .map(BudgetProjectItem::getBudgetAllocated)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalSpent = items.stream()
                .map(BudgetProjectItem::getBudgetSpent)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalRemaining = totalBudget.subtract(totalSpent);
        int overBudgetCount = (int) items.stream().filter(BudgetProjectItem::isOverBudget).count();

        return BudgetResponse.builder()
                .totalBudget(totalBudget.setScale(2, RoundingMode.HALF_UP))
                .totalSpent(totalSpent.setScale(2, RoundingMode.HALF_UP))
                .totalRemaining(totalRemaining.setScale(2, RoundingMode.HALF_UP))
                .overBudgetCount(overBudgetCount)
                .projects(items)
                .build();
    }

    private BudgetProjectItem toItem(Project p) {
        BigDecimal allocated = p.getBudget();
        int progress = p.getProgressPercentage() != null ? p.getProgressPercentage() : 0;
        BigDecimal spent = p.getSpentAmount() != null
                ? p.getSpentAmount()
                : allocated.multiply(BigDecimal.valueOf(progress))
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal remaining = allocated.subtract(spent);
        boolean overBudget = remaining.compareTo(BigDecimal.ZERO) < 0;

        return BudgetProjectItem.builder()
                .projectId(p.getId())
                .projectName(p.getName())
                .status(p.getStatus().name())
                .budgetAllocated(allocated.setScale(2, RoundingMode.HALF_UP))
                .budgetSpent(spent)
                .budgetRemaining(remaining)
                .progressPercentage(progress)
                .overBudget(overBudget)
                .build();
    }
}
