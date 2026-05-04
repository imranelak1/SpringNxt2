package com.example.demo.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BudgetProjectItem {
    private Long projectId;
    private String projectName;
    private String status;
    private BigDecimal budgetAllocated;
    private BigDecimal budgetSpent;
    private BigDecimal budgetRemaining;
    private int progressPercentage;
    private boolean overBudget;
}
