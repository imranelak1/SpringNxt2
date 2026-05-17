package com.example.demo.repository;

import com.example.demo.model.Sprint;
import com.example.demo.model.SprintStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SprintRepository extends JpaRepository<Sprint, Long> {
    List<Sprint> findByProjectIdOrderByStartDateDescIdDesc(Long projectId);
    List<Sprint> findByProjectIdAndStatusOrderByStartDateDescIdDesc(Long projectId, SprintStatus status);
    Optional<Sprint> findFirstByProjectIdAndStatus(Long projectId, SprintStatus status);
    boolean existsByProjectIdAndStatus(Long projectId, SprintStatus status);
}
