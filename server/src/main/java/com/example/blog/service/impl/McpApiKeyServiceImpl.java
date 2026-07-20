package com.example.blog.service.impl;

import com.example.blog.dao.McpApiKeyRepository;
import com.example.blog.po.McpApiKey;
import com.example.blog.po.User;
import com.example.blog.service.McpApiKeyService;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Date;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
public class McpApiKeyServiceImpl implements McpApiKeyService {

    private static final int KEY_BYTES = 32;
    private static final int PREFIX_LEN = 8;

    private final McpApiKeyRepository repository;
    private final SecureRandom random = new SecureRandom();

    public McpApiKeyServiceImpl(McpApiKeyRepository repository) {
        this.repository = Objects.requireNonNull(repository, "repository must not be null");
    }

    @Override
    public List<McpApiKey> listByUser(User user) {
        Objects.requireNonNull(user, "user must not be null");
        try {
            return repository.findByUserOrderByCreateTimeDesc(user);
        } catch (Exception e) {
            throw new RuntimeException("Failed to list mcp api keys", e);
        }
    }

    @Override
    public Optional<McpApiKey> findById(Long id) {
        Objects.requireNonNull(id, "id must not be null");
        try {
            return repository.findById(id);
        } catch (Exception e) {
            throw new RuntimeException("Failed to find mcp api key: " + id, e);
        }
    }

    @Override
    public McpApiKey create(User user, String name) {
        Objects.requireNonNull(user, "user must not be null");
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("密钥名称不能为空");
        }
        try {
            McpApiKey key = new McpApiKey();
            key.setUser(user);
            key.setName(name.trim());
            String generated = randomKey();
            key.setKeyValue(generated);
            key.setPrefix(generated.substring(0, Math.min(PREFIX_LEN, generated.length())));
            key.setActive(true);
            return repository.save(key);
        } catch (Exception e) {
            throw new RuntimeException("Failed to create mcp api key", e);
        }
    }

    @Override
    public McpApiKey regenerate(Long id) {
        Objects.requireNonNull(id, "id must not be null");
        try {
            McpApiKey key = repository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("密钥不存在: " + id));
            String generated = randomKey();
            key.setKeyValue(generated);
            key.setPrefix(generated.substring(0, Math.min(PREFIX_LEN, generated.length())));
            return repository.save(key);
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to regenerate mcp api key: " + id, e);
        }
    }

    @Override
    public McpApiKey setActive(Long id, boolean active) {
        Objects.requireNonNull(id, "id must not be null");
        try {
            McpApiKey key = repository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("密钥不存在: " + id));
            key.setActive(active);
            return repository.save(key);
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to toggle mcp api key: " + id, e);
        }
    }

    @Override
    public void delete(Long id) {
        Objects.requireNonNull(id, "id must not be null");
        try {
            repository.deleteById(id);
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete mcp api key: " + id, e);
        }
    }

    @Override
    public Optional<McpApiKey> verify(String keyValue) {
        if (keyValue == null || keyValue.trim().isEmpty()) {
            return Optional.empty();
        }
        try {
            Optional<McpApiKey> found = repository.findByKeyValueAndActive(keyValue, true);
            if (found.isPresent()) {
                McpApiKey key = found.get();
                key.setLastUsedAt(new Date());
                repository.save(key);
            }
            return found;
        } catch (Exception e) {
            throw new RuntimeException("Failed to verify mcp api key", e);
        }
    }

    private String randomKey() {
        byte[] bytes = new byte[KEY_BYTES];
        random.nextBytes(bytes);
        StringBuilder sb = new StringBuilder(KEY_BYTES * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
