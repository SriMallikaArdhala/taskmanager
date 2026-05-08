package com.taskmanager.dto.response;

import lombok.*;
import java.util.List;

@Data
@Builder
public class DashboardResponse {
    private long totalTasks;
    private long todoCount;
    private long inProgressCount;
    private long doneCount;
    private long overdueCount;
    private long totalProjects;
    private List<TaskPerUser> tasksPerUser;

    @Data
    @AllArgsConstructor
    public static class TaskPerUser {
        private String userName;
        private long taskCount;
    }
}
