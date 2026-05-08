package com.taskmanager.service;

import com.taskmanager.dto.request.*;
import com.taskmanager.dto.response.AuthResponse;
import com.taskmanager.entity.User;
import com.taskmanager.exception.CustomExceptions;
import com.taskmanager.repository.UserRepository;
import com.taskmanager.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthResponse signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new CustomExceptions.BadRequestException("Email already registered");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .build();

        userRepository.save(user);
        String token = tokenProvider.generateToken(user.getEmail(), user.getId());
        return new AuthResponse(token, user.getId(), user.getName(), user.getEmail());
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new CustomExceptions.BadRequestException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new CustomExceptions.BadRequestException("Invalid email or password");
        }

        String token = tokenProvider.generateToken(user.getEmail(), user.getId());
        return new AuthResponse(token, user.getId(), user.getName(), user.getEmail());
    }

    public User getCurrentUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("User not found"));
    }
}
