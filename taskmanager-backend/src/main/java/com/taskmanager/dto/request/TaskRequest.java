package com.taskmanager.dto.request;

import com.taskmanager.enums.Priority;
import com.taskmanager.enums.TaskStatus;
import lombok.Data;
import java.time.LocalDate;

@Data
public class TaskRequest {
    // FIX: Removed @NotBlank and @NotNull so members can update status
    // without being forced to supply all fields. Validation is done in service layer.
    private String title;
    private String description;
    private LocalDate dueDate;
    private Priority priority;
    private TaskStatus status;
    private Long assignedToId;
}
