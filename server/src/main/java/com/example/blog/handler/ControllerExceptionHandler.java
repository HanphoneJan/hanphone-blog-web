package com.example.blog.handler;

import com.example.blog.po.Result;
import com.example.blog.po.StatusCode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.AnnotationUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpServletRequest;

//拦截到所有名字具有Controller的控制器
@ControllerAdvice
public class ControllerExceptionHandler {
    private final Logger logger = LoggerFactory.getLogger(this.getClass());

    @ExceptionHandler(Exception.class)
    @ResponseBody
    private ResponseEntity<Result<Void>> exceptionHandler(HttpServletRequest request, Exception e) throws Exception {
        // 存在指定状态则抛出异常
        if (AnnotationUtils.findAnnotation(e.getClass(), ResponseStatus.class) != null) {
            throw e;
        }
        logger.error("Request URL : {}", request.getRequestURL(), e);
        Result<Void> result = new Result<>(false, StatusCode.ERROR, "服务器内部错误", null);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
    }

    /**
     * 处理 OutOfMemoryError - 返回 503 服务不可用
     * 这是关键防御：防止 OOM 导致整个应用崩溃
     */
    @ExceptionHandler(OutOfMemoryError.class)
    @ResponseBody
    public ResponseEntity<Result<Void>> handleOutOfMemoryError(HttpServletRequest request, OutOfMemoryError e) {
        logger.error("OutOfMemoryError! Request URL: {}, Message: {}", request.getRequestURL(), e.getMessage());
        // 记录关键信息后立即返回，避免分配更多内存
        Result<Void> result = new Result<>(false, StatusCode.ERROR, "服务器内存不足，请稍后重试", null);
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(result);
    }

    @ExceptionHandler(EntityNotFoundException.class)
    @ResponseBody
    public ResponseEntity<Result<Void>> handleEntityNotFound(HttpServletRequest request, EntityNotFoundException e) {
        logger.warn("EntityNotFoundException! Request URL: {}, Message: {}", request.getRequestURL(), e.getMessage());
        Result<Void> result = new Result<>(false, StatusCode.ERROR, "请求的资源不存在", null);
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(result);
    }

    /**
     * 处理 IllegalArgumentException - 参数错误
     */
    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseBody
    public ResponseEntity<Result<Void>> handleIllegalArgument(HttpServletRequest request, IllegalArgumentException e) {
        logger.warn("IllegalArgumentException! Request URL: {}, Message: {}", request.getRequestURL(), e.getMessage());
        Result<Void> result = new Result<>(false, StatusCode.ERROR, e.getMessage(), null);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(result);
    }

    /**
     * 处理 RuntimeException
     */
    @ExceptionHandler(RuntimeException.class)
    @ResponseBody
    public ResponseEntity<Result<Void>> handleRuntimeException(HttpServletRequest request, RuntimeException e) {
        logger.error("RuntimeException! Request URL: {}, Message: {}", request.getRequestURL(), e.getMessage(), e);
        Result<Void> result = new Result<>(false, StatusCode.ERROR, "服务器内部错误", null);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
    }

    /**
     * 处理 HTTP 方法不支持 — 405
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    @ResponseBody
    public ResponseEntity<Result<Void>> handleMethodNotSupported(HttpServletRequest request,
            HttpRequestMethodNotSupportedException e) {
        logger.warn("Method not supported! URL: {}, Method: {}", request.getRequestURL(), request.getMethod());
        Result<Void> result = new Result<>(false, StatusCode.ERROR, "不支持的请求方法", null);
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(result);
    }

    /**
     * 处理器未找到 — 404
     */
    @ExceptionHandler(NoHandlerFoundException.class)
    @ResponseBody
    public ResponseEntity<Result<Void>> handleNoHandlerFound(HttpServletRequest request, NoHandlerFoundException e) {
        logger.warn("No handler found! URL: {}", request.getRequestURL());
        Result<Void> result = new Result<>(false, StatusCode.ERROR, "请求的资源不存在", null);
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(result);
    }

    /**
     * 静态资源未找到 — 404 (Spring Boot 3.x)
     */
    @ExceptionHandler(NoResourceFoundException.class)
    @ResponseBody
    public ResponseEntity<Result<Void>> handleNoResourceFound(HttpServletRequest request,
            NoResourceFoundException e) {
        logger.warn("No resource found! URL: {}", request.getRequestURL());
        Result<Void> result = new Result<>(false, StatusCode.ERROR, "请求的资源不存在", null);
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(result);
    }
}
