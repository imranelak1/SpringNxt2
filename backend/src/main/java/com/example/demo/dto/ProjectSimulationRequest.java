package com.example.demo.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProjectSimulationRequest {
    private String description;
    private BigDecimal budget;
    private String duration;
    private Integer teamSize;
}
