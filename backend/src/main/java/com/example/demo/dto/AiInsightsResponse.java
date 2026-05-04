package com.example.demo.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AiInsightsResponse {
    private List<String> insights;
    private boolean aiAvailable;
}
