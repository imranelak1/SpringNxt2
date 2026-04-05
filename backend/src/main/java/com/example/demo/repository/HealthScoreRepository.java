package com.example.demo.repository;

import com.example.demo.model.HealthScore;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface HealthScoreRepository extends JpaRepository<HealthScore, Long> {
    Optional<HealthScore> findByProjectId(Long projectId);
}
