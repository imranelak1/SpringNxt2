package com.example.demo.dto;

import com.example.demo.model.CalendarEventType;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalendarEventResponse {

    private Long id;
    private String title;
    private String description;
    private LocalDate eventDate;
    private CalendarEventType type;
    private String createdByEmail;
    private LocalDateTime createdAt;
}
