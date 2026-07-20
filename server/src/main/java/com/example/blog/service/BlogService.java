package com.example.blog.service;

import com.example.blog.po.Blog;
import com.example.blog.vo.BlogQuery;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.Map;

public interface BlogService {
//    根据id查询
    Blog getBlog(Long id);
//    分页查询
    Page<Blog> listBlog(Pageable pageable, BlogQuery blog);

    Page<Blog> listBlog(Pageable pageable);

    Page<Blog> listBlog(Long tagId,Pageable pageable);

    Page<Blog> listBlog(String query,Pageable pageable);

    List<Blog> listRecommendBlogTop(Integer size);

    /**
     * 随机获取已发布的博客（可选排除指定ID）
     * @param excludeId 要排除的博客ID，为 null 时不排除任何博客
     * @param size 获取数量
     * @return 随机博客列表
     */
    List<Blog> listRandomBlogs(Long excludeId, Integer size);

    Blog saveBlog(Blog blog);

    Blog updateBlog(Long id, Blog blog);

    void deleteBlog(Long id);

    Blog getAndConvert(Long userId,Long id);

    Map<String,List<Blog>> archiveBlog();

    Long countBlog();

    Long countPublishedBlog();

    Long countViews();

    List<String> ViewCountByMonth();

    List<String> BlogCountByMonth();

    List<String> appreciateCountByMonth();
    List<String> likesCountByMonth();

    Long countAppreciate();

    Long countLikes();

    Long countComment();

    /**
     * 更新博客点赞数
     * @return 更新后的博客
     */
    Boolean updateLikes(Long userId, Long blogId, boolean isLike);

    Boolean changeRecommend(Long blogId, Boolean recommend);

    Blog getPreviousBlog(Long id);

    Blog getNextBlog(Long id);
}
