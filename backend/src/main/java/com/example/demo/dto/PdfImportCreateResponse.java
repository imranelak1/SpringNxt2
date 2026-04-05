package com.example.demo.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PdfImportCreateResponse {

    private Long projectId;
    private String projectName;
    private int taskCount;
}
