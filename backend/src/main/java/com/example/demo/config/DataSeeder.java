package com.example.demo.config;

import com.example.demo.model.AuthProvider;
import com.example.demo.model.Role;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Order(1)
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        upsert("Admin",   "Nexus",   "admin@springnxt.local",    Role.ADMIN);
        upsert("Project", "Manager", "manager@springnxt.local",  Role.MANAGER);
        upsert("Team",    "Member",  "employee1@springnxt.local", Role.EMPLOYEE);
    }

    private void upsert(String firstName, String lastName, String email, Role role) {
        userRepository.findByEmail(email).ifPresentOrElse(user -> {
            // Re-encode if the stored value is still plain text (no BCrypt prefix)
            if (!user.getPassword().startsWith("$2")) {
                user.setPassword(passwordEncoder.encode("password"));
                userRepository.save(user);
            }
        }, () -> {
            User user = User.builder()
                    .firstName(firstName)
                    .lastName(lastName)
                    .email(email)
                    .password(passwordEncoder.encode("password"))
                    .role(role)
                    .provider(AuthProvider.LOCAL)
                    .enabled(true)
                    .build();
            userRepository.save(user);
        });
    }
}
