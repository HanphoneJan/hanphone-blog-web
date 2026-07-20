package com.example.blog.web.admin;

import com.example.blog.po.McpApiKey;
import com.example.blog.po.Result;
import com.example.blog.po.StatusCode;
import com.example.blog.po.User;
import com.example.blog.service.McpApiKeyService;
import com.example.blog.service.UserService;
import com.example.blog.util.TokenUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * MCP API Key 管理（仅管理员可访问）。
 * 前端位于 /admin/personal 页面的 "MCP 密钥" tab。
 *
 * 注意：密钥明文（keyValue）仅在 create / regenerate 接口的响应里返回一次；
 * 列表接口返回的 McpApiKey 通过 @JsonIgnore 已经屏蔽了 keyValue 字段。
 */
@RestController
@RequestMapping("/admin/mcp-keys")
public class McpKeyController {

    private static final int MAX_KEYS_PER_USER = 10;
    private static final int MAX_NAME_LENGTH = 64;

    private final McpApiKeyService mcpApiKeyService;
    private final UserService userService;

    public McpKeyController(McpApiKeyService mcpApiKeyService, UserService userService) {
        this.mcpApiKeyService = mcpApiKeyService;
        this.userService = userService;
    }

    @GetMapping
    public Result<List<McpApiKey>> list(HttpServletRequest request) {
        User user = currentUser(request);
        if (user == null) {
            return new Result<>(false, StatusCode.LOGINERROR, "未登录", null);
        }
        return new Result<>(true, StatusCode.OK, "获取 MCP 密钥列表成功",
                mcpApiKeyService.listByUser(user));
    }

    /**
     * 创建密钥。响应 data 中含完整的 keyValue（明文），这是唯一一次返回机会。
     */
    @PostMapping
    public Result<Map<String, Object>> create(@RequestBody Map<String, Object> para,
                                              HttpServletRequest request) {
        User user = currentUser(request);
        if (user == null) {
            return new Result<>(false, StatusCode.LOGINERROR, "未登录", null);
        }
        Object nameObj = para.get("name");
        if (!(nameObj instanceof String) || ((String) nameObj).trim().isEmpty()) {
            return new Result<>(false, StatusCode.ERROR, "密钥名称不能为空", null);
        }
        String name = ((String) nameObj).trim();
        if (name.length() > MAX_NAME_LENGTH) {
            return new Result<>(false, StatusCode.ERROR, "密钥名称过长（上限 " + MAX_NAME_LENGTH + "）", null);
        }
        List<McpApiKey> existing = mcpApiKeyService.listByUser(user);
        if (existing.size() >= MAX_KEYS_PER_USER) {
            return new Result<>(false, StatusCode.ERROR,
                    "单个用户最多持有 " + MAX_KEYS_PER_USER + " 个 MCP 密钥，请清理旧密钥后重试", null);
        }
        try {
            McpApiKey key = mcpApiKeyService.create(user, name);
            return new Result<>(true, StatusCode.OK, "密钥创建成功", toDetailMap(key));
        } catch (Exception e) {
            return new Result<>(false, StatusCode.ERROR, "创建失败: " + e.getMessage(), null);
        }
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id, HttpServletRequest request) {
        User user = currentUser(request);
        if (user == null) {
            return new Result<>(false, StatusCode.LOGINERROR, "未登录", null);
        }
        McpApiKey key = mcpApiKeyService.findById(id).orElse(null);
        if (key == null) {
            return new Result<>(false, StatusCode.ERROR, "密钥不存在", null);
        }
        if (!key.getUser().getId().equals(user.getId())) {
            return new Result<>(false, StatusCode.ERROR, "无权操作", null);
        }
        try {
            mcpApiKeyService.delete(id);
            return new Result<>(true, StatusCode.OK, "删除成功");
        } catch (Exception e) {
            return new Result<>(false, StatusCode.ERROR, "删除失败: " + e.getMessage(), null);
        }
    }

    /** 启用 / 停用密钥，body: {"active": true|false} */
    @PostMapping("/{id}/toggle")
    public Result<McpApiKey> toggle(@PathVariable Long id,
                                    @RequestBody Map<String, Object> para,
                                    HttpServletRequest request) {
        User user = currentUser(request);
        if (user == null) {
            return new Result<>(false, StatusCode.LOGINERROR, "未登录", null);
        }
        McpApiKey key = mcpApiKeyService.findById(id).orElse(null);
        if (key == null) {
            return new Result<>(false, StatusCode.ERROR, "密钥不存在", null);
        }
        if (!key.getUser().getId().equals(user.getId())) {
            return new Result<>(false, StatusCode.ERROR, "无权操作", null);
        }
        Object activeObj = para.get("active");
        if (!(activeObj instanceof Boolean)) {
            return new Result<>(false, StatusCode.ERROR, "参数 active 必须为布尔值", null);
        }
        try {
            McpApiKey updated = mcpApiKeyService.setActive(id, (Boolean) activeObj);
            return new Result<>(true, StatusCode.OK, "修改成功", updated);
        } catch (Exception e) {
            return new Result<>(false, StatusCode.ERROR, "修改失败: " + e.getMessage(), null);
        }
    }

    /** 轮转：重新生成密钥原文（响应 data 中含新 keyValue）。 */
    @PostMapping("/{id}/regenerate")
    public Result<Map<String, Object>> regenerate(@PathVariable Long id, HttpServletRequest request) {
        User user = currentUser(request);
        if (user == null) {
            return new Result<>(false, StatusCode.LOGINERROR, "未登录", null);
        }
        McpApiKey key = mcpApiKeyService.findById(id).orElse(null);
        if (key == null) {
            return new Result<>(false, StatusCode.ERROR, "密钥不存在", null);
        }
        if (!key.getUser().getId().equals(user.getId())) {
            return new Result<>(false, StatusCode.ERROR, "无权操作", null);
        }
        try {
            McpApiKey updated = mcpApiKeyService.regenerate(id);
            return new Result<>(true, StatusCode.OK, "密钥已轮转", toDetailMap(updated));
        } catch (Exception e) {
            return new Result<>(false, StatusCode.ERROR, "轮转失败: " + e.getMessage(), null);
        }
    }

    // ========== 私有方法 ==========

    private User currentUser(HttpServletRequest request) {
        String token = request.getHeader("token");
        if (token == null || token.isBlank()) {
            return null;
        }
        token = token.replace("\"", "");
        Long userId = TokenUtil.getUserId(token);
        if (userId == null) {
            return null;
        }
        return userService.findUserById(userId);
    }

    private Map<String, Object> toDetailMap(McpApiKey key) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", key.getId());
        map.put("name", key.getName());
        map.put("key", key.getKeyValue());
        map.put("prefix", key.getPrefix());
        map.put("active", key.isActive());
        map.put("createTime", key.getCreateTime());
        map.put("updateTime", key.getUpdateTime());
        map.put("lastUsedAt", key.getLastUsedAt());
        return map;
    }
}
