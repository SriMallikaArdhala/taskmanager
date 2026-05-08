package com.taskmanager.repository;

import com.taskmanager.entity.Task;
import com.taskmanager.enums.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByProjectId(Long projectId);

    List<Task> findByAssignedToId(Long userId);

    List<Task> findByProjectIdAndAssignedToId(Long projectId, Long userId);

    long countByProjectIdAndStatus(Long projectId, TaskStatus status);

    @Query("SELECT t FROM Task t JOIN t.project p JOIN p.members m WHERE m.user.id = :userId")
    List<Task> findAllTasksForUser(@Param("userId") Long userId);

    @Query("SELECT t FROM Task t JOIN t.project p JOIN p.members m WHERE m.user.id = :userId AND t.dueDate < :today AND t.status != 'DONE'")
    List<Task> findOverdueTasksForUser(@Param("userId") Long userId, @Param("today") LocalDate today);
}
