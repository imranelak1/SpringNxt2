package com.example.demo.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PdfImportEntityResponse {

    private String type;
    private String label;
    private String value;
    private String sub;
    private boolean editable;
}
