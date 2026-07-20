package com.example.blog.web;

import com.example.blog.constants.CommonConstants;
import com.example.blog.constants.PaginationConstants;
import com.example.blog.po.Blog;
import com.example.blog.po.Result;
import com.example.blog.po.StatusCode;
import com.example.blog.po.Tag;
import com.example.blog.po.Type;
import com.example.blog.service.BlogMonthlyVisitsService;
import com.example.blog.service.BlogService;
import com.example.blog.service.DocService;
import com.example.blog.service.EssayService;
import com.example.blog.service.GlobalSearchService;
import com.example.blog.service.MessageService;
import com.example.blog.service.ProjectService;
import com.example.blog.service.TagService;
import com.example.blog.service.TypeService;
import com.example.blog.vo.BlogQuery;
import com.example.blog.vo.SearchResultItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
public class IndexController {

    private final BlogService blogService;
    private final TypeService typeService;
    private final TagService tagService;
    private final BlogMonthlyVisitsService blogMonthlyVisitsService;
    private final EssayService essayService;
    private final ProjectService projectService;
    private final MessageService messageService;
    private final DocService docService;
    private final GlobalSearchService globalSearchService;

    public IndexController(TagService tagService, TypeService typeService, BlogService blogService,
                           BlogMonthlyVisitsService blogMonthlyVisitsService, EssayService essayService,
                           ProjectService projectService, MessageService messageService, DocService docService,
                           GlobalSearchService globalSearchService) {
        this.tagService = tagService;
        this.typeService = typeService;
        this.blogService = blogService;
        this.blogMonthlyVisitsService = blogMonthlyVisitsService;
        this.essayService = essayService;
        this.projectService = projectService;
        this.messageService = messageService;
        this.docService = docService;
        this.globalSearchService = globalSearchService;
    }

    @GetMapping("/blogs")
    public Result<Page<Blog>> getBlogList(@RequestParam String pagenum, @RequestParam String pagesize) {
        int pageNum = Integer.parseInt(pagenum);
        int pageSize = Integer.parseInt(pagesize);

        // 防御性编程：限制分页大小防止内存溢出
        if (pageSize > PaginationConstants.MAX_PAGE_SIZE) {
            pageSize = PaginationConstants.MAX_PAGE_SIZE;
        }
        if (pageSize < PaginationConstants.MIN_PAGE_SIZE) {
            pageSize = PaginationConstants.DEFAULT_PAGE_SIZE;
        }
        if (pageNum < 1) {
            pageNum = 1;
        }

        Sort sort = Sort.by(Sort.Direction.DESC, "createTime");
        Pageable pageable = PageRequest.of(pageNum - 1, pageSize, sort);
        return new Result<>(true, StatusCode.OK, "获取博客列表成功", blogService.listBlog(pageable));
    }

    @GetMapping("/getRecommendBlogList")
    public Result<List<Blog>> getRecommendBlogList() {
        return new Result<>(true, StatusCode.OK, "获取推荐博客成功", blogService.listRecommendBlogTop(PaginationConstants.RECOMMEND_BLOG_SIZE));
    }

    @GetMapping("/blogs/random")
    public Result<List<Blog>> getRandomBlogs(@RequestParam(required = false) Long excludeId, @RequestParam(defaultValue = "3") int size) {
        if (size < 1) {
            size = 3;
        }
        if (size > 10) {
            size = 10;
        }
        return new Result<>(true, StatusCode.OK, "获取随机博客成功", blogService.listRandomBlogs(excludeId, size));
    }

    // 搜索参数最大长度限制
    private static final int MAX_SEARCH_QUERY_LENGTH = 100;
    private static final int DEFAULT_SEARCH_LIMIT = 20;
    private static final int MAX_SEARCH_LIMIT = 50;

    @GetMapping("/search")
    public Result<List<SearchResultItem>> search(@RequestParam String query,
                                                  @RequestParam(required = false, defaultValue = "20") int limit) {
        // 防御性编程：限制搜索查询长度，防止超长搜索词导致内存和性能问题
        if (query == null || query.trim().isEmpty()) {
            return new Result<>(false, StatusCode.ERROR, "搜索关键词不能为空", List.of());
        }
        if (query.length() > MAX_SEARCH_QUERY_LENGTH) {
            return new Result<>(false, StatusCode.ERROR,
                "搜索关键词过长，最多" + MAX_SEARCH_QUERY_LENGTH + "个字符", List.of());
        }
        if (limit < 1) {
            limit = DEFAULT_SEARCH_LIMIT;
        }
        if (limit > MAX_SEARCH_LIMIT) {
            limit = MAX_SEARCH_LIMIT;
        }
        return new Result<>(true, StatusCode.OK, "搜索成功", globalSearchService.search(query, limit));
    }

    @GetMapping("/search/blog")
    public Result<Page<Blog>> searchBlog(@PageableDefault(size = PaginationConstants.DEFAULT_PAGE_SIZE, sort = {"createTime"}, direction = Sort.Direction.DESC) Pageable pageable,
                                         @RequestParam String query) {
        // 防御性编程：限制搜索查询长度，防止超长搜索词导致内存和性能问题
        if (query == null || query.trim().isEmpty()) {
            return new Result<>(false, StatusCode.ERROR, "搜索关键词不能为空", null);
        }
        if (query.length() > MAX_SEARCH_QUERY_LENGTH) {
            return new Result<>(false, StatusCode.ERROR,
                "搜索关键词过长，最多" + MAX_SEARCH_QUERY_LENGTH + "个字符", null);
        }
        return new Result<>(true, StatusCode.OK, "获取搜索博客成功", blogService.listBlog(query, pageable));
    }

    @GetMapping("/blog/{id}")
    public Result<Blog> blog(@PathVariable Long id, @RequestParam(required = false) Long userId) {
        return new Result<>(true, StatusCode.OK, "获取博客成功", blogService.getAndConvert(userId, id));
    }

    @GetMapping("/blog/{id}/prev")
    public Result<Blog> getPreviousBlog(@PathVariable Long id) {
        Blog blog = blogService.getPreviousBlog(id);
        if (blog == null) {
            return new Result<>(true, StatusCode.OK, "没有上一篇博客", null);
        }
        return new Result<>(true, StatusCode.OK, "获取上一篇博客成功", blog);
    }

    @GetMapping("/blog/{id}/next")
    public Result<Blog> getNextBlog(@PathVariable Long id) {
        Blog blog = blogService.getNextBlog(id);
        if (blog == null) {
            return new Result<>(true, StatusCode.OK, "没有下一篇博客", null);
        }
        return new Result<>(true, StatusCode.OK, "获取下一篇博客成功", blog);
    }

    @GetMapping("/types/{id}")
    public Result<Page<Blog>> types(@PageableDefault(size = PaginationConstants.DEFAULT_PAGE_SIZE, sort = {"updateTime"}, direction = Sort.Direction.DESC) Pageable pageable,
                                    @PathVariable Long id) {
        List<Type> types = typeService.listType();
        if (id == CommonConstants.DEFAULT_PARENT_ID && !types.isEmpty()) {
            id = types.get(0).getId();
        }
        BlogQuery blogQuery = new BlogQuery();
        blogQuery.setTypeId(id);
        blogQuery.setPublished(true);
        return new Result<>(true, StatusCode.OK, "获取分类博客列表成功", blogService.listBlog(pageable, blogQuery));
    }

    @GetMapping("tags/{id}")
    public Result<Page<Blog>> tags(@PageableDefault(size = PaginationConstants.DEFAULT_PAGE_SIZE, sort = {"updateTime"}, direction = Sort.Direction.DESC) Pageable pageable,
                                   @PathVariable Long id) {
        List<Tag> tags = tagService.listTag();
        if (id == CommonConstants.DEFAULT_PARENT_ID && !tags.isEmpty()) {
            id = tags.get(0).getId();
        }
        return new Result<>(true, StatusCode.OK, "获取标签博客列表成功", blogService.listBlog(id, pageable));
    }

    @GetMapping("/visit-count")
    public Result<Long> getVisitCount() {
        // 递增访问量并获取更新后的总访问量
        Long totalVisits = blogMonthlyVisitsService.incrementAndGetTotalVisits();
        return new Result<>(true, StatusCode.OK, "获取网站浏览量成功", totalVisits);
    }

    @GetMapping("/site-stats")
    public Result<Map<String, Long>> getSiteStats() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("blogCount", blogService.countPublishedBlog());
        stats.put("essayCount", essayService.countPublished());
        stats.put("projectCount", projectService.countPublished());
        stats.put("messageCount", messageService.count());
        stats.put("docCount", docService.countPublished());
        return new Result<>(true, StatusCode.OK, "获取站点统计成功", stats);
    }
}