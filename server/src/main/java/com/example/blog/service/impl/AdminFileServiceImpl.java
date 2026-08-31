package com.example.blog.service.impl;

import com.example.blog.service.AdminFileService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AdminFileServiceImpl implements AdminFileService {

    private static final Logger logger = LoggerFactory.getLogger(AdminFileServiceImpl.class);

    private static final String ESSAY_NAMESPACE = "blog/essay";
    private static final String DELETE_ENDPOINT = "/delete";

    private final RestTemplate restTemplate;

    @Value("${file.service.base-url:https://hanphone.top}")
    private String fileServiceBaseUrl;

    @Value("${internal.api.key:}")
    private String internalApiKey;

    public AdminFileServiceImpl(RestTemplateBuilder restTemplateBuilder) {
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofSeconds(10))
                .setReadTimeout(Duration.ofSeconds(10))
                .build();
    }

    @Override
    public boolean isManagedEssayFileUrl(String url) {
        String relativePath = extractRelativePath(url);
        return relativePath != null
                && (relativePath.equals(ESSAY_NAMESPACE) || relativePath.startsWith(ESSAY_NAMESPACE + "/"));
    }

    @Override
    public void deleteEssayFiles(List<String> urls) {
        if (urls == null || urls.isEmpty()) {
            return;
        }

        Set<String> directories = new LinkedHashSet<>();
        int deletedCount = 0;

        for (String url : urls) {
            String relativePath = extractRelativePath(url);
            if (relativePath == null) {
                continue;
            }
            if (deletePath(relativePath, false)) {
                deletedCount++;
            }
            int lastSlash = relativePath.lastIndexOf('/');
            if (lastSlash > ESSAY_NAMESPACE.length()) {
                directories.add(relativePath.substring(0, lastSlash));
            }
        }

        for (String directory : directories) {
            deletePath(directory, false);
        }

        if (deletedCount > 0) {
            logger.info("随笔文件回收完成，共删除 {} 个物理文件", deletedCount);
        }
    }

    /**
     * 从 URL 中解析出文件服务上传根目录下的相对路径（不含开头斜杠）
     * 兼容整段编码（blog%2Fessay）与按段编码（blog/essay/标题）两种历史格式
     */
    private String extractRelativePath(String url) {
        if (url == null || url.isBlank()) {
            return null;
        }
        try {
            URI uri = new URI(url.trim());
            String host = uri.getHost();
            String rawPath = uri.getRawPath();
            if (rawPath == null || rawPath.isEmpty()) {
                return null;
            }
            if (host != null) {
                URI baseUri = new URI(fileServiceBaseUrl.trim());
                String baseHost = baseUri.getHost();
                if (baseHost == null || !host.equalsIgnoreCase(baseHost)) {
                    return null;
                }
            }
            if (rawPath.startsWith("/")) {
                rawPath = rawPath.substring(1);
            }
            if (rawPath.isEmpty()) {
                return null;
            }
            return Arrays.stream(rawPath.split("/"))
                    .map(segment -> decodeSegment(segment))
                    .collect(Collectors.joining("/"));
        } catch (Exception e) {
            logger.warn("解析文件URL失败，跳过删除: {}", url);
            return null;
        }
    }

    /**
     * 百分号解码单个路径段，将 + 还原为 %2B 避免被误判为空格
     */
    private String decodeSegment(String segment) {
        return URLDecoder.decode(segment.replace("+", "%2B"), StandardCharsets.UTF_8);
    }

    /**
     * 调用 admin-file 的 /delete 接口删除文件或目录
     *
     * @param relativePath 上传根目录下的相对路径，如 blog/essay/标题/a.jpg
     * @param recursive    目录删除时是否递归
     * @return 是否删除成功（目标不存在视为成功）
     */
    private boolean deletePath(String relativePath, boolean recursive) {
        if (internalApiKey == null || internalApiKey.isBlank()) {
            logger.warn("未配置 internal.api.key，跳过物理文件删除: {}", relativePath);
            return false;
        }
        try {
            int lastSlash = relativePath.lastIndexOf('/');
            if (lastSlash < 0) {
                return false;
            }
            String namespace = relativePath.substring(0, lastSlash);
            String name = relativePath.substring(lastSlash + 1);
            if (namespace.isEmpty() || name.isEmpty()) {
                return false;
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-internal-key", internalApiKey);

            Map<String, Object> body = new HashMap<>();
            body.put("name", name);
            body.put("namespace", namespace);
            if (recursive) {
                body.put("recursive", true);
            }

            String url = fileServiceBaseUrl.replaceAll("/+$", "") + DELETE_ENDPOINT;
            ResponseEntity<String> response = restTemplate.exchange(
                    URI.create(url),
                    HttpMethod.DELETE,
                    new HttpEntity<>(body, headers),
                    String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                logger.info("文件服务删除成功: {}", relativePath);
                return true;
            }
            return false;
        } catch (RestClientResponseException e) {
            if (e.getStatusCode().value() == 404) {
                logger.info("文件服务中目标不存在，视为删除成功: {}", relativePath);
                return true;
            }
            logger.warn("文件服务删除失败({}): {}", e.getStatusCode().value(), relativePath);
            return false;
        } catch (Exception e) {
            logger.warn("文件服务删除异常: {}", relativePath, e);
            return false;
        }
    }
}
