package com.example.blog.web;

import com.example.blog.constants.CommonConstants;
import com.example.blog.po.McpApiKey;
import com.example.blog.po.Message;
import com.example.blog.po.PersonInfo;
import com.example.blog.po.Result;
import com.example.blog.po.StatusCode;
import com.example.blog.service.BlogMonthlyVisitsService;
import com.example.blog.service.BlogService;
import com.example.blog.service.CommentService;
import com.example.blog.service.McpApiKeyService;
import com.example.blog.service.MessageService;
import com.example.blog.service.PersonInfoService;
import com.example.blog.util.InternalKeyVerifier;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * MCP 内部接口 — 留言/个人信息/站点统计
 *
 * 鉴权方式：请求头 X-Internal-Key（与 InternalApiController 同一密钥）
 * 这些接口不经过 TokenInterceptor，供 MCP server 等服务端调用
 */
@RestController
@RequestMapping("/internal/mcp")
public class McpMiscApiController {

    private final MessageService messageService;
    private final PersonInfoService personInfoService;
    private final BlogService blogService;
    private final CommentService commentService;
    private final BlogMonthlyVisitsService blogMonthlyVisitsService;
    private final McpApiKeyService mcpApiKeyService;
    private final InternalKeyVerifier keyVerifier;

    public McpMiscApiController(MessageService messageService, PersonInfoService personInfoService,
                                BlogService blogService, CommentService commentService,
                                BlogMonthlyVisitsService blogMonthlyVisitsService,
                                McpApiKeyService mcpApiKeyService,
                                InternalKeyVerifier keyVerifier) {
        this.messageService = messageService;
        this.personInfoService = personInfoService;
        this.blogService = blogService;
        this.commentService = commentService;
        this.blogMonthlyVisitsService = blogMonthlyVisitsService;
        this.mcpApiKeyService = mcpApiKeyService;
        this.keyVerifier = keyVerifier;
    }

    // ========== MCP 密钥校验（MCP server 专用） ==========

    /**
     * 校验外部 Agent 携带的 Bearer MCP 密钥。
     * 由 MCP server 在收到 Agent 请求时调用，传入 X-Internal-Key 以取得内部访问权限。
     *
     * 响应 data.valid=true 时还附 keyId / keyName / userId 等信息，可用于审计。
     */
    @PostMapping("/verify-key")
    public Result<Map<String, Object>> verifyMcpKey(@RequestBody Map<String, Object> body,
                                                    @RequestHeader(value = "X-Internal-Key", defaultValue = "") String key) {
        if (!keyVerifier.verify(key)) {
            return unauthorized();
        }
        Object mcpKey = body.get("key");
        if (!(mcpKey instanceof String)) {
            return new Result<>(false, StatusCode.ERROR, "参数 key 必须为字符串", null);
        }
        try {
            java.util.Optional<McpApiKey> found = mcpApiKeyService.verify((String) mcpKey);
            Map<String, Object> result = new HashMap<>();
            if (found.isPresent()) {
                McpApiKey apiKey = found.get();
                result.put("valid", true);
                result.put("keyId", apiKey.getId());
                result.put("keyName", apiKey.getName());
                result.put("userId", apiKey.getUser().getId());
                return new Result<>(true, StatusCode.OK, "验证通过", result);
            }
            result.put("valid", false);
            return new Result<>(true, StatusCode.OK, "密钥无效或已停用", result);
        } catch (Exception e) {
            return new Result<>(false, StatusCode.ERROR, "验证失败: " + e.getMessage(), null);
        }
    }

    // ========== 留言 ==========

    /**
     * 以管理员身份发表/回复留言（adminMessage=true），公开接口不具备该能力
     */
    @PostMapping("/messages")
    public Result<Message> postMessage(@RequestBody Map<String, Object> para,
                                       @RequestHeader(value = "X-Internal-Key", defaultValue = "") String key) {
        if (!keyVerifier.verify(key)) {
            return unauthorized();
        }
        try {
            Object messageObj = para.get("message");
            if (!(messageObj instanceof Map)) {
                return new Result<>(false, StatusCode.ERROR, "请求参数格式错误，缺少message对象", null);
            }
            @SuppressWarnings("unchecked")
            Map<String, Object> messageMap = (Map<String, Object>) messageObj;

            String content = (String) messageMap.get("content");
            if (content == null || content.trim().isEmpty()) {
                return new Result<>(false, StatusCode.ERROR, "留言内容不能为空", null);
            }

            String nickname = (String) messageMap.get("nickname");
            String avatar = (String) messageMap.get("avatar");

            long parentId = CommonConstants.DEFAULT_PARENT_ID;
            Object parentIdObj = messageMap.get("parentId");
            if (parentIdObj instanceof Number) {
                parentId = ((Number) parentIdObj).longValue();
            }

            Message message = new Message();
            message.setContent(content);
            message.setNickname(nickname == null || nickname.trim().isEmpty() ? "博主" : nickname);
            message.setAvatar(avatar == null ? "" : avatar);
            message.setAdminMessage(true);

            if (parentId != CommonConstants.DEFAULT_PARENT_ID) {
                message.setParentMessage(messageService.getMessageById(parentId));
            }

            Message newMessage = messageService.saveMessage(message);
            return new Result<>(true, StatusCode.OK, "操作成功", newMessage);
        } catch (Exception e) {
            return new Result<>(false, StatusCode.ERROR, "发表留言失败: " + e.getMessage(), null);
        }
    }

    @DeleteMapping("/messages/{id}")
    public Result<Void> deleteMessage(@PathVariable Long id,
                                      @RequestHeader(value = "X-Internal-Key", defaultValue = "") String key) {
        if (!keyVerifier.verify(key)) {
            return unauthorized();
        }
        try {
            messageService.deleteMessage(id);
            return new Result<>(true, StatusCode.OK, "删除留言成功", null);
        } catch (Exception e) {
            return new Result<>(false, StatusCode.ERROR, "删除留言失败: " + e.getMessage(), null);
        }
    }

    // ========== 个人信息 ==========

    /**
     * 新增或更新个人展示信息，逻辑同 admin/personInfo
     */
    @PostMapping("/personInfo")
    public Result<Void> postPersonInfo(@RequestBody Map<String, PersonInfo> para,
                                       @RequestHeader(value = "X-Internal-Key", defaultValue = "") String key) {
        if (!keyVerifier.verify(key)) {
            return unauthorized();
        }
        PersonInfo personInfo = para.get("personInfo");
        if (personInfo == null) {
            return new Result<>(false, StatusCode.ERROR, "personInfo 参数不能为空");
        }
        PersonInfo p;
        if (personInfo.getId() == null) {
            p = personInfoService.savePersonInfo(personInfo);
        } else {
            p = personInfoService.updatePersonInfo(personInfo.getId(), personInfo);
        }
        if (p == null) {
            return new Result<>(false, StatusCode.ERROR, "操作失败");
        }
        return new Result<>(true, StatusCode.OK, "操作成功");
    }

    @DeleteMapping("/personInfo/{id}")
    public Result<Void> deletePersonInfo(@PathVariable Long id,
                                         @RequestHeader(value = "X-Internal-Key", defaultValue = "") String key) {
        if (!keyVerifier.verify(key)) {
            return unauthorized();
        }
        personInfoService.deletePersonInfo(id);
        return new Result<>(true, StatusCode.OK, "删除个人展示信息成功", null);
    }

    // ========== 统计 ==========

    /**
     * 仪表盘聚合统计（计数 + 按月趋势）
     */
    @GetMapping("/stats/dashboard")
    public Result<Map<String, Object>> dashboard(@RequestParam(required = false) String year,
                                                 @RequestHeader(value = "X-Internal-Key", defaultValue = "") String key) {
        if (!keyVerifier.verify(key)) {
            return unauthorized();
        }
        try {
            Map<String, Object> stats = new HashMap<>();
            stats.put("blogCount", blogService.countBlog());
            stats.put("viewCount", blogService.countViews());
            stats.put("appreciateCount", blogService.countAppreciate());
            stats.put("likesCount", blogService.countLikes());
            stats.put("commentCount", blogService.countComment());
            stats.put("viewCountByMonth", blogService.ViewCountByMonth());
            stats.put("blogCountByMonth", blogService.BlogCountByMonth());
            stats.put("commentCountByMonth", commentService.CommentCountByMonth());
            stats.put("appreciateCountByMonth", blogService.appreciateCountByMonth());
            stats.put("likesCountByMonth", blogService.likesCountByMonth());
            stats.put("visitCountByMonth", blogMonthlyVisitsService.getFormattedMonthlyStats(year));
            return new Result<>(true, StatusCode.OK, "获取站点统计成功", stats);
        } catch (Exception e) {
            return new Result<>(false, StatusCode.ERROR, "获取站点统计失败: " + e.getMessage(), null);
        }
    }

    private <T> Result<T> unauthorized() {
        return new Result<>(false, StatusCode.ERROR, "未授权访问", null);
    }
}
