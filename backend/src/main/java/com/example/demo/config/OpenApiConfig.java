package com.example.demo.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("SpringNxt API")
                        .version("v1")
                        .description("API documentation for the SpringNxt intelligent project management backend.")
                        .contact(new Contact()
                                .name("SpringNxt Team")
                                .email("support@springnxt.local"))
                        .license(new License()
                                .name("Internal Use")
                                .url("https://springnxt.local")));
    }
}
