package com.example.blog.service;

import com.example.blog.po.Doc;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface DocService {

    List<Doc> listDoc();

    Page<Doc> listDoc(Pageable pageable);

    List<Doc> listPublishedDoc();

    Page<Doc> listPublishedDoc(Pageable pageable);

    Page<Doc> listHotDoc(Pageable pageable);

    List<Doc> listRecommendDocTop(Integer size);

    Doc getDocByDocId(String docId);

    Doc getDoc(Long id);

    Doc saveDoc(Doc doc);

    Doc updateDoc(Long id, Doc doc);

    void deleteDoc(Long id);

    Boolean incrementViewCount(String docId);

    Boolean changeRecommend(Long id, Boolean recommend);

    Boolean changePublished(Long id, Boolean published);

    Long count();

    Long countPublished();
}
