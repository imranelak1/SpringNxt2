package com.example.demo.service;

import com.example.demo.dto.CalendarEventRequest;
import com.example.demo.dto.CalendarEventResponse;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.model.CalendarEvent;
import com.example.demo.model.CalendarEventType;
import com.example.demo.model.User;
import com.example.demo.repository.CalendarEventRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CalendarEventService {

    private final CalendarEventRepository calendarEventRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<CalendarEventResponse> getEvents(LocalDate dateFrom, LocalDate dateTo) {
        if (dateFrom != null && dateTo != null) {
            return calendarEventRepository.findByEventDateBetweenOrderByEventDateAsc(dateFrom, dateTo).stream()
                    .map(this::mapToResponse)
                    .toList();
        }

        return calendarEventRepository.findAll().stream()
                .sorted((left, right) -> left.getEventDate().compareTo(right.getEventDate()))
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public CalendarEventResponse createEvent(CalendarEventRequest request) {
        User currentUser = getCurrentUser();

        CalendarEvent event = CalendarEvent.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .eventDate(request.getEventDate())
                .type(request.getType() != null ? request.getType() : CalendarEventType.CUSTOM)
                .createdBy(currentUser)
                .build();

        return mapToResponse(calendarEventRepository.save(event));
    }

    @Transactional
    public CalendarEventResponse updateEvent(Long id, CalendarEventRequest request) {
        CalendarEvent event = findEvent(id);

        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        event.setEventDate(request.getEventDate());
        event.setType(request.getType() != null ? request.getType() : CalendarEventType.CUSTOM);

        return mapToResponse(calendarEventRepository.save(event));
    }

    @Transactional
    public void deleteEvent(Long id) {
        calendarEventRepository.delete(findEvent(id));
    }

    private CalendarEvent findEvent(Long id) {
        return calendarEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Calendar event not found with id: " + id));
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new IllegalArgumentException("Unable to resolve authenticated user");
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));
    }

    private CalendarEventResponse mapToResponse(CalendarEvent event) {
        return CalendarEventResponse.builder()
                .id(event.getId())
                .title(event.getTitle())
                .description(event.getDescription())
                .eventDate(event.getEventDate())
                .type(event.getType())
                .createdByEmail(event.getCreatedBy() != null ? event.getCreatedBy().getEmail() : null)
                .createdAt(event.getCreatedAt())
                .build();
    }
}
