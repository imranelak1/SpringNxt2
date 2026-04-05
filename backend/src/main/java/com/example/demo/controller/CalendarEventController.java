package com.example.demo.controller;

import com.example.demo.dto.CalendarEventRequest;
import com.example.demo.dto.CalendarEventResponse;
import com.example.demo.service.CalendarEventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/calendar-events")
@RequiredArgsConstructor
public class CalendarEventController {

    private final CalendarEventService calendarEventService;

    @GetMapping
    public ResponseEntity<List<CalendarEventResponse>> getEvents(
            @RequestParam(required = false) LocalDate dateFrom,
            @RequestParam(required = false) LocalDate dateTo) {
        return ResponseEntity.ok(calendarEventService.getEvents(dateFrom, dateTo));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<CalendarEventResponse> createEvent(@Valid @RequestBody CalendarEventRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(calendarEventService.createEvent(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<CalendarEventResponse> updateEvent(
            @PathVariable Long id,
            @Valid @RequestBody CalendarEventRequest request) {
        return ResponseEntity.ok(calendarEventService.updateEvent(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> deleteEvent(@PathVariable Long id) {
        calendarEventService.deleteEvent(id);
        return ResponseEntity.noContent().build();
    }
}
