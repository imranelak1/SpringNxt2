package com.example.demo.dto;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BurndownPointResponse {
    private LocalDate date;
    private Integer idealRemainingPoints;
    private Integer actualRemainingPoints;
}
