package com.example.blog.service;

import com.example.blog.po.McpApiKey;
import com.example.blog.po.User;

import java.util.List;
import java.util.Optional;

public interface McpApiKeyService {

    List<McpApiKey> listByUser(User user);

    Optional<McpApiKey> findById(Long id);

    /**
     * 创建一个新密钥，持久化并返回。
     * 调用方应在响应中把 {@code McpApiKey#getKeyValue()} 一次性返回给用户。
     */
    McpApiKey create(User user, String name);

    /**
     * 轮转密钥：为现有 key 重新生成 keyValue，并返回。
     * 调用方应在响应中把新 keyValue 一次性返回给用户。
     */
    McpApiKey regenerate(Long id);

    /** 启用或禁用密钥 */
    McpApiKey setActive(Long id, boolean active);

    /** 删除密钥（硬删除） */
    void delete(Long id);

    /**
     * 校验 bearer 密钥（来自 MCP server）。
     * 成功时自动更新 lastUsedAt。
     */
    Optional<McpApiKey> verify(String keyValue);
}
