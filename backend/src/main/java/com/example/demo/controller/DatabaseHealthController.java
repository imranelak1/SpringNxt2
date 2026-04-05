package com.example.demo.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class DatabaseHealthController {

    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;

    public DatabaseHealthController(DataSource dataSource, JdbcTemplate jdbcTemplate) {
        this.dataSource = dataSource;
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/database")
    public ResponseEntity<Map<String, Object>> databaseHealth() {
        Map<String, Object> response = new LinkedHashMap<>();

        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();
            Integer queryResult = jdbcTemplate.queryForObject("SELECT 1", Integer.class);

            response.put("status", "UP");
            response.put("databaseProduct", metaData.getDatabaseProductName());
            response.put("databaseVersion", metaData.getDatabaseProductVersion());
            response.put("url", metaData.getURL());
            response.put("validationQuery", queryResult);

            return ResponseEntity.ok(response);
        } catch (Exception exception) {
            response.put("status", "DOWN");
            response.put("error", exception.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
        }
    }
}
