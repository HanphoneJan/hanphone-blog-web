package com.example.blog.service.impl;

import com.example.blog.constants.CommonConstants;
import com.example.blog.dao.BlogRepository;
import com.example.blog.dao.UserBlogLikeRepository;
import com.example.blog.dao.UserRepository;
import com.example.blog.po.Blog;
import com.example.blog.po.Type;
import com.example.blog.po.User;
import com.example.blog.po.UserBlogLike;
import com.example.blog.service.BlogService;
import com.example.blog.util.MarkdownUtils;
import com.example.blog.util.MyBeanUtils;
import com.example.blog.vo.BlogQuery;
import org.springframework.beans.BeanUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.*;
import jakarta.transaction.Transactional;
import java.util.*;
import java.util.stream.Collectors;

import static java.util.Objects.requireNonNull;

@Service
public class BlogServiceImpl implements BlogService {

    private final BlogRepository blogRepository;
    private final UserRepository userRepository;
    private final UserBlogLikeRepository userBlogLikeRepository;

    public BlogServiceImpl(BlogRepository blogRepository,
            UserBlogLikeRepository userBlogLikeRepository,
            UserRepository userRepository) {
        this.blogRepository = requireNonNull(blogRepository, "blogRepository must not be null");
        this.userRepository = requireNonNull(userRepository, "userRepository must not be null");
        this.userBlogLikeRepository = requireNonNull(userBlogLikeRepository, "userBlogLikeRepository must not be null");
    }

    @Override
    public Blog getBlog(Long id) {
        requireNonNull(id, "blog id must not be null");
        try {
            return blogRepository.getReferenceById(id);
        } catch (EntityNotFoundException e) {
            throw new IllegalArgumentException("Blog not found with id: " + id, e);
        } catch (Exception e) {
            throw new RuntimeException("Error retrieving blog with id: " + id, e);
        }
    }

    @Override
    public Page<Blog> listBlog(Pageable pageable, BlogQuery blog) {
        requireNonNull(pageable, "pageable must not be null");
        requireNonNull(blog, "blog query must not be null");

        try {
            return blogRepository.findAll((Specification<Blog>) (root, cq, cb) -> {
                List<Predicate> predicates = new ArrayList<>();

                if (blog.getTitle() != null && !blog.getTitle().trim().isEmpty()) {
                    predicates.add(cb.like(root.get("title"), "%" + blog.getTitle().trim() + "%"));
                }

                if (blog.getTypeId() != null) {
                    predicates.add(cb.equal(root.<Type>get("type").get("id"), blog.getTypeId()));
                }

                if (blog.getPublished() != null) {
                    predicates.add(cb.equal(root.get("published"), blog.getPublished()));
                }

                cq.where(predicates.toArray(new Predicate[0]));
                return null;
            }, pageable);
        } catch (Exception e) {
            throw new RuntimeException("Error listing blogs with query: " + blog, e);
        }
    }

    @Override
    public Page<Blog> listBlog(Pageable pageable) {
        requireNonNull(pageable, "pageable must not be null");
        try {
            // 前台接口只返回已发布的博客
            BlogQuery blogQuery = new BlogQuery();
            blogQuery.setPublished(true);
            return listBlog(pageable, blogQuery).map(blog -> {
                blog.setContent("");
                blog.setComments(null);
                return blog;
            });
        } catch (Exception e) {
            throw new RuntimeException("Error listing blogs", e);
        }
    }

    @Override
    public Page<Blog> listBlog(Long tagId, Pageable pageable) {
        requireNonNull(tagId, "tag id must not be null");
        requireNonNull(pageable, "pageable must not be null");

        try {
            // 前台接口只返回已发布的博客
            Page<Blog> blogs = blogRepository.findAll(
                    (Specification<Blog>) (root, cq, cb) -> {
                        List<Predicate> predicates = new ArrayList<>();
                        predicates.add(cb.equal(root.join("tags").get("id"), tagId));
                        predicates.add(cb.equal(root.get("published"), true));
                        cq.where(predicates.toArray(new Predicate[0]));
                        return null;
                    }, pageable);

            return blogs.map(blog -> {
                blog.setContent("");
                blog.setComments(null);
                return blog;
            });
        } catch (Exception e) {
            throw new RuntimeException("Error listing blogs with tag id: " + tagId, e);
        }
    }

    @Override
    public Page<Blog> listBlog(String query, Pageable pageable) {
        requireNonNull(query, "query must not be null");
        requireNonNull(pageable, "pageable must not be null");

        try {
            // 前台搜索只返回已发布的博客
            // 搜索范围扩展到标题、描述、内容三个字段
            String searchKeyword = query.trim();

            Page<Blog> blogs = blogRepository.findAll(
                    (Specification<Blog>) (root, cq, cb) -> {
                        List<Predicate> predicates = new ArrayList<>();

                        // 扩展搜索范围：标题、描述、内容
                        Predicate titlePredicate = cb.like(root.get("title"), "%" + searchKeyword + "%");
                        Predicate descriptionPredicate = cb.like(root.get("description"), "%" + searchKeyword + "%");
                        Predicate contentPredicate = cb.like(root.get("content"), "%" + searchKeyword + "%");

                        // 使用 OR 连接多个搜索条件
                        Predicate searchPredicate = cb.or(titlePredicate, descriptionPredicate, contentPredicate);
                        predicates.add(searchPredicate);

                        // 只返回已发布的博客
                        predicates.add(cb.equal(root.get("published"), true));

                        cq.where(predicates.toArray(new Predicate[0]));
                        return null;
                    }, pageable);
            return blogs.map(blog -> {
                blog.setContent("");
                blog.setComments(null);
                return blog;
            });
        } catch (Exception e) {
            throw new RuntimeException("Error searching blogs with query: " + query, e);
        }
    }

    @Override
    public List<Blog> listRecommendBlogTop(Integer size) {
        requireNonNull(size, "size must not be null");
        if (size <= 0) {
            throw new IllegalArgumentException("size must be greater than 0");
        }

        try {
            // 前台推荐只返回已发布的博客
            Sort sort = Sort.by(Sort.Direction.DESC, "createTime");
            Pageable pageable = PageRequest.of(0, size, sort);
            Page<Blog> blogs = blogRepository.findAll(
                    (Specification<Blog>) (root, cq, cb) -> {
                        List<Predicate> predicates = new ArrayList<>();
                        predicates.add(cb.equal(root.get("recommend"), true));
                        predicates.add(cb.equal(root.get("published"), true));
                        cq.where(predicates.toArray(new Predicate[0]));
                        return null;
                    }, pageable);

            return blogs.stream().peek(blog -> {
                blog.setContent("");
                blog.setComments(null);
            }).collect(Collectors.toList());
        } catch (Exception e) {
            throw new RuntimeException("Error listing recommended blogs with size: " + size, e);
        }
    }

    @Transactional
    @Override
    public Blog saveBlog(Blog blog) {
        requireNonNull(blog, "blog must not be null");

        try {
            if (blog.getFlag() == null || blog.getFlag().trim().isEmpty()) {
                blog.setFlag("原创");
            }

            if (blog.getType() != null && (blog.getFirstPicture() == null || blog.getFirstPicture().trim().isEmpty())) {
                blog.setFirstPicture(blog.getType().getPic_url());
            }

            if (blog.getDescription() == null || blog.getDescription().trim().isEmpty()) {
                String content = blog.getContent() != null ? blog.getContent() : "";
                String description = MarkdownUtils.removeMarkdownTags(content);
                int length = Math.min(120, description.length());
                blog.setDescription(description.substring(0, length));
            }

            if (blog.getId() == null) {
                blog.setCreateTime(new Date());
                blog.setUpdateTime(new Date());
                blog.setViews(0);
            } else {
                blog.setUpdateTime(new Date());
            }

            return blogRepository.save(blog);
        } catch (Exception e) {
            throw new RuntimeException("Error saving blog: " + blog, e);
        }
    }

    @Transactional
    @Override
    public Blog updateBlog(Long id, Blog blog) {
        requireNonNull(id, "blog id must not be null");
        requireNonNull(blog, "blog must not be null");

        try {
            Blog b = blogRepository.getReferenceById(id);

            BeanUtils.copyProperties(blog, b, MyBeanUtils.getNullPropertyNames(blog));

            if (b.getType() != null && (b.getFirstPicture() == null || b.getFirstPicture().trim().isEmpty())) {
                b.setFirstPicture(b.getType().getPic_url());
            }

            b.setUpdateTime(new Date());
            return blogRepository.save(b);
        } catch (EntityNotFoundException e) {
            throw new IllegalArgumentException("Blog not found with id: " + id, e);
        } catch (Exception e) {
            throw new RuntimeException("Error updating blog with id: " + id, e);
        }
    }

    @Transactional
    @Override
    public void deleteBlog(Long id) {
        requireNonNull(id, "blog id must not be null");
        try {
            blogRepository.deleteById(id);
        } catch (Exception e) {
            throw new RuntimeException("Error deleting blog with id: " + id, e);
        }
    }

    @Override
    public Blog getAndConvert(Long userId, Long id) {
        requireNonNull(id, "blog id must not be null");
        try {
            Blog blog = blogRepository.getReferenceById(id);
            if (!blog.isPublished()) {
                throw new EntityNotFoundException("Blog not found with id: " + id);
            }
            // 累加访问量
            blog.setViews(blog.getViews() + 1);
            blog = blogRepository.save(blog);
            // 复制属性
            Blog b = new Blog();
            BeanUtils.copyProperties(blog, b);
            String content = b.getContent() != null ? b.getContent() : "";
            b.setContent(content);
            // 如果userId为null，直接默认"未点赞"；否则查询是否点赞
            if (userId != null) {
                Optional<UserBlogLike> existingLike = userBlogLikeRepository.findByUserIdAndBlogId(userId, id);
                b.setLiked(existingLike.isPresent());
            } else {
                // userId为空时，默认未点赞
                b.setLiked(false);
            }
            return b;
        } catch (EntityNotFoundException e) {
            throw new IllegalArgumentException("Blog not found with id: " + id, e);
        } catch (Exception e) {
            throw new RuntimeException("Error converting blog with id: " + id, e);
        }
    }

    @Override
    public Map<String, List<Blog>> archiveBlog() {
        try {
            List<String> years = blogRepository.findGroupYear();
            Map<String, List<Blog>> map = new HashMap<>();

            for (String year : years) {
                if (year != null) {
                    map.put(year, blogRepository.findByYear(year));
                }
            }

            return map;
        } catch (Exception e) {
            throw new RuntimeException("Error archiving blogs", e);
        }
    }

    @Override
    public Long countBlog() {
        try {
            return blogRepository.count();
        } catch (Exception e) {
            throw new RuntimeException("Error counting blogs", e);
        }
    }

    @Override
    public Long countPublishedBlog() {
        try {
            return blogRepository.countByPublishedTrue();
        } catch (Exception e) {
            throw new RuntimeException("Error counting published blogs", e);
        }
    }

    @Override
    public Long countViews() {
        try {
            return blogRepository.countViews();
        } catch (Exception e) {
            throw new RuntimeException("Error counting views", e);
        }
    }

    @Override
    public Long countAppreciate() {
        try {
            return blogRepository.countAppreciate();
        } catch (Exception e) {
            throw new RuntimeException("Error counting appreciations", e);
        }
    }

    @Override
    public Long countLikes() {
        try {
            return blogRepository.countLikes();
        } catch (Exception e) {
            throw new RuntimeException("Error counting likes", e);
        }
    }

    @Override
    public Long countComment() {
        try {
            return blogRepository.countComment();
        } catch (Exception e) {
            throw new RuntimeException("Error counting comments", e);
        }
    }

    @Override
    public List<String> ViewCountByMonth() {
        try {
            return blogRepository.ViewCountByMonth();
        } catch (Exception e) {
            throw new RuntimeException("Error getting view count by month", e);
        }
    }

    @Override
    public List<String> BlogCountByMonth() {
        try {
            return blogRepository.BlogCountByMonth();
        } catch (Exception e) {
            throw new RuntimeException("Error getting blog count by month", e);
        }
    }

    @Override
    public List<String> appreciateCountByMonth() {
        try {
            return blogRepository.appreciateCountByMonth();
        } catch (Exception e) {
            throw new RuntimeException("Error getting appreciation count by month", e);
        }
    }

    @Override
    public List<String> likesCountByMonth() {
        try {
            return blogRepository.likesCountByMonth();
        } catch (Exception e) {
            throw new RuntimeException("Error getting likes count by month", e);
        }
    }

    @Override
    @Transactional
    public Boolean updateLikes(Long userId, Long blogId, boolean isLike) {
        requireNonNull(userId, "user id must not be null");
        requireNonNull(blogId, "blog id must not be null");

        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));

            Blog blog = blogRepository.findById(blogId)
                    .orElseThrow(() -> new EntityNotFoundException("Blog not found with id: " + blogId));

            if (!blog.isPublished()) {
                throw new EntityNotFoundException("Blog not found with id: " + blogId);
            }

            Optional<UserBlogLike> existingLike = userBlogLikeRepository.findByUserIdAndBlogId(userId, blogId);

            if (isLike) {
                if (existingLike.isPresent()) {
                    UserBlogLike like = existingLike.get();
                    like.setIsLike(true);
                    userBlogLikeRepository.save(like);
                } else {
                    UserBlogLike newLike = new UserBlogLike();
                    newLike.setUser(user);
                    newLike.setBlog(blog);
                    newLike.setIsLike(true);
                    userBlogLikeRepository.save(newLike);
                    int affectedRows = blogRepository.updateLikes(blogId, CommonConstants.LIKE_INCREMENT);
                    return affectedRows > 0;
                }
            } else {
                if (existingLike.isPresent()) {
                    userBlogLikeRepository.delete(existingLike.get());
                    int affectedRows = blogRepository.updateLikes(blogId, CommonConstants.LIKE_DECREMENT);
                    return affectedRows > 0;
                }
            }
            return true;
        } catch (EntityNotFoundException e) {
            throw new IllegalArgumentException(e.getMessage(), e);
        } catch (Exception e) {
            throw new RuntimeException("Error updating likes for blog " + blogId + " by user " + userId, e);
        }
    }

    @Override
    @Transactional
    public Boolean changeRecommend(Long blogId, Boolean recommend) {
        requireNonNull(blogId, "blog id must not be null");
        requireNonNull(recommend, "recommend flag must not be null");

        try {
            int affectedRows = blogRepository.updateRecommend(blogId, recommend);
            return affectedRows > 0;
        } catch (Exception e) {
            throw new RuntimeException("Error changing recommend status for blog: " + blogId, e);
        }
    }

    @Override
    public List<Blog> listRandomBlogs(Long excludeId, Integer size) {
        requireNonNull(size, "size must not be null");
        if (size <= 0) {
            throw new IllegalArgumentException("size must be greater than 0");
        }

        try {
            // excludeId 为 null 时使用 -1（通常不存在该ID）
            Long actualExcludeId = excludeId != null ? excludeId : -1L;
            Pageable pageable = PageRequest.of(0, size);
            List<Blog> blogs = blogRepository.findRandomBlogs(actualExcludeId, pageable);
            blogs.forEach(blog -> {
                blog.setContent("");
                blog.setComments(null);
            });
            return blogs;
        } catch (Exception e) {
            throw new RuntimeException("Error listing random blogs excluding id: " + excludeId, e);
        }
    }

    @Override
    public Blog getPreviousBlog(Long id) {
        requireNonNull(id, "blog id must not be null");
        try {
            Pageable pageable = PageRequest.of(0, 1);
            List<Blog> blogs = blogRepository.findPreviousBlog(id, pageable);
            if (blogs.isEmpty()) {
                return null;
            }
            Blog blog = blogs.get(0);
            blog.setContent("");
            blog.setComments(null);
            return blog;
        } catch (Exception e) {
            throw new RuntimeException("Error getting previous blog for id: " + id, e);
        }
    }

    @Override
    public Blog getNextBlog(Long id) {
        requireNonNull(id, "blog id must not be null");
        try {
            Pageable pageable = PageRequest.of(0, 1);
            List<Blog> blogs = blogRepository.findNextBlog(id, pageable);
            if (blogs.isEmpty()) {
                return null;
            }
            Blog blog = blogs.get(0);
            blog.setContent("");
            blog.setComments(null);
            return blog;
        } catch (Exception e) {
            throw new RuntimeException("Error getting next blog for id: " + id, e);
        }
    }
}