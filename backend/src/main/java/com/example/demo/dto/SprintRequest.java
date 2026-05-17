package com.example.demo.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SprintRequest {

    @NotBlank(message = "Sprint name is required")
    private String name;

    private String goal;

    @NotNull(message = "Sprint start date is required")
    private LocalDate startDate;

    @NotNull(message = "Sprint end date is required")
    private LocalDate endDate;

    @Min(value = 0, message = "Capacity points must be at least 0")
    private Integer capacityPoints;
}
