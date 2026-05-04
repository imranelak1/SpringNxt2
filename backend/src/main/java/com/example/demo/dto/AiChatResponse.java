package com.example.demo.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AiChatResponse {
    private String content;
    private boolean aiAvailable;
}
