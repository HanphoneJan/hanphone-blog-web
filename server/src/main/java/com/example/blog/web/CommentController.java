package com.example.blog.web;

import com.example.blog.constants.CommonConstants;
import com.example.blog.enums.UserType;
import com.example.blog.po.Blog;
import com.example.blog.po.Comment;
import com.example.blog.po.Result;
import com.example.blog.po.StatusCode;
import com.example.blog.po.User;
import com.example.blog.service.BlogService;
import com.example.blog.service.CommentService;
import com.example.blog.service.UserService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class CommentController {
    private final CommentService commentService;
    private final BlogService blogService;
    private final UserService userService;

    public CommentController(CommentService commentService, BlogService blogService, UserService userService) {
        this.commentService = commentService;
        this.blogService = blogService;
        this.userService = userService;
    }

    /**
     * 处理博客点赞/取消点赞请求
     */
    @PostMapping("/blog/{id}/like")
    public Result<Void> handleLike(@RequestBody Map<String, Object> requestData, @PathVariable String id) {
        try {
            Long userId = Long.valueOf(requestData.get("userId").toString());
            Long blogId = Long.valueOf(requestData.get("blogId").toString());
            boolean isLike = (Boolean) requestData.get("isLike");

            if (blogService.updateLikes(userId, blogId, isLike)) {
                return new Result<>(true, StatusCode.OK, "点赞成功");
            }
            return new Result<>(false, StatusCode.ERROR, "点赞失败");
        } catch (Exception e) {
            return new Result<>(false, StatusCode.ERROR, "点赞失败");
        }
    }

    //获取评论集合
    @GetMapping("/comments/{blogId}")
    public Result<List<Comment>> comments(@PathVariable Long blogId) {
        Blog blog = blogService.getBlog(blogId);
        if (!blog.isPublished()) {
            return new Result<>(false, StatusCode.ERROR, "博客不存在", null);
        }
        return new Result<>(true, StatusCode.OK, "获取博客评论成功", commentService.listCommentByBlogId(blogId));
    }

    @PostMapping("/comments")
    public Result<Comment> post(@RequestBody Map<String, Object> para) {
        try {
            String content = (String) para.get("content");
            Long blogId = Long.parseLong(para.get("blogId").toString());

            // 处理用户信息：优先用已登录用户的 userId，否则用请求中传入的
            Long userId = para.get("userId") != null
                    ? Long.parseLong(para.get("userId").toString())
                    : null;

            // parentId 可选，默认 -1 表示顶级评论
            long parentId = para.get("parentId") != null
                    ? Long.parseLong(para.get("parentId").toString())
                    : CommonConstants.DEFAULT_PARENT_ID;

            Blog blog = blogService.getBlog(blogId);
            if (!blog.isPublished()) {
                return new Result<>(false, StatusCode.ERROR, "博客不存在", null);
            }
            Comment comment = new Comment();
            comment.setContent(content);
            comment.setBlog(blog);

            if (userId != null) {
                User user = userService.findUserById(userId);
                if (user != null) {
                    comment.setUserId(userId);
                    comment.setNickname(user.getNickname());
                    comment.setEmail(user.getEmail());
                    comment.setAvatar(user.getAvatar());
                    comment.setAdminComment(UserType.ADMIN.getCode().equals(user.getType()));
                }
            } else {
                // 未登录用户：从请求中获取昵称和邮箱
                String nickname = para.get("nickname") != null ? para.get("nickname").toString().trim() : "";
                String email = para.get("email") != null ? para.get("email").toString().trim() : "";
                if (nickname.isEmpty() || email.isEmpty()) {
                    return new Result<>(false, StatusCode.ERROR, "昵称和邮箱不能为空", null);
                }
                comment.setNickname(nickname);
                comment.setEmail(email);
                comment.setAvatar((String) para.getOrDefault("avatar", ""));
            }

            if (parentId != CommonConstants.DEFAULT_PARENT_ID) {
                comment.setParentComment(commentService.getCommentById(parentId));
            }
            Comment newComment = commentService.saveComment(comment);
            return new Result<>(true, StatusCode.OK, "评论发表成功！", newComment);
        } catch (NumberFormatException e) {
            return new Result<>(false, StatusCode.ERROR, "参数格式错误", null);
        } catch (Exception e) {
            return new Result<>(false, StatusCode.ERROR, "评论发表失败", null);
        }
    }

    //删除评论
    @DeleteMapping("/comments/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        commentService.deleteComment(id);
        return new Result<>(true, StatusCode.OK, "删除评论成功", null);
    }
}