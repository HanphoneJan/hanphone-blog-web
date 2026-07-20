package com.example.blog.service;

import com.example.blog.po.Essay;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface EssayService {
    Essay getEssayById(Long id);

    List<Essay> listEssay(Long userId);

    Page<Essay> listEssay(Long userId, Pageable pageable);

    void deleteEssay(Long id);

    Essay saveEssay(Essay essay);

    Essay updateEssay(Long id,Essay essay);

    /**
     * 更新随笔点赞数
     * @return 更新后的随笔
     */
    Essay updateLikes(Long userId,Long essayId, boolean isLike);
    Boolean changeRecommend(Long essayId, Boolean recommend);

    List<Essay> listPublishedEssay(Long userId);

    Page<Essay> listPublishedEssay(Long userId, Pageable pageable);

    Page<Essay> listPublishedEssay(String query, Pageable pageable);

    Boolean changePublished(Long essayId, Boolean published);

    Essay getEssayDetail(Long userId, Long id);

    Page<Essay> listEssay(String query, Pageable pageable);

    List<Essay> listRecommendEssayTop(Integer size);

    Long count();

    Long countPublished();
}
