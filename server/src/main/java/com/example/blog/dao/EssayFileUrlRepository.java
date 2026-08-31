package com.example.blog.dao;

import com.example.blog.po.EssayFileUrl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EssayFileUrlRepository extends JpaRepository<EssayFileUrl, Long>{
    // 根据随笔ID查询关联的文件URL列表（按插入顺序排序，保证前端手动排序生效）
    @Query("select f from EssayFileUrl f where f.essay.id = :essayId order by f.id asc")
    List<EssayFileUrl> getEssayFileUrlByEssay_Id(@Param("essayId") Long essayId);
    // 批量根据随笔ID列表查询关联的文件URL列表，避免 N+1（按随笔与插入顺序排序）
    @Query("select f from EssayFileUrl f where f.essay.id in :essayIds order by f.essay.id asc, f.id asc")
    List<EssayFileUrl> findByEssay_IdIn(@Param("essayIds") List<Long> essayIds);
    // 根据随笔ID删除所有关联的文件URL记录
    void deleteByEssay_Id(Long essayId);
    //过 essay 对象（@ManyToOne）关联 Essay，则需遵循 JPA “关联属性。目标属性” 的命名规则，将方法名从 deleteByEssayId 改为 deleteByEssay_Id
}
