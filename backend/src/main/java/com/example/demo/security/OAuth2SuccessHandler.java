package com.example.demo.security;

import com.example.demo.model.AuthProvider;
import com.example.demo.model.Role;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Collections;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtService jwtService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        Map<String, Object> attributes = oAuth2User.getAttributes();

        String email = (String) attributes.get("email");
        String name = (String) attributes.getOrDefault("name", "");
        String[] nameParts = name.split(" ", 2);
        String firstName = nameParts[0];
        String lastName = nameParts.length > 1 ? nameParts[1] : "";

        // Determine provider from the registration id
        String registrationId = request.getRequestURI().contains("google") ? "GOOGLE" : "GITHUB";
        AuthProvider provider = AuthProvider.valueOf(registrationId);

        // Find or create user
        User user = userRepository.findByEmail(email)
                .orElseGet(() -> {
                    User newUser = User.builder()
                            .firstName(firstName)
                            .lastName(lastName)
                            .email(email)
                            .provider(provider)
                            .role(Role.EMPLOYEE)
                            .enabled(true)
                            .build();
                    return userRepository.save(newUser);
                });

        // Generate JWT
        org.springframework.security.core.userdetails.User userDetails = new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                "",
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())));

        String token = jwtService.generateToken(userDetails);

        // Redirect to frontend with token
        response.sendRedirect(frontendUrl + "/oauth2/callback?token=" + token);
    }
}
