package com.example.blog.dao;

import com.example.blog.po.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;


@Repository
public interface ProjectRepository extends JpaRepository<Project, Long>, JpaSpecificationExecutor<Project> {
    @Modifying
    @Query("UPDATE Project e SET e.recommend = :recommend WHERE e.id = :id")
    int updateRecommend(@Param("id") Long id, @Param("recommend") boolean recommend);

    @Query("select p from Project p where p.recommend = true")
    List<Project> findTop(Pageable pageable);

    @Modifying
    @Query("UPDATE Project p SET p.published = :published WHERE p.id = :id")
    int updatePublished(@Param("id") Long id, @Param("published") boolean published);

    List<Project> findByPublishedTrue();

    Page<Project> findByPublishedTrue(Pageable pageable);

    long countByPublishedTrue();
}
