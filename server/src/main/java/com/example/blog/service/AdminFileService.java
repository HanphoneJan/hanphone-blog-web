package com.example.blog.service;

import java.util.List;

/**
 * 文件服务（admin-file）操作接口，用于随笔文件回收等物理文件管理
 */
public interface AdminFileService {

    /**
     * 判断 URL 是否为文件服务托管的随笔文件（blog/essay/ 路径下）
     * 仅此类 URL 才会被物理删除，外链一律跳过
     */
    boolean isManagedEssayFileUrl(String url);

    /**
     * 批量删除随笔文件（按 URL 列表），并尝试清理文件所在空目录
     * 全程 best-effort：单个文件删除失败仅记录日志，不影响其余文件
     *
     * @param urls 随笔文件 URL 列表
     */
    void deleteEssayFiles(List<String> urls);
}
