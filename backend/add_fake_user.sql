-- Insert a fake user for testing
INSERT INTO users (email, first_name, last_name, password, provider, role, enabled, created_at)
VALUES ('test@example.com', 'Test', 'User', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'LOCAL', 'EMPLOYEE', true, NOW());