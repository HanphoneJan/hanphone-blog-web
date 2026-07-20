package com.example.blog.web;

import com.example.blog.constants.CommonConstants;
import com.example.blog.constants.PaginationConstants;
import com.example.blog.enums.UserType;
import com.example.blog.po.Essay;
import com.example.blog.po.EssayComment;
import com.example.blog.po.Result;
import com.example.blog.po.StatusCode;
import com.example.blog.po.User;
import com.example.blog.service.EssayCommentService;
import com.example.blog.service.EssayService;
import com.example.blog.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class EssayShowController {
    private final EssayService essayService;
    private final UserService userService;
    private final EssayCommentService essayCommentService;

    public EssayShowController(EssayService essayService, UserService userService, EssayCommentService essayCommentService) {
        this.essayService = essayService;
        this.userService = userService;
        this.essayCommentService = essayCommentService;
    }

    @GetMapping("/essays")
    public Result<?> essays(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer pageSize) {
        if (page != null && pageSize != null) {
            Sort sort = Sort.by(Sort.Direction.DESC, "createTime");
            Pageable pageable = PageRequest.of(page - 1, pageSize, sort);
            return new Result<>(true, StatusCode.OK, "获取随笔列表成功", essayService.listPublishedEssay(userId, pageable));
        }
        return new Result<>(true, StatusCode.OK, "获取随笔列表成功", essayService.listPublishedEssay(userId));
    }

    @GetMapping("/getRecommendEssayList")
    public Result<List<Essay>> getRecommendEssayList() {
        return new Result<>(true, StatusCode.OK, "获取推荐随笔成功", essayService.listRecommendEssayTop(5));
    }

    @GetMapping("/essays/{id}")
    public Result<Essay> getEssayById(@PathVariable Long id, @RequestParam(required = false) Long userId) {
        return new Result<>(true, StatusCode.OK, "获取随笔成功", essayService.getEssayDetail(userId, id));
    }

    @GetMapping("/essays/{id}/comments")
    public Result<List<EssayComment>> getEssayComments(@PathVariable Long id) {
        essayService.getEssayById(id);
        return new Result<>(true, StatusCode.OK, "获取随笔评论成功", essayCommentService.listEssayCommentByEssayId(id));
    }

    @GetMapping("/essays/search")
    public Result<Page<Essay>> search(
            @PageableDefault(size = PaginationConstants.DEFAULT_PAGE_SIZE, sort = {"createTime"}, direction = Sort.Direction.DESC) Pageable pageable,
            @RequestParam String query) {
        return new Result<>(true, StatusCode.OK, "搜索随笔成功", essayService.listPublishedEssay(query, pageable));
    }

    /**
     * 处理随笔点赞/取消点赞请求
     * 接收包含userId、essayId和isLike字段的JSON数据
     */
    @PostMapping("/essays/{id}/like")
    public Result<Void> handleLike(@RequestBody Map<String, Object> requestData, @PathVariable String id) {
        try {
            // 从请求数据中提取参数
            Long userId = Long.valueOf(requestData.get("userId").toString());
            Long essayId = Long.valueOf(requestData.get("essayId").toString());
            boolean isLike = (Boolean) requestData.get("isLike");
            Essay e = essayService.updateLikes(userId, essayId, isLike);
            // 执行更新操作
            if (e != null) {
                return new Result<>(true, StatusCode.OK, "点赞成功");
            }
            return new Result<>(false, StatusCode.ERROR, "点赞失败");
        } catch (Exception e) {
            return new Result<>(false, StatusCode.ERROR, "点赞失败");
        }
    }

    @PostMapping("/essays/{id}/comments")
    public Result<EssayComment> post(@PathVariable Long id, @RequestBody Map<String, Object> para) {
        String content = (String) para.get("content");
        Long userId = Long.parseLong(para.get("userId").toString());
        long parentId = CommonConstants.DEFAULT_PARENT_ID;
        if (para.get("parentCommentId") != null) {
            parentId = Long.parseLong(para.get("parentCommentId").toString());
        }
        User user = userService.findUserById(userId);
        EssayComment essayComment = new EssayComment();
        essayComment.setContent(content);
        essayComment.setEssay(essayService.getEssayById(id));
        essayComment.setUser(user);
        essayComment.setAdminComment(UserType.ADMIN.getCode().equals(user.getType()));
        if (parentId != CommonConstants.DEFAULT_PARENT_ID) {
            essayComment.setParentEssayComment(essayCommentService.getEssayCommentById(parentId));
        }
        EssayComment newEssayComment = essayCommentService.saveEssayComment(essayComment);
        if (newEssayComment.getParentEssayComment() != null) {
            newEssayComment.setParentCommentId(newEssayComment.getParentEssayComment().getId());
        }
        return new Result<>(true, StatusCode.OK, "评论发表成功！", newEssayComment);
    }

    //删除评论
    @DeleteMapping("/essays/comments/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        essayCommentService.deleteEssayComment(id);
        return new Result<>(true, StatusCode.OK, "删除评论成功", null);
    }
}