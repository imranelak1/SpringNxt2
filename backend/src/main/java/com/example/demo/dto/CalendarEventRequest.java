package com.example.demo.dto;

import com.example.demo.model.CalendarEventType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalendarEventRequest {

    @NotBlank(message = "Event title is required")
    private String title;

    private String description;

    @NotNull(message = "Event date is required")
    private LocalDate eventDate;

    private CalendarEventType type;
}
