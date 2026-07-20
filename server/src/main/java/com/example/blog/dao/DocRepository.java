package com.example.blog.dao;

import com.example.blog.po.Doc;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocRepository extends JpaRepository<Doc, Long>, JpaSpecificationExecutor<Doc> {

    Optional<Doc> findByDocId(String docId);

    List<Doc> findByRecommendTrue();

    List<Doc> findByRecommendTrue(Pageable pageable);

    List<Doc> findByRecommendTrueAndPublishedTrue();

    List<Doc> findByRecommendTrueAndPublishedTrue(Pageable pageable);

    List<Doc> findByPublishedTrue();

    Page<Doc> findByPublishedTrue(Pageable pageable);

    Page<Doc> findByOrderByViewCountDesc(Pageable pageable);

    Page<Doc> findByPublishedTrueOrderByViewCountDesc(Pageable pageable);

    long countByPublishedTrue();

    Page<Doc> findByOrderByCreateTimeDesc(Pageable pageable);

    @Modifying
    @Query("UPDATE Doc d SET d.viewCount = d.viewCount + 1 WHERE d.docId = :docId")
    int incrementViewCount(@Param("docId") String docId);

    @Modifying
    @Query("UPDATE Doc d SET d.recommend = :recommend WHERE d.id = :id")
    int updateRecommend(@Param("id") Long id, @Param("recommend") boolean recommend);

    @Modifying
    @Query("UPDATE Doc d SET d.published = :published WHERE d.id = :id")
    int updatePublished(@Param("id") Long id, @Param("published") boolean published);
}
