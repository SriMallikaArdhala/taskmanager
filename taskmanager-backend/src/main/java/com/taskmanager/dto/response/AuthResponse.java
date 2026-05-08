package com.taskmanager.dto.response;

import lombok.*;

@Data
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private Long userId;
    private String name;
    private String email;
}
