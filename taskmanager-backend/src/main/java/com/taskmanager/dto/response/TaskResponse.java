package com.taskmanager.dto.response;

import com.taskmanager.enums.Priority;
import com.taskmanager.enums.TaskStatus;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class TaskResponse {
    private Long id;
    private String title;
    private String description;
    private LocalDate dueDate;
    private Priority priority;
    private TaskStatus status;
    private Long projectId;
    private String projectName;
    private Long assignedToId;
    private String assignedToName;
    private String createdByName;
    private LocalDateTime createdAt;
    private boolean overdue;
}
