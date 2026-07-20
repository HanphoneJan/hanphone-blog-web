package com.example.blog.dao;

import com.example.blog.po.Essay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;


@Repository
public interface EssayRepository extends JpaRepository<Essay,Long>, JpaSpecificationExecutor<Essay> {
    @Query("SELECT e FROM Essay e LEFT JOIN FETCH e.essayFileUrls")
    List<Essay> findAllWithFileUrls();

    @Modifying
    @Query("UPDATE Essay e SET e.likes = e.likes + :delta WHERE e.id = :id")
    int updateLikes(@Param("id") Long id, @Param("delta") int delta);

    @Modifying
    @Query("UPDATE Essay e SET e.recommend = :recommend WHERE e.id = :id")
    int updateRecommend(@Param("id") Long id, @Param("recommend") boolean recommend);

    @Query("select e from Essay e where e.recommend = true")
    List<Essay> findTop(Pageable pageable);

    @Modifying
    @Query("UPDATE Essay e SET e.published = :published WHERE e.id = :id")
    int updatePublished(@Param("id") Long id, @Param("published") boolean published);

    List<Essay> findByPublishedTrue();

    List<Essay> findByPublishedTrue(Pageable pageable);

    long countByPublishedTrue();

}
