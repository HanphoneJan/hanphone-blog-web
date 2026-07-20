package com.example.blog.service.impl;

import com.example.blog.dao.ProjectRepository;
import com.example.blog.po.Project;
import com.example.blog.service.ProjectService;
import com.example.blog.util.MyBeanUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.Predicate;
import jakarta.transaction.Transactional;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import static java.util.Objects.requireNonNull;

@Service
public class ProjectServiceImpl implements ProjectService {

    private static final int MAX_LIST_SIZE = 200;

    private final ProjectRepository projectRepository;

    // 构造函数注入时校验依赖非空
    public ProjectServiceImpl(ProjectRepository projectRepository) {
        this.projectRepository = Objects.requireNonNull(projectRepository, "projectRepository must not be null");
    }

    @Override
    public List<Project> listProject() {
        try {
            // 限制最大返回数量，避免全表查询拖垮性能
            Pageable limit = PageRequest.of(0, MAX_LIST_SIZE, Sort.by(Sort.Direction.DESC, "id"));
            return projectRepository.findAll(limit).getContent();
        } catch (Exception e) {
            throw new RuntimeException("Failed to list projects", e);
        }
    }

    @Override
    public Page<Project> listProject(Pageable pageable) {
        requireNonNull(pageable, "pageable must not be null");
        try {
            // 前台接口自动过滤掉 type=0（不展示）的项目
            return projectRepository.findAll(
                    (Specification<Project>) (root, cq, cb) -> {
                        List<Predicate> predicates = new ArrayList<>();
                        predicates.add(cb.notEqual(root.get("type"), 0));
                        cq.where(predicates.toArray(new Predicate[0]));
                        return null;
                    }, pageable);
        } catch (Exception e) {
            throw new RuntimeException("Failed to list projects with pageable", e);
        }
    }

    @Override
    public List<Project> listRecommendProjectTop(Integer size) {
        requireNonNull(size, "size must not be null");
        if (size <= 0) {
            throw new IllegalArgumentException("size must be greater than 0");
        }
        try {
            Sort sort = Sort.by(Sort.Direction.DESC, "id");
            Pageable pageable = PageRequest.of(0, size, sort);
            return projectRepository.findAll(
                    (Specification<Project>) (root, cq, cb) -> {
                        List<Predicate> predicates = new ArrayList<>();
                        predicates.add(cb.equal(root.get("recommend"), true));
                        predicates.add(cb.equal(root.get("published"), true));
                        cq.where(predicates.toArray(new Predicate[0]));
                        return null;
                    }, pageable).getContent();
        } catch (Exception e) {
            throw new RuntimeException("Failed to list recommend projects with size: " + size, e);
        }
    }

    @Override
    public List<Project> listProjectByType(Integer type) {
        requireNonNull(type, "type must not be null");
        try {
            return projectRepository.findAll(
                    (Specification<Project>) (root, cq, cb) -> {
                        List<Predicate> predicates = new ArrayList<>();
                        predicates.add(cb.equal(root.get("type"), type));
                        // 同时过滤掉 type=0 的项目
                        predicates.add(cb.notEqual(root.get("type"), 0));
                        cq.where(predicates.toArray(new Predicate[0]));
                        return null;
                    });
        } catch (Exception e) {
            throw new RuntimeException("Failed to list projects by type: " + type, e);
        }
    }

    @Override
    public Page<Project> listProjectByType(Integer type, Pageable pageable) {
        requireNonNull(type, "type must not be null");
        requireNonNull(pageable, "pageable must not be null");
        try {
            return projectRepository.findAll(
                    (Specification<Project>) (root, cq, cb) -> {
                        List<Predicate> predicates = new ArrayList<>();
                        predicates.add(cb.equal(root.get("type"), type));
                        // 同时过滤掉 type=0 的项目
                        predicates.add(cb.notEqual(root.get("type"), 0));
                        cq.where(predicates.toArray(new Predicate[0]));
                        return null;
                    }, pageable);
        } catch (Exception e) {
            throw new RuntimeException("Failed to list projects by type with pageable: " + type, e);
        }
    }

    @Override
    public Project getProject(Long id) {
        requireNonNull(id, "project id must not be null");
        try {
            Project project = projectRepository.findById(id)
                    .orElseThrow(() -> new EntityNotFoundException("Project not found with id: " + id));
            if (!Boolean.TRUE.equals(project.getPublished())) {
                throw new EntityNotFoundException("Project not found with id: " + id);
            }
            return project;
        } catch (EntityNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to get project with id: " + id, e);
        }
    }

    @Override
    public Page<Project> listProject(String query, Pageable pageable) {
        requireNonNull(query, "query must not be null");
        requireNonNull(pageable, "pageable must not be null");
        try {
            String searchKeyword = query.trim();
            return projectRepository.findAll(
                    (Specification<Project>) (root, cq, cb) -> {
                        List<Predicate> predicates = new ArrayList<>();
                        // 按标题、内容、技术栈搜索
                        Predicate titlePredicate = cb.like(root.get("title"), "%" + searchKeyword + "%");
                        Predicate contentPredicate = cb.like(root.get("content"), "%" + searchKeyword + "%");
                        Predicate techsPredicate = cb.like(root.get("techs"), "%" + searchKeyword + "%");
                        Predicate searchPredicate = cb.or(titlePredicate, contentPredicate, techsPredicate);
                        predicates.add(searchPredicate);
                        // 过滤掉 type=0（不展示）的项目
                        predicates.add(cb.notEqual(root.get("type"), 0));
                        cq.where(predicates.toArray(new Predicate[0]));
                        return null;
                    }, pageable);
        } catch (Exception e) {
            throw new RuntimeException("Failed to search projects with query: " + query, e);
        }
    }

    @Override
    public void deleteProject(Long id) {
        // 校验id非空
        Objects.requireNonNull(id, "id must not be null");
        try {
            projectRepository.deleteById(id);
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete project with id: " + id, e);
        }
    }

    @Override
    public Project saveProject(Project project) {
        // 校验project非空
        Objects.requireNonNull(project, "project must not be null");
        try {
            return projectRepository.save(project);
        } catch (Exception e) {
            throw new RuntimeException("Failed to save project", e);
        }
    }

    @Override
    public Project updateProject(Long id, Project project) {
        // 校验参数非空
        Objects.requireNonNull(id, "id must not be null");
        Objects.requireNonNull(project, "project must not be null");

        try {
            Project p = projectRepository.getReferenceById(id);
            // 校验查询结果非空
            Objects.requireNonNull(p, "Project not found with id: " + id);

            BeanUtils.copyProperties(project, p, MyBeanUtils.getNullPropertyNames(project));
            return projectRepository.save(p);
        } catch (Exception e) {
            throw new RuntimeException("Failed to update project with id: " + id, e);
        }
    }

    @Override
    @Transactional
    public Boolean changeRecommend(Long Id, Boolean recommend) {
        requireNonNull(Id, "project id must not be null");
        requireNonNull(recommend, "recommend flag must not be null");
        try {
            int affectedRows = projectRepository.updateRecommend(Id, recommend);
            return affectedRows > 0;
        } catch (Exception e) {
            throw new RuntimeException("Error changing recommend status for project: " + Id, e);
        }
    }

    @Override
    @Transactional
    public Boolean changePublished(Long id, Boolean published) {
        requireNonNull(id, "project id must not be null");
        requireNonNull(published, "published flag must not be null");
        try {
            int affectedRows = projectRepository.updatePublished(id, published);
            return affectedRows > 0;
        } catch (Exception e) {
            throw new RuntimeException("Failed to change published status for project: " + id, e);
        }
    }

    @Override
    public List<Project> listPublishedProject() {
        try {
            return projectRepository.findByPublishedTrue();
        } catch (Exception e) {
            throw new RuntimeException("Failed to list published projects", e);
        }
    }

    @Override
    public Page<Project> listPublishedProject(Pageable pageable) {
        requireNonNull(pageable, "pageable must not be null");
        try {
            return projectRepository.findAll(
                    (Specification<Project>) (root, cq, cb) -> {
                        List<Predicate> predicates = new ArrayList<>();
                        predicates.add(cb.equal(root.get("published"), true));
                        predicates.add(cb.notEqual(root.get("type"), 0));
                        cq.where(predicates.toArray(new Predicate[0]));
                        return null;
                    }, pageable);
        } catch (Exception e) {
            throw new RuntimeException("Failed to list published projects with pageable", e);
        }
    }

    @Override
    public List<Project> listPublishedProjectByType(Integer type) {
        requireNonNull(type, "type must not be null");
        try {
            return projectRepository.findAll(
                    (Specification<Project>) (root, cq, cb) -> {
                        List<Predicate> predicates = new ArrayList<>();
                        predicates.add(cb.equal(root.get("published"), true));
                        predicates.add(cb.equal(root.get("type"), type));
                        predicates.add(cb.notEqual(root.get("type"), 0));
                        cq.where(predicates.toArray(new Predicate[0]));
                        return null;
                    });
        } catch (Exception e) {
            throw new RuntimeException("Failed to list published projects by type: " + type, e);
        }
    }

    @Override
    public Page<Project> listPublishedProjectByType(Integer type, Pageable pageable) {
        requireNonNull(type, "type must not be null");
        requireNonNull(pageable, "pageable must not be null");
        try {
            return projectRepository.findAll(
                    (Specification<Project>) (root, cq, cb) -> {
                        List<Predicate> predicates = new ArrayList<>();
                        predicates.add(cb.equal(root.get("published"), true));
                        predicates.add(cb.equal(root.get("type"), type));
                        predicates.add(cb.notEqual(root.get("type"), 0));
                        cq.where(predicates.toArray(new Predicate[0]));
                        return null;
                    }, pageable);
        } catch (Exception e) {
            throw new RuntimeException("Failed to list published projects by type with pageable: " + type, e);
        }
    }

    @Override
    public Long count() {
        try {
            return projectRepository.count();
        } catch (Exception e) {
            throw new RuntimeException("Failed to count projects", e);
        }
    }

    @Override
    public Long countPublished() {
        try {
            return projectRepository.countByPublishedTrue();
        } catch (Exception e) {
            throw new RuntimeException("Failed to count published projects", e);
        }
    }

    @Override
    public Page<Project> listPublishedProject(String query, Pageable pageable) {
        requireNonNull(query, "query must not be null");
        requireNonNull(pageable, "pageable must not be null");
        try {
            String searchKeyword = query.trim();
            return projectRepository.findAll(
                    (Specification<Project>) (root, cq, cb) -> {
                        List<Predicate> predicates = new ArrayList<>();
                        predicates.add(cb.equal(root.get("published"), true));
                        Predicate titlePredicate = cb.like(root.get("title"), "%" + searchKeyword + "%");
                        Predicate contentPredicate = cb.like(root.get("content"), "%" + searchKeyword + "%");
                        Predicate techsPredicate = cb.like(root.get("techs"), "%" + searchKeyword + "%");
                        Predicate searchPredicate = cb.or(titlePredicate, contentPredicate, techsPredicate);
                        predicates.add(searchPredicate);
                        predicates.add(cb.notEqual(root.get("type"), 0));
                        cq.where(predicates.toArray(new Predicate[0]));
                        return null;
                    }, pageable);
        } catch (Exception e) {
            throw new RuntimeException("Failed to search published projects with query: " + query, e);
        }
    }
}