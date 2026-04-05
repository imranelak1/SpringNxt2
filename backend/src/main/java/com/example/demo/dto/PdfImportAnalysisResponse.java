package com.example.demo.dto;

import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PdfImportAnalysisResponse {

    private String fileName;
    private String projectName;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private List<PdfImportEntityResponse> entities;
}
