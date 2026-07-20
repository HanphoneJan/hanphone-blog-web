package com.example.blog.dao;

import com.example.blog.po.Blog;
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
public interface BlogRepository extends JpaRepository<Blog, Long>, JpaSpecificationExecutor<Blog> {

    @Query("select b from Blog b where b.recommend = true")
    List<Blog> findTop(Pageable pageable);

    @Query("select b from Blog b where b.id < ?1 and b.published = true order by b.id desc")
    List<Blog> findPreviousBlog(Long id, Pageable pageable);

    @Query("select b from Blog b where b.id > ?1 and b.published = true order by b.id asc")
    List<Blog> findNextBlog(Long id, Pageable pageable);

    // 修复分组排序：用完整表达式替代别名
    @Query("select function('to_char', b.createTime, 'YYYY') as year " +
            "from Blog b " +
            "where b.published = true " +
            "group by function('to_char', b.createTime, 'YYYY') " +
            "order by function('to_char', b.createTime, 'YYYY') desc")
    List<String> findGroupYear();

    @Query("select b from Blog b where function('to_char', b.createTime, 'YYYY') = ?1 and b.published = true")
    List<Blog> findByYear(String year);

    @Query("select b from Blog b where b.title like ?1 ")
    Page<Blog> findByQuery(String query, Pageable pageable);

    @Query("select sum(b.views) from Blog b")
    Long countViews();

    @Query("select sum(b.appreciation) from Blog b")
    Long countAppreciate();

    @Query("select sum(b.likes) from Blog b")
    Long countLikes();

    @Query("select count(c) from Comment c")
    Long countComment();

    // 修复 1：ViewCountByMonth
    @Query("select function('to_char', b.createTime, 'YYYY-MM') AS MONTH, sum(b.views) as views " +
            "from Blog b " +
            "group by function('to_char', b.createTime, 'YYYY-MM') " +
            "order by function('to_char', b.createTime, 'YYYY-MM') desc")
    List<String> ViewCountByMonth();

    // 修复 2：BlogCountByMonth
    @Query("select function('to_char', b.createTime, 'YYYY-MM') AS MONTH, count(b) as blogs " +
            "from Blog b " +
            "group by function('to_char', b.createTime, 'YYYY-MM') " +
            "order by function('to_char', b.createTime, 'YYYY-MM') desc")
    List<String> BlogCountByMonth();

    // 修复 3：appreciateCountByMonth
    @Query("select function('to_char', b.createTime, 'YYYY-MM') AS MONTH, sum(b.appreciation) as appreciate " +
            "from Blog b " +
            "group by function('to_char', b.createTime, 'YYYY-MM') " +
            "order by function('to_char', b.createTime, 'YYYY-MM') desc")
    List<String> appreciateCountByMonth();

    @Query("select function('to_char', b.createTime, 'YYYY-MM') AS MONTH, sum(b.likes) as likes " +
            "from Blog b " +
            "group by function('to_char', b.createTime, 'YYYY-MM') " +
            "order by function('to_char', b.createTime, 'YYYY-MM') desc")
    List<String> likesCountByMonth();

    @Query("select b from Blog b where b.id <> :excludeId and b.published = true order by function('random')")
    List<Blog> findRandomBlogs(@Param("excludeId") Long excludeId, Pageable pageable);

    @Modifying
    @Query("UPDATE Blog e SET e.likes = e.likes + :delta WHERE e.id = :id")
    int updateLikes(@Param("id") Long id, @Param("delta") int delta);

    @Modifying
    @Query("UPDATE Blog e SET e.recommend = :recommend WHERE e.id = :id")
    int updateRecommend(@Param("id") Long id, @Param("recommend") boolean recommend);

    long countByPublishedTrue();

}