package com.taskmanager.service;

import com.taskmanager.dto.request.TaskRequest;
import com.taskmanager.dto.response.TaskResponse;
import com.taskmanager.entity.*;
import com.taskmanager.enums.Role;
import com.taskmanager.enums.TaskStatus;
import com.taskmanager.exception.CustomExceptions;
import com.taskmanager.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository memberRepository;
    private final UserRepository userRepository;

    // NEW: Returns all tasks assigned to the current user across all projects
    public List<TaskResponse> getMyTasks(User user) {
        return taskRepository.findByAssignedToId(user.getId())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public TaskResponse createTask(Long projectId, TaskRequest request, User creator) {
        validateAdminAccess(projectId, creator);

        // Service-layer validation for required fields on creation
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new CustomExceptions.BadRequestException("Title is required");
        }
        if (request.getPriority() == null) {
            throw new CustomExceptions.BadRequestException("Priority is required");
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Project not found"));

        User assignedTo = null;
        if (request.getAssignedToId() != null) {
            assignedTo = userRepository.findById(request.getAssignedToId())
                    .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Assigned user not found"));
            if (!memberRepository.existsByProjectIdAndUserId(projectId, assignedTo.getId())) {
                throw new CustomExceptions.BadRequestException("Assigned user is not a project member");
            }
        }

        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .dueDate(request.getDueDate())
                .priority(request.getPriority())
                .status(request.getStatus() != null ? request.getStatus() : TaskStatus.TODO)
                .project(project)
                .assignedTo(assignedTo)
                .createdBy(creator)
                .build();

        return toResponse(taskRepository.save(task));
    }

    public List<TaskResponse> getProjectTasks(Long projectId, User user) {
        if (!memberRepository.existsByProjectIdAndUserId(projectId, user.getId())) {
            throw new CustomExceptions.AccessDeniedException("You are not a member of this project");
        }

        boolean isAdmin = memberRepository.findByProjectIdAndUserIdAndRole(
                projectId, user.getId(), Role.ADMIN).isPresent();

        List<Task> tasks = isAdmin
                ? taskRepository.findByProjectId(projectId)
                : taskRepository.findByProjectIdAndAssignedToId(projectId, user.getId());

        return tasks.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public TaskResponse updateTask(Long taskId, TaskRequest request, User user) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Task not found"));

        boolean isAdmin = memberRepository.findByProjectIdAndUserIdAndRole(
                task.getProject().getId(), user.getId(), Role.ADMIN).isPresent();
        boolean isAssignee = task.getAssignedTo() != null
                && task.getAssignedTo().getId().equals(user.getId());

        if (!isAdmin && !isAssignee) {
            throw new CustomExceptions.AccessDeniedException("You cannot update this task");
        }

        // Admins can update all fields; members can only update status
        if (isAdmin) {
            if (request.getTitle() != null && !request.getTitle().isBlank()) {
                task.setTitle(request.getTitle());
            }
            if (request.getDescription() != null) {
                task.setDescription(request.getDescription());
            }
            if (request.getDueDate() != null) {
                task.setDueDate(request.getDueDate());
            }
            if (request.getPriority() != null) {
                task.setPriority(request.getPriority());
            }
            if (request.getAssignedToId() != null) {
                User assignedTo = userRepository.findById(request.getAssignedToId())
                        .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("User not found"));
                task.setAssignedTo(assignedTo);
            }
        }

        // Both admin and assignee can update status
        if (request.getStatus() != null) {
            task.setStatus(request.getStatus());
        }

        return toResponse(taskRepository.save(task));
    }

    @Transactional
    public void deleteTask(Long taskId, User user) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Task not found"));
        validateAdminAccess(task.getProject().getId(), user);
        taskRepository.delete(task);
    }

    private void validateAdminAccess(Long projectId, User user) {
        memberRepository.findByProjectIdAndUserIdAndRole(projectId, user.getId(), Role.ADMIN)
                .orElseThrow(() -> new CustomExceptions.AccessDeniedException("Only admins can perform this action"));
    }

    private TaskResponse toResponse(Task task) {
        return TaskResponse.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .dueDate(task.getDueDate())
                .priority(task.getPriority())
                .status(task.getStatus())
                .projectId(task.getProject().getId())
                .projectName(task.getProject().getName())
                .assignedToId(task.getAssignedTo() != null ? task.getAssignedTo().getId() : null)
                .assignedToName(task.getAssignedTo() != null ? task.getAssignedTo().getName() : null)
                .createdByName(task.getCreatedBy().getName())
                .createdAt(task.getCreatedAt())
                .overdue(task.getDueDate() != null
                        && task.getDueDate().isBefore(LocalDate.now())
                        && task.getStatus() != TaskStatus.DONE)
                .build();
    }
}