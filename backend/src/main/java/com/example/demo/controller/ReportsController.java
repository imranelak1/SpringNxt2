package com.example.demo.controller;

import com.example.demo.dto.ReportsResponse;
import com.example.demo.service.ReportsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportsController {

    private final ReportsService reportsService;

    @GetMapping
    public ResponseEntity<ReportsResponse> getReports() {
        return ResponseEntity.ok(reportsService.getReports());
    }
}
