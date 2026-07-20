package com.example.blog.dao;

import com.example.blog.po.McpApiKey;
import com.example.blog.po.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface McpApiKeyRepository extends JpaRepository<McpApiKey, Long> {

    List<McpApiKey> findByUserOrderCreateTimeDesc(User user);

    Optional<McpApiKey> findByKeyValueAndActive(String keyValue, boolean active);
}
