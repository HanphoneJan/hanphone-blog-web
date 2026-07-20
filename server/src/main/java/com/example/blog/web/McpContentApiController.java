package com.example.blog.web;

import com.example.blog.po.Doc;
import com.example.blog.po.Essay;
import com.example.blog.po.EssayFileUrl;
import com.example.blog.po.FriendLink;
import com.example.blog.po.Project;
import com.example.blog.po.Result;
import com.example.blog.po.StatusCode;
import com.example.blog.po.User;
import com.example.blog.service.DocService;
import com.example.blog.service.EssayService;
import com.example.blog.service.FriendLinkService;
import com.example.blog.service.ProjectService;
import com.example.blog.util.InternalKeyVerifier;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * MCP 内部接口 — 随笔/项目/文档/友链
 *
 * 鉴权方式：请求头 X-Internal-Key（与 InternalApiController 同一密钥）
 * 这些接口不经过 TokenInterceptor，供 MCP server 等服务端调用
 */
@RestController
@RequestMapping("/internal/mcp")
public class McpContentApiController {

    private final EssayService essayService;
    private final ProjectService projectService;
    private final DocService docService;
    private final FriendLinkService friendLinkService;
    private final InternalKeyVerifier keyVerifier;

    public McpContentApiController(EssayService essayService, ProjectService projectService,
                                   DocService docService, FriendLinkService friendLinkService,
                                   InternalKeyVerifier keyVerifier) {
        this.essayService = essayService;
        this.projectService = projectService;
        this.docService = docService;
        this.friendLinkService = friendLinkService;
        this.keyVerifier = keyVerifier;
    }

    // ========== 随笔 ==========

    /**
     * 随笔列表（含未发布），逻辑同 admin/essays
     */
    @GetMapping("/essays")
    public Result<?> essays(@RequestParam(required = false) Long userId,
                            @RequestParam(required = false) Integer page,
                            @RequestParam(required = false) Integer pageSize,
                            @RequestHeader(value = "X-Internal-Key", defaultValue = "") String key) {
        if (!keyVerifier.verify(key)) {
            return unauthorized();
        }
        if (page != null && pageSize != null) {
            Sort sort = Sort.by(Sort.Direction.DESC, "createTime");
            Pageable pageable = PageRequest.of(page - 1, pageSize, sort);
            return new Result<>(true, StatusCode.OK, "获取随笔列表成功", essayService.listEssay(userId, pageable));
        }
        return new Result<>(true, StatusCode.OK, "获取随笔列表成功", essayService.listEssay(userId));
    }

    /**
     * 新增或修改随笔，逻辑同 admin/essay
     */
    @PostMapping("/essay")
    public Result<Essay> postEssay(@RequestBody Map<String, Object> para,
                                   @RequestHeader(value = "X-Internal-Key", defaultValue = "") String key) {
        if (!keyVerifier.verify(key)) {
            return unauthorized();
        }
        Object essayObj = para.get("essay");
        if (!(essayObj instanceof Map)) {
            return new Result<>(false, StatusCode.ERROR, "请求参数格式错误");
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> essayMap = (Map<String, Object>) essayObj;

        Essay essay = new Essay();
        essay.setTitle((String) essayMap.get("title"));
        essay.setContent((String) essayMap.get("content"));

        // 获取并设置User关联
        if (essayMap.containsKey("user_id")) {
            try {
                User user = new User();
                user.setId(Long.parseLong(essayMap.get("user_id").toString()));
                essay.setUser(user);
            } catch (NumberFormatException e) {
                return new Result<>(false, StatusCode.ERROR, "用户ID格式错误");
            }
        } else {
            return new Result<>(false, StatusCode.ERROR, "缺少用户ID");
        }

        if (essayMap.get("id") != null) {
            try {
                essay.setId(Long.parseLong(essayMap.get("id").toString()));
            } catch (NumberFormatException e) {
                return new Result<>(false, StatusCode.ERROR, "ID格式错误");
            }
        }

        // 处理文件URL列表
        List<EssayFileUrl> fileUrls = new ArrayList<>();
        if (essayMap.containsKey("essayFileUrls")) {
            Object fileUrlsObj = essayMap.get("essayFileUrls");
            if (fileUrlsObj instanceof List) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> essayFileUrls = (List<Map<String, Object>>) fileUrlsObj;
                for (Map<String, Object> fileUrlMap : essayFileUrls) {
                    String url = (String) fileUrlMap.get("url");
                    String urlType = (String) fileUrlMap.get("urlType");
                    if (url != null && urlType != null) {
                        EssayFileUrl fileUrl = new EssayFileUrl();
                        fileUrl.setUrl(url);
                        fileUrl.setUrlType(urlType);
                        fileUrl.setEssay(essay);
                        fileUrls.add(fileUrl);
                    }
                }
            }
        }

        essay.setEssayFileUrls(fileUrls);
        essay.setLikes(0);

        Essay e;
        if (essay.getId() == null) {
            e = essayService.saveEssay(essay);
        } else {
            e = essayService.updateEssay(essay.getId(), essay);
        }

        if (e == null) {
            return new Result<>(false, StatusCode.ERROR, "操作失败");
        }
        return new Result<>(true, StatusCode.OK, "操作成功", e);
    }

    @DeleteMapping("/essay/{id}")
    public Result<Void> deleteEssay(@PathVariable Long id,
                                    @RequestHeader(value = "X-Internal-Key", defaultValue = "") String key) {
        if (!keyVerifier.verify(key)) {
            return unauthorized();
        }
        essayService.deleteEssay(id);
        return new Result<>(true, StatusCode.OK, "删除随笔成功", null);
    }

    @PostMapping("/essays/recommend")
    public Result<Void> recommendEssay(@RequestBody Map<String, Object> para,
                                       @RequestHeader(value = "X-Internal-Key", defaultValue = "") String key) {
        if (!keyVerifier.verify(key)) {
            return unauthorized();
        }
        Object essayIdObj = para.get("essayId");
        if (!(essayIdObj instanceof Number)) {
            return new Result<>(false, StatusCode.ERROR, "essayId必须是数字类型");
        }
        Long essayId = ((Number) essayIdObj).longValue();
        Boolean recommend = (Boolean) para.get("recommend");
        try {
            if (essayService.changeRecommend(essayId, recommend)) {
                return new Result<>(true, StatusCode.OK, "操作成功");
            }
            return new Result<>(false, StatusCode.ERROR, "操作失败");
        } catch (Exception e) {
            return new Result<>(false, StatusCode.ERROR, "操作失败");
        }
    }

    @PostMapping("/essays/published")
    public Result<Void> publishEssay(@RequestBody Map<String, Object> para,
                                     @RequestHeader(value = "X-Internal-Key", defaultValue = "") String key) {
        if (!keyVerifier.verify(key)) {
            return unauthorized();
        }
        Object essayIdObj = para.get("essayId");
        if (!(essayIdObj instanceof Number)) {
            return new Result<>(false, StatusCode.ERROR, "essayId必须是数字类型");
        }
        Long essayId = ((Number) essayIdObj).longValue();
        Boolean published = (Boolean) para.get("published");
        try {
            if (essayService.changePublished(essayId, published)) {
                return new Result<>(true, StatusCode.OK, "操作成功");
            }
            return new Result<>(false, StatusCode.ERROR, "操作失败");
        } catch (Exception e) {
            return new Result<>(false, StatusCode.ERROR, "操作失败");
        }
    }

    // ========== 项目 ==========

    /**
     * 项目列表（含未发布），逻辑同 admin/projects
     */
    @GetMapping("/projects")
    public Result<?> projects(@RequestParam(required = false) Integer page,
                              @RequestParam(required = false) Integer pageSize,
                              @RequestHeader(value = "X-Internal-Key", defaultValue = "") String key) {
        if (!keyVerifier.verify(key)) {
            return unauthorized();
        }
        if (page != null && pageSize != null) {
            Pageable pageable = PageRequest.of(page - 1, pageSize, Sort.by(Sort.Direction.DESC, "id"));
            return new Result<>(true, StatusCode.OK, "获取项目列表成功", projectService.listProject(pageable));
        }
        return new Result<>(true, StatusCode.OK, "获取项目列表成功", projectService.listProject());
    }

    @PostMapping("/project")
    public Result<Void> postProject(@RequestBody Map<String, Project> para,
                                    @RequestHeader(value = "X-Internal-Key", defaultValue = "") String key) {
        if (!keyVerifier.verify(key)) {
            return unauthorized();
        }
        Project project = para.get("project");
        if (project == null) {
            return new Result<>(false, StatusCode.ERROR, "project 参数不能为空");
        }
        Project p;
        if (project.getId() == null) {
            p = projectService.saveProject(project);
        } else {
            p = projectService.updateProject(project.getId(), project);
        }
        if (p == null) {
            return new Result<>(false, StatusCode.ERROR, "操作失败");
        }
        return new Result<>(true, StatusCode.OK, "操作成功");
    }

    @DeleteMapping("/project/{id}")
    public Result<Void> deleteProject(@PathVariable Long id,
                                      @RequestHeader(value = "X-Internal-Key", defaultValue = "") String key) {
        if (!keyVerifier.verify(key)) {
            return unauthorized();
        }
        projectService.deleteProject(id);
        return new Result<>(true, StatusCode.OK, "删除项目成功");
    }

    @PostMapping("/projects/recommend")
    public Result<Void> recommendProject(@RequestBody Map<String, Object> para,
                                         @RequestHeader(value = "X-Internal-Key", defaultValue = "") String key) {
        if (!keyVerifier.verify(key)) {
            return unauthorized();
        }
        Object projectIdObj = para.get("projectId");
        if (!(projectIdObj instanceof Number)) {
            return new Result<>(false, StatusCode.ERROR, "projectId必须是数字类型");
        }
        Long projectId = ((Number) projectIdObj).longValue();
        Boolean recommend = (Boolean) para.get("recommend");
        try {
            if (projectService.changeRecommend(projectId, recommend)) {
                return new Result<>(true, StatusCode.OK, "操作成功");
            }
            return new Result<>(false, StatusCode.ERROR, "操作失败");
        } catch (Exception e) {
            return new Result<>(false, StatusCode.ERROR, "操作失败");
        }
    }

    @PostMapping("/projects/published")
    public Result<Void> publishProject(@RequestBody Map<String, Object> para,
                                       @RequestHeader(value = "X-Internal-Key", defaultValue = "") String key) {
        if (!keyVerifier.verify(key)) {
            return unauthorized();
        }
        Object projectIdObj = para.get("projectId");
        if (!(projectIdObj instanceof Number)) {
            return new Result<>(false, StatusCode.ERROR, "projectId必须是数字类型");
        }
        Long projectId = ((Number) projectIdObj).longValue();
        Boolean published = (Boolean) para.get("published");
        try {
            if (projectService.changePublished(projectId, published)) {
                return new Result<>(true, StatusCode.OK, "操作成功");
            }
            return new Result<>(false, StatusCode.ERROR, "操作失败");
        } catch (Exception e) {
            return new Result<>(false, StatusCode.ERROR, "操作失败");
        }
    }

    // ========== 文档 ==========

    /**
     * 文档列表（含未发布），逻辑同 admin/docs
     */
    @GetMapping("/docs")
    public Result<List<Doc>> listDocs(@RequestHeader(value = "X-Internal-Key", defaultValue = "") String key) {
        if (!keyVerifier.verify(key)) {
            return unauthorized();
        }
        return new Result<>(true, StatusCode.OK, "获取文件列表成功", docService.listDoc());
    }

    @PostMapping("/doc")
    public Result<Void> postDoc(@RequestBody Map<String, Doc> para,
                                @RequestHeader(value = "X-Internal-Key", defaultValue = "") String key) {
        if (!keyVerifier.verify(key)) {
            return unauthorized();
        }
        Doc doc = para.get("doc");
        if (doc == null) {
            return new Result<>(false, StatusCode.ERROR, "doc 参数不能为空");
        }
        Doc result;
        if (doc.getId() == null) {
            result = docService.saveDoc(doc);
        } else {
            result = docService.updateDoc(doc.getId(), doc);
        }
        if (result == null) {
            return new Result<>(false, StatusCode.ERROR, "操作失败");
        }
        return new Result<>(true, StatusCode.OK, "操作成功");
    }

    @DeleteMapping("/doc/{id}")
    public Result<Void> deleteDoc(@PathVariable Long id,
                                  @RequestHeader(value = "X-Internal-Key", defaultValue = "") String key) {
        if (!keyVerifier.verify(key)) {
            return unauthorized();
        }
        docService.deleteDoc(id);
        return new Result<>(true, StatusCode.OK, "删除文件成功");
    }

    @PostMapping("/docs/recommend")
    public Result<Void> recommendDoc(@RequestBody Map<String, Object> para,
                                     @RequestHeader(value = "X-Internal-Key", defaultValue = "") String key) {
        if (!keyVerifier.verify(key)) {
            return unauthorized();
        }
        Object docIdObj = para.get("docId");
        if (!(docIdObj instanceof Number)) {
            return new Result<>(false, StatusCode.ERROR, "docId 必须是数字类型");
        }
        Long docId = ((Number) docIdObj).longValue();
        Boolean recommend = (Boolean) para.get("recommend");
        try {
            if (docService.changeRecommend(docId, recommend)) {
                return new Result<>(true, StatusCode.OK, "操作成功");
            }
            return new Result<>(false, StatusCode.ERROR, "操作失败");
        } catch (Exception e) {
            return new Result<>(false, StatusCode.ERROR, "操作失败");
        }
    }

    @PostMapping("/docs/published")
    public Result<Void> publishDoc(@RequestBody Map<String, Object> para,
                                   @RequestHeader(value = "X-Internal-Key", defaultValue = "") String key) {
        if (!keyVerifier.verify(key)) {
            return unauthorized();
        }
        Object docIdObj = para.get("docId");
        if (!(docIdObj instanceof Number)) {
            return new Result<>(false, StatusCode.ERROR, "docId 必须是数字类型");
        }
        Long docId = ((Number) docIdObj).longValue();
        Boolean published = (Boolean) para.get("published");
        try {
            if (docService.changePublished(docId, published)) {
                return new Result<>(true, StatusCode.OK, "操作成功");
            }
            return new Result<>(false, StatusCode.ERROR, "操作失败");
        } catch (Exception e) {
            return new Result<>(false, StatusCode.ERROR, "操作失败");
        }
    }

    // ========== 友链 ==========

    /**
     * 友链列表（含未审核），可按 published 筛选
     */
    @GetMapping("/friendLinks")
    public Result<List<FriendLink>> friendLinks(@RequestParam(required = false) Boolean published,
                                                @RequestHeader(value = "X-Internal-Key", defaultValue = "") String key) {
        if (!keyVerifier.verify(key)) {
            return unauthorized();
        }
        if (published != null) {
            return new Result<>(true, StatusCode.OK, "获取友链列表成功", friendLinkService.listByPublished(published));
        }
        return new Result<>(true, StatusCode.OK, "获取友链列表成功", friendLinkService.listAllFriendLinks());
    }

    @PostMapping("/friendLink")
    public Result<Void> postFriendLink(@RequestBody Map<String, FriendLink> para,
                                       @RequestHeader(value = "X-Internal-Key", defaultValue = "") String key) {
        if (!keyVerifier.verify(key)) {
            return unauthorized();
        }
        FriendLink friendLink = para.get("friendLink");
        if (friendLink == null) {
            return new Result<>(false, StatusCode.ERROR, "friendLink 参数不能为空");
        }
        FriendLink p;
        if (friendLink.getId() == null) {
            p = friendLinkService.saveFriendLink(friendLink);
        } else {
            p = friendLinkService.updateFriendLink(friendLink.getId(), friendLink);
        }
        if (p == null) {
            return new Result<>(false, StatusCode.ERROR, "操作失败");
        }
        return new Result<>(true, StatusCode.OK, "操作成功");
    }

    @DeleteMapping("/friendLink/{id}")
    public Result<Void> deleteFriendLink(@PathVariable Long id,
                                         @RequestHeader(value = "X-Internal-Key", defaultValue = "") String key) {
        if (!keyVerifier.verify(key)) {
            return unauthorized();
        }
        friendLinkService.deleteFriendLink(id);
        return new Result<>(true, StatusCode.OK, "删除友链成功");
    }

    @PostMapping("/friendLinks/recommend")
    public Result<Void> recommendFriendLink(@RequestBody Map<String, Object> para,
                                            @RequestHeader(value = "X-Internal-Key", defaultValue = "") String key) {
        if (!keyVerifier.verify(key)) {
            return unauthorized();
        }
        Object friendLinkIdObj = para.get("friendLinkId");
        if (!(friendLinkIdObj instanceof Number)) {
            return new Result<>(false, StatusCode.ERROR, "friendLinkId必须是数字类型");
        }
        Long friendLinkId = ((Number) friendLinkIdObj).longValue();
        Boolean recommend = (Boolean) para.get("recommend");
        try {
            if (friendLinkService.changeRecommend(friendLinkId, recommend)) {
                return new Result<>(true, StatusCode.OK, "操作成功");
            }
            return new Result<>(false, StatusCode.ERROR, "操作失败");
        } catch (Exception e) {
            return new Result<>(false, StatusCode.ERROR, "操作失败");
        }
    }

    /**
     * 修改友链发布状态（审核）
     */
    @PostMapping("/friendLinks/published")
    public Result<Void> publishFriendLink(@RequestBody Map<String, Object> para,
                                          @RequestHeader(value = "X-Internal-Key", defaultValue = "") String key) {
        if (!keyVerifier.verify(key)) {
            return unauthorized();
        }
        Object friendLinkIdObj = para.get("friendLinkId");
        if (!(friendLinkIdObj instanceof Number)) {
            return new Result<>(false, StatusCode.ERROR, "friendLinkId必须是数字类型");
        }
        Long friendLinkId = ((Number) friendLinkIdObj).longValue();
        Boolean published = (Boolean) para.get("published");
        try {
            if (friendLinkService.changePublished(friendLinkId, published)) {
                return new Result<>(true, StatusCode.OK, "操作成功");
            }
            return new Result<>(false, StatusCode.ERROR, "操作失败");
        } catch (Exception e) {
            return new Result<>(false, StatusCode.ERROR, "操作失败");
        }
    }

    private <T> Result<T> unauthorized() {
        return new Result<>(false, StatusCode.ERROR, "未授权访问", null);
    }
}
