package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PdfImportCreateRequest {

    @NotBlank(message = "Project name is required")
    private String projectName;

    private String description;

    private LocalDate startDate;

    private LocalDate endDate;

    private List<String> tasks;
}
