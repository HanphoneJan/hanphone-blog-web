package com.example.blog.service.impl;

import com.example.blog.dao.DocRepository;
import com.example.blog.po.Doc;
import com.example.blog.service.DocService;
import com.example.blog.util.MyBeanUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.Objects;

import static java.util.Objects.requireNonNull;

@Service
public class DocServiceImpl implements DocService {

    private final DocRepository docRepository;

    public DocServiceImpl(DocRepository docRepository) {
        this.docRepository = Objects.requireNonNull(docRepository, "docRepository must not be null");
    }

    @Override
    public List<Doc> listDoc() {
        try {
            return docRepository.findAll(Sort.by(Sort.Direction.DESC, "createTime"));
        } catch (Exception e) {
            throw new RuntimeException("Failed to list docs", e);
        }
    }

    @Override
    public Page<Doc> listDoc(Pageable pageable) {
        requireNonNull(pageable, "pageable must not be null");
        try {
            return docRepository.findAll(pageable);
        } catch (Exception e) {
            throw new RuntimeException("Failed to list docs with pageable", e);
        }
    }

    @Override
    public List<Doc> listPublishedDoc() {
        try {
            return docRepository.findByPublishedTrue();
        } catch (Exception e) {
            throw new RuntimeException("Failed to list published docs", e);
        }
    }

    @Override
    public Page<Doc> listPublishedDoc(Pageable pageable) {
        requireNonNull(pageable, "pageable must not be null");
        try {
            return docRepository.findByPublishedTrue(pageable);
        } catch (Exception e) {
            throw new RuntimeException("Failed to list published docs with pageable", e);
        }
    }

    @Override
    public Page<Doc> listHotDoc(Pageable pageable) {
        requireNonNull(pageable, "pageable must not be null");
        try {
            return docRepository.findByPublishedTrueOrderByViewCountDesc(pageable);
        } catch (Exception e) {
            throw new RuntimeException("Failed to list hot docs", e);
        }
    }

    @Override
    public List<Doc> listRecommendDocTop(Integer size) {
        requireNonNull(size, "size must not be null");
        if (size <= 0) {
            throw new IllegalArgumentException("size must be greater than 0");
        }
        try {
            Pageable pageable = PageRequest.of(0, size, Sort.by(Sort.Direction.DESC, "createTime"));
            return docRepository.findByRecommendTrueAndPublishedTrue(pageable);
        } catch (Exception e) {
            throw new RuntimeException("Failed to list recommend docs with size: " + size, e);
        }
    }

    @Override
    public Doc getDocByDocId(String docId) {
        requireNonNull(docId, "docId must not be null");
        try {
            Doc doc = docRepository.findByDocId(docId)
                    .orElseThrow(() -> new EntityNotFoundException("Doc not found with docId: " + docId));
            if (!Boolean.TRUE.equals(doc.getPublished())) {
                throw new EntityNotFoundException("Doc not found with docId: " + docId);
            }
            return doc;
        } catch (EntityNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to get doc with docId: " + docId, e);
        }
    }

    @Override
    public Doc getDoc(Long id) {
        requireNonNull(id, "id must not be null");
        try {
            return docRepository.findById(id)
                    .orElseThrow(() -> new EntityNotFoundException("Doc not found with id: " + id));
        } catch (EntityNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to get doc with id: " + id, e);
        }
    }

    @Override
    @Transactional
    public Doc saveDoc(Doc doc) {
        Objects.requireNonNull(doc, "doc must not be null");
        try {
            return docRepository.save(doc);
        } catch (Exception e) {
            throw new RuntimeException("Failed to save doc", e);
        }
    }

    @Override
    @Transactional
    public Doc updateDoc(Long id, Doc doc) {
        Objects.requireNonNull(id, "id must not be null");
        Objects.requireNonNull(doc, "doc must not be null");
        try {
            Doc existing = docRepository.findById(id)
                    .orElseThrow(() -> new EntityNotFoundException("Doc not found with id: " + id));
            BeanUtils.copyProperties(doc, existing, MyBeanUtils.getNullPropertyNames(doc));
            return docRepository.save(existing);
        } catch (EntityNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to update doc with id: " + id, e);
        }
    }

    @Override
    @Transactional
    public void deleteDoc(Long id) {
        Objects.requireNonNull(id, "id must not be null");
        try {
            docRepository.deleteById(id);
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete doc with id: " + id, e);
        }
    }

    @Override
    @Transactional
    public Boolean incrementViewCount(String docId) {
        requireNonNull(docId, "docId must not be null");
        try {
            Doc doc = docRepository.findByDocId(docId)
                    .orElseThrow(() -> new EntityNotFoundException("Doc not found with docId: " + docId));
            if (!Boolean.TRUE.equals(doc.getPublished())) {
                throw new EntityNotFoundException("Doc not found with docId: " + docId);
            }
            int affectedRows = docRepository.incrementViewCount(docId);
            return affectedRows > 0;
        } catch (EntityNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to increment view count for doc: " + docId, e);
        }
    }

    @Override
    @Transactional
    public Boolean changeRecommend(Long id, Boolean recommend) {
        requireNonNull(id, "id must not be null");
        requireNonNull(recommend, "recommend flag must not be null");
        try {
            int affectedRows = docRepository.updateRecommend(id, recommend);
            return affectedRows > 0;
        } catch (Exception e) {
            throw new RuntimeException("Failed to change recommend status for doc: " + id, e);
        }
    }

    @Override
    @Transactional
    public Boolean changePublished(Long id, Boolean published) {
        requireNonNull(id, "id must not be null");
        requireNonNull(published, "published flag must not be null");
        try {
            int affectedRows = docRepository.updatePublished(id, published);
            return affectedRows > 0;
        } catch (Exception e) {
            throw new RuntimeException("Failed to change published status for doc: " + id, e);
        }
    }

    @Override
    public Long count() {
        try {
            return docRepository.count();
        } catch (Exception e) {
            throw new RuntimeException("Failed to count docs", e);
        }
    }

    @Override
    public Long countPublished() {
        try {
            return docRepository.countByPublishedTrue();
        } catch (Exception e) {
            throw new RuntimeException("Failed to count published docs", e);
        }
    }
}
