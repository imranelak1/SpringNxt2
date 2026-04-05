package com.example.demo.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "health_scores")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HealthScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false, unique = true)
    private Project project;

    @Column(nullable = false)
    private Integer overallScore;

    @Column(nullable = false)
    private Integer delayScore;

    @Column(nullable = false)
    private Integer progressScore;

    @Column(nullable = false)
    private Integer workloadScore;

    @Column(nullable = false)
    private Integer budgetScore;

    @Column(nullable = false)
    private LocalDateTime calculatedAt;

    @PrePersist
    @PreUpdate
    protected void onSave() {
        this.calculatedAt = LocalDateTime.now();
        if (this.overallScore == null) {
            this.overallScore = 0;
        }
        if (this.delayScore == null) {
            this.delayScore = 0;
        }
        if (this.progressScore == null) {
            this.progressScore = 0;
        }
        if (this.workloadScore == null) {
            this.workloadScore = 0;
        }
        if (this.budgetScore == null) {
            this.budgetScore = 0;
        }
    }
}
