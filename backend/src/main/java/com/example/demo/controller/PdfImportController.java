package com.example.demo.controller;

import com.example.demo.dto.PdfImportAnalysisResponse;
import com.example.demo.dto.PdfImportCreateRequest;
import com.example.demo.dto.PdfImportCreateResponse;
import com.example.demo.service.PdfImportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/pdf-import")
@RequiredArgsConstructor
public class PdfImportController {

    private final PdfImportService pdfImportService;

    @PostMapping(value = "/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PdfImportAnalysisResponse> analyze(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(pdfImportService.analyze(file));
    }

    @PostMapping("/create")
    public ResponseEntity<PdfImportCreateResponse> create(@Valid @RequestBody PdfImportCreateRequest request) {
        return ResponseEntity.ok(pdfImportService.createProjectFromImport(request));
    }
}
