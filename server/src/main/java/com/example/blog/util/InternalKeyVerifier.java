package com.example.blog.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * 内部接口密钥校验器 — 供 /internal/** 系列控制器共用
 * 校验规则与 InternalApiController 一致：请求头 X-Internal-Key 与配置等值比较
 */
@Component
public class InternalKeyVerifier {

    @Value("${internal.api.key:}")
    private String internalApiKey;

    public boolean verify(String key) {
        if (internalApiKey == null || internalApiKey.trim().isEmpty()) {
            return false;
        }
        return internalApiKey.equals(key);
    }
}
