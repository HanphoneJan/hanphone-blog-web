package com.example.blog.po;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;

import java.util.Date;

/**
 * MCP 服务器对外 API 密钥。
 * 用于外部 AI Agent 通过 MCP server 操作博客；每个密钥与管理员用户绑定，可由管理员在 /admin/personal 页面管理。
 * 同一用户可持有多个密钥（不同设备 / Agent），支持启停、轮转。
 * 密钥原文（keyValue）仅在创建 / 轮转时返回一次，列表和详情接口永不返回。
 */
@Data
@Entity
@Table(name = "t_mcp_api_key")
@JsonIgnoreProperties(value = { "hibernateLazyInitializer" })
public class McpApiKey {

    @Id
    @GeneratedValue
    private Long id;

    @Column(nullable = false, length = 64)
    private String name;

    /**
     * 真实密钥（32 hex）。仅在创建 / 轮转时一次性返回，
     * 列表 / 详情接口通过 @JsonIgnore 永不序列化。
     */
    @JsonIgnore
    @Column(name = "key_value", nullable = false, length = 64, unique = true)
    private String keyValue;

    /** 密钥前 8 位，用于列表里让用户识别是哪把 key */
    @Column(nullable = false, length = 16)
    private String prefix;

    private boolean active = true;

    @Temporal(TemporalType.TIMESTAMP)
    private Date createTime;

    @Temporal(TemporalType.TIMESTAMP)
    private Date updateTime;

    @Temporal(TemporalType.TIMESTAMP)
    private Date lastUsedAt;

    @ManyToOne
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({ "blogs", "email", "loginProvince", "loginCity", "loginLat", "loginLng",
            "isOnline", "createTime", "updateTime", "lastLoginTime", "githubId", "googleId", "oauthProvider",
            "nickname" })
    private User user;

    @PrePersist
    protected void onCreate() {
        this.createTime = new Date();
        this.updateTime = new Date();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updateTime = new Date();
    }
}
