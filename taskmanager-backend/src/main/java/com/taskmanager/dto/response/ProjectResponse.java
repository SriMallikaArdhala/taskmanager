package com.taskmanager.dto.response;

import com.taskmanager.enums.Role;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ProjectResponse {
    private Long id;
    private String name;
    private String description;
    private String createdByName;
    private LocalDateTime createdAt;
    private List<MemberInfo> members;
    private long totalTasks;
    private long doneTasks;

    @Data
    @AllArgsConstructor
    public static class MemberInfo {
        private Long userId;
        private String name;
        private String email;
        private Role role;
    }
}
