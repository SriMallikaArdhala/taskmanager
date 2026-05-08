package com.taskmanager.service;

import com.taskmanager.dto.response.DashboardResponse;
import com.taskmanager.entity.*;
import com.taskmanager.enums.TaskStatus;
import com.taskmanager.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;

    public DashboardResponse getDashboard(User user) {
        List<Task> allTasks = taskRepository.findAllTasksForUser(user.getId());
        List<Task> overdueTasks = taskRepository.findOverdueTasksForUser(user.getId(), LocalDate.now());
        long totalProjects = projectRepository.findProjectsByUserId(user.getId()).size();

        long todo = allTasks.stream().filter(t -> t.getStatus() == TaskStatus.TODO).count();
        long inProgress = allTasks.stream().filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS).count();
        long done = allTasks.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count();

        Map<String, Long> perUserMap = allTasks.stream()
                .filter(t -> t.getAssignedTo() != null)
                .collect(Collectors.groupingBy(t -> t.getAssignedTo().getName(), Collectors.counting()));

        List<DashboardResponse.TaskPerUser> tasksPerUser = perUserMap.entrySet().stream()
                .map(e -> new DashboardResponse.TaskPerUser(e.getKey(), e.getValue()))
                .collect(Collectors.toList());

        return DashboardResponse.builder()
                .totalTasks(allTasks.size())
                .todoCount(todo)
                .inProgressCount(inProgress)
                .doneCount(done)
                .overdueCount(overdueTasks.size())
                .totalProjects(totalProjects)
                .tasksPerUser(tasksPerUser)
                .build();
    }
}
