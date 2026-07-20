package com.example.blog.web;

import com.example.blog.constants.PaginationConstants;
import com.example.blog.po.Blog;
import com.example.blog.po.Comment;
import com.example.blog.po.Result;
import com.example.blog.po.StatusCode;
import com.example.blog.po.Tag;
import com.example.blog.po.Type;
import com.example.blog.service.BlogService;
import com.example.blog.service.CommentService;
import com.example.blog.service.TagService;
import com.example.blog.service.TypeService;
import com.example.blog.util.InternalKeyVerifier;
import com.example.blog.vo.BlogQuery;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * MCP 内部接口 — 博客/分类/标签/评论
 *
 * 鉴权方式：请求头 X-Internal-Key（与 InternalApiController 同一密钥）
 * 这些接口不经过 TokenInterceptor，供 MCP server 等服务端调用
 */
@RestController
@RequestMapping("/internal/mcp")
public class McpBlogApiController {

    private final BlogService blogService;
    private final TypeService typeService;
    private final TagService tagService;
    private final CommentService commentService;
    private final InternalKeyVerifier keyVerifier;

    public McpBlogApiController(BlogService blogService, TypeService typeService, TagService tagService,
                                CommentService commentService, InternalKeyVerifier keyVerifier) {
        this.blogService = blogService;
        this.typeService = typeService;
        this.tagService = tagService;
        this.commentService = commentService;
        this.keyVerifier = keyVerifier;
    }

    // ========== 博客 ==========

    /**
     * 博客列表（含未发布草稿），逻辑同 admin/getBlogList
     */
    @PostMapping("/blogs/list")
    public Result<Page<Blog>> getBlogList(@RequestBody Map<String, Object> para,
                                          @RequestHeader(value = "X-Internal-Key", defaultValue = "") String key) {
        if (!keyVerifier.verify(key)) {
            return unauthorized();
        }
        int pageNum = para.get("pagenum") instanceof Number ? ((Number) para.get("pagenum")).intValue() : 1;
        int pageSize = para.get("pagesize") instanceof Number ? ((Number) para.get("pagesize")).intValue()
                : PaginationConstants.DEFAULT_PAGE_SIZE;

        if (pageSize > PaginationConstants.MAX_PAGE_SIZE) {
            pageSize = PaginationConstants.MAX_PAGE_SIZE;
        }
        if (pageSize < PaginationConstants.MIN_PAGE_SIZE) {
            pageSize = PaginationConstants.DEFAULT_PAGE_SIZE;
        }
        if (pageNum < 1) {
            pageNum = 1;
        }

        BlogQuery blogQuery = new BlogQuery();
        if (para.get("typeId") != null) {
            blogQuery.setTypeId(Long.valueOf(para.get("typeId").toString()));
        }
        blogQuery.setTitle((String) para.get("title"));
        Sort sort = Sort.by(Sort.Direction.DESC, "createTime");
        Pageable pageable = PageRequest.of(pageNum - 1, pageSize, sort);
        return new Result<>(true, StatusCode.OK, "获取博客列表成功", blogService.listBlog(pageable, blogQuery));
    }

    /**
     * 博客详情（不增加阅读量，含草稿）
     */
    @GetMapping("/blogs/{id}")
    public Result<Blog> getBlog(@PathVariable Long id,
                                @RequestHeader(value = "X-Internal-Key", defaultValue = "") String key) {
        if (!keyVerifier.verify(key)) {
            return unauthorized();
        }
        Blog blog = blogService.getBlog(id);
        if (blog == null) {
            return new Result<>(false, StatusCode.ERROR, "博客不存在", null);
        }
        return new Result<>(true, StatusCode.OK, "获取博客成功", blog);
    }

    /**
     * 创建或更新博客，逻辑同 admin/blogs
     */
    @PostMapping("/blogs")
    public Result<Void> post(@RequestBody Map<String, Blog> para,
                             @RequestHeader(value = "X-Internal-Key", defaultValue = "") String key) {
        if (!keyVerifier.verify(key)) {
            return unauthorized();
        }
        Blog blog = para.get("blog");
        if (blog == null) {
            return new Result<>(false, StatusCode.ERROR, "请求参数格式错误，缺少blog对象");
        }

        // 处理类型
        if (blog.getType() != null && blog.getType().getId() != null) {
            blog.setType(typeService.getType(blog.getType().getId()));
        }

        // 如果是更新操作，需要先获取原始博客
        if (blog.getId() != null) {
            Blog existingBlog = blogService.getBlog(blog.getId());
            if (existingBlog == null) {
                return new Result<>(false, StatusCode.ERROR, "博客不存在");
            }

            // 保存原始标签列表，用于后续处理
            List<Tag> originalTags = new ArrayList<>(existingBlog.getTags());

            // 清除原始标签与博客的关联
            for (Tag originalTag : originalTags) {
                originalTag.getBlogs().remove(existingBlog);
                tagService.updateTag(originalTag.getId(), originalTag);
            }
        }

        // 处理标签关系
        List<Tag> tags = new ArrayList<>();
        if (blog.getTags() != null) {
            for (Tag tag : blog.getTags()) {
                // 确保标签是从数据库中获取的托管状态
                Tag managedTag = tagService.getTag(tag.getId());
                if (managedTag != null) {
                    tags.add(managedTag);
                    // 从标签角度建立关联
                    if (!managedTag.getBlogs().contains(blog)) {
                        managedTag.getBlogs().add(blog);
                        tagService.updateTag(managedTag.getId(), managedTag);
                    }
                }
            }
        }

        // 设置处理后的标签列表
        blog.setTags(tags);

        Blog b;
        if (blog.getId() == null) {
            b = blogService.saveBlog(blog);
        } else {
            b = blogService.updateBlog(blog.getId(), blog);
        }

        if (b == null) {
            return new Result<>(false, StatusCode.ERROR, "操作失败");
        }
        return new Result<>(true, StatusCode.OK, "操作成功");
    }

    @DeleteMapping("/blogs/{id}")
    public Result<Void> deleteBlog(@PathVariable Long id,
                                   @RequestHeader(value = "X-Internal-Key", defaultValue = "") String key) {
        if (!keyVerifier.verify(key)) {
            return unauthorized();
        }
        blogService.deleteBlog(id);
        return new Result<>(true, StatusCode.OK, "删除博客成功");
    }

    @PostMapping("/blogs/recommend")
    public Result<Void> recommendBlog(@RequestBody Map<String, Object> para,
                                      @RequestHeader(value = "X-Internal-Key", defaultValue = "") String key) {
        if (!keyVerifier.verify(key)) {
            return unauthorized();
        }
        Object blogIdObj = para.get("blogId");
        if (!(blogIdObj instanceof Number)) {
            return new Result<>(false, StatusCode.ERROR, "blogId必须是数字类型");
        }
        Long blogId = ((Number) blogIdObj).longValue();
        Boolean recommend = (Boolean) para.get("recommend");
        try {
            if (blogService.changeRecommend(blogId, recommend)) {
                return new Result<>(true, StatusCode.OK, "操作成功");
            }
            return new Result<>(false, StatusCode.ERROR, "操作失败");
        } catch (Exception e) {
            return new Result<>(false, StatusCode.ERROR, "操作失败");
        }
    }

    // ========== 分类 ==========

    /**
     * 新增或更新分类，逻辑同 admin/types
     */
    @PostMapping("/types")
    public Result<Type> saveOrUpdateType(@RequestBody Map<String, Object> para,
                                         @RequestHeader(value = "X-Internal-Key", defaultValue = "") String key) {
        if (!keyVerifier.verify(key)) {
            return unauthorized();
        }
        Object typeObj = para.get("type");
        if (!(typeObj instanceof Map)) {
            return new Result<>(false, StatusCode.ERROR, "请求参数格式错误，缺少type对象", null);
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> typeMap = (Map<String, Object>) typeObj;

        Type type = new Type();
        type.setName((String) typeMap.get("name"));
        type.setPic_url((String) typeMap.get("pic_url"));
        type.setColor("blue");
        if (typeMap.get("id") instanceof Number) {
            type.setId(((Number) typeMap.get("id")).longValue());
        }

        if (type.getId() == null) {
            // 新增操作
            Type existingType = typeService.getTypeByName(type.getName());
            if (existingType != null) {
                return new Result<>(false, StatusCode.ERROR, "不能添加重复的分类", null);
            }
            Type savedType = typeService.saveType(type);
            if (savedType == null) {
                return new Result<>(false, StatusCode.ERROR, "新增失败", null);
            }
            return new Result<>(true, StatusCode.OK, "新增成功", savedType);
        } else {
            // 更新操作
            List<Type> typeList = typeService.listByNameExceptSelf(type.getId(), type.getName());
            if (!typeList.isEmpty()) {
                return new Result<>(false, StatusCode.ERROR, "分类名称已存在", null);
            }
            Type updatedType = typeService.updateType(type.getId(), type);
            if (updatedType == null) {
                return new Result<>(false, StatusCode.ERROR, "修改失败", null);
            }
            return new Result<>(true, StatusCode.OK, "修改成功", updatedType);
        }
    }

    @DeleteMapping("/types/{id}")
    public Result<Void> deleteType(@PathVariable Long id,
                                   @RequestHeader(value = "X-Internal-Key", defaultValue = "") String key) {
        if (!keyVerifier.verify(key)) {
            return unauthorized();
        }
        typeService.deleteType(id);
        return new Result<>(true, StatusCode.OK, "删除成功");
    }

    // ========== 标签 ==========

    /**
     * 新增或更新标签，逻辑同 admin/tags
     */
    @PostMapping("/tags")
    public Result<Tag> saveOrUpdateTag(@RequestBody Map<String, Tag> para,
                                       @RequestHeader(value = "X-Internal-Key", defaultValue = "") String key) {
        if (!keyVerifier.verify(key)) {
            return unauthorized();
        }
        Tag tag = para.get("tag");
        if (tag == null) {
            return new Result<>(false, StatusCode.ERROR, "标签信息不能为空", null);
        }

        if (tag.getId() == null) {
            Tag existingTag = tagService.getTagByName(tag.getName());
            if (existingTag != null) {
                return new Result<>(false, StatusCode.ERROR, "标签名称已存在", null);
            }
        } else {
            List<Tag> tagList = tagService.listByNameExceptSelf(tag.getId(), tag.getName());
            if (!tagList.isEmpty()) {
                return new Result<>(false, StatusCode.ERROR, "标签名称已存在", null);
            }
        }

        Tag savedTag = tagService.saveTag(tag);
        if (savedTag == null) {
            return new Result<>(false, StatusCode.ERROR, "操作失败", null);
        }
        return new Result<>(true, StatusCode.OK, "操作成功", savedTag);
    }

    @DeleteMapping("/tags/{id}")
    public Result<Void> deleteTag(@PathVariable Long id,
                                  @RequestHeader(value = "X-Internal-Key", defaultValue = "") String key) {
        if (!keyVerifier.verify(key)) {
            return unauthorized();
        }
        tagService.deleteTag(id);
        return new Result<>(true, StatusCode.OK, "删除成功");
    }

    // ========== 评论 ==========

    /**
     * 全站评论列表（分页，page 从 1 开始），逻辑同 admin/getCommentList
     */
    @GetMapping("/comments")
    public Result<?> getCommentList(@RequestParam(required = false) Integer page,
                                    @RequestParam(required = false) Integer pageSize,
                                    @RequestHeader(value = "X-Internal-Key", defaultValue = "") String key) {
        if (!keyVerifier.verify(key)) {
            return unauthorized();
        }
        if (page != null && pageSize != null) {
            Pageable pageable = PageRequest.of(page - 1, pageSize, Sort.by(Sort.Direction.DESC, "createTime"));
            return new Result<>(true, StatusCode.OK, "获取评论列表成功", commentService.listComment(pageable));
        }
        return new Result<>(true, StatusCode.OK, "获取评论列表成功", commentService.listComment());
    }

    @DeleteMapping("/comments/{id}")
    public Result<Void> deleteComment(@PathVariable Long id,
                                      @RequestHeader(value = "X-Internal-Key", defaultValue = "") String key) {
        if (!keyVerifier.verify(key)) {
            return unauthorized();
        }
        try {
            commentService.deleteComment(id);
            return new Result<>(true, StatusCode.OK, "删除评论成功", null);
        } catch (Exception e) {
            return new Result<>(false, StatusCode.ERROR, "删除评论失败: " + e.getMessage(), null);
        }
    }

    private <T> Result<T> unauthorized() {
        return new Result<>(false, StatusCode.ERROR, "未授权访问", null);
    }
}
