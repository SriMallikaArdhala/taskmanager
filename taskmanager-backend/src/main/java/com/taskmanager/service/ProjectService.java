package com.taskmanager.service;

import com.taskmanager.dto.request.*;
import com.taskmanager.dto.response.ProjectResponse;
import com.taskmanager.entity.*;
import com.taskmanager.enums.Role;
import com.taskmanager.enums.TaskStatus;
import com.taskmanager.exception.CustomExceptions;
import com.taskmanager.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;

    @Transactional
    public ProjectResponse createProject(ProjectRequest request, User creator) {
        Project project = Project.builder()
                .name(request.getName())
                .description(request.getDescription())
                .createdBy(creator)
                .build();
        project = projectRepository.save(project);

        ProjectMember adminMember = ProjectMember.builder()
                .project(project)
                .user(creator)
                .role(Role.ADMIN)
                .build();
        memberRepository.save(adminMember);

        return toResponse(project, Role.ADMIN);
    }

    public List<ProjectResponse> getUserProjects(User user) {
        return projectRepository.findProjectsByUserId(user.getId())
                .stream()
                .map(p -> {
                    Role userRole = memberRepository.findByProjectIdAndUserId(p.getId(), user.getId())
                            .map(ProjectMember::getRole).orElse(Role.MEMBER);
                    return toResponse(p, userRole);
                })
                .collect(Collectors.toList());
    }

    public ProjectResponse getProject(Long projectId, User user) {
        Project project = getProjectAndValidateMember(projectId, user);
        Role role = memberRepository.findByProjectIdAndUserId(projectId, user.getId())
                .map(ProjectMember::getRole).orElse(Role.MEMBER);
        return toResponse(project, role);
    }

    @Transactional
    public void addMember(Long projectId, AddMemberRequest request, User admin) {
        Project project = getProjectAndValidateAdmin(projectId, admin);
        User newMember = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("User not found with email: " + request.getEmail()));

        if (memberRepository.existsByProjectIdAndUserId(projectId, newMember.getId())) {
            throw new CustomExceptions.BadRequestException("User is already a member");
        }

        memberRepository.save(ProjectMember.builder()
                .project(project)
                .user(newMember)
                .role(Role.MEMBER)
                .build());
    }

    @Transactional
    public void removeMember(Long projectId, Long userId, User admin) {
        getProjectAndValidateAdmin(projectId, admin);
        if (admin.getId().equals(userId)) {
            throw new CustomExceptions.BadRequestException("Admin cannot remove themselves");
        }
        ProjectMember member = memberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Member not found"));
        memberRepository.delete(member);
    }

    private Project getProjectAndValidateMember(Long projectId, User user) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Project not found"));
        if (!memberRepository.existsByProjectIdAndUserId(projectId, user.getId())) {
            throw new CustomExceptions.AccessDeniedException("You are not a member of this project");
        }
        return project;
    }

    private Project getProjectAndValidateAdmin(Long projectId, User user) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Project not found"));
        memberRepository.findByProjectIdAndUserIdAndRole(projectId, user.getId(), Role.ADMIN)
                .orElseThrow(() -> new CustomExceptions.AccessDeniedException("Only admins can perform this action"));
        return project;
    }

    private ProjectResponse toResponse(Project project, Role currentUserRole) {
        List<ProjectResponse.MemberInfo> memberInfos = memberRepository.findByProjectId(project.getId())
                .stream()
                .map(m -> new ProjectResponse.MemberInfo(
                        m.getUser().getId(),
                        m.getUser().getName(),
                        m.getUser().getEmail(),
                        m.getRole()))
                .collect(Collectors.toList());

        // FIX: Removed broken double-count; use single clean calculation
        long tasks = taskRepository.findByProjectId(project.getId()).size();
        long done = taskRepository.countByProjectIdAndStatus(project.getId(), TaskStatus.DONE);

        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .createdByName(project.getCreatedBy().getName())
                .createdAt(project.getCreatedAt())
                .members(memberInfos)
                .totalTasks(tasks)
                .doneTasks(done)
                .build();
    }
}
