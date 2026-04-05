package com.example.demo.repository;

import com.example.demo.model.CalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface CalendarEventRepository extends JpaRepository<CalendarEvent, Long> {
    List<CalendarEvent> findByEventDateBetweenOrderByEventDateAsc(LocalDate dateFrom, LocalDate dateTo);
}
