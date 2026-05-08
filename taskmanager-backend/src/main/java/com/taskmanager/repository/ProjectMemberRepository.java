package com.taskmanager.repository;

import com.taskmanager.entity.ProjectMember;
import com.taskmanager.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {
    Optional<ProjectMember> findByProjectIdAndUserId(Long projectId, Long userId);
    boolean existsByProjectIdAndUserId(Long projectId, Long userId);
    List<ProjectMember> findByProjectId(Long projectId);
    Optional<ProjectMember> findByProjectIdAndUserIdAndRole(Long projectId, Long userId, Role role);
}
