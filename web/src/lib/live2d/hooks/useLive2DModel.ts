'use client';

/**
 * Live2D Model Hook - 使用 pixi-live2d-display-advanced
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import * as PIXI from 'pixi.js';
import logger from '../logger';

// 注册Live2D模型
if (typeof window !== 'undefined') {
  (window as any).PIXI = PIXI;
}

/**
 * 解锁 AudioContext — 浏览器自动播放策略要求用户交互后才能启动音频
 * 监听首次点击/触摸/按键，然后 resume 所有 suspended 的 AudioContext
 */
function unlockAudioContext() {
  let unlocked = false;

  const resumeContexts = () => {
    if (unlocked || typeof window === 'undefined') return;
    unlocked = true;

    // resume 页面上所有已创建但被暂停的 AudioContext
    const tryResume = (ac: AudioContext) => {
      if (ac && ac.state === 'suspended') {
        ac.resume().catch(() => {});
      }
    };

    // PIXI 可能挂载在 window 上的音频上下文
    tryResume((window as any).__pixiAudioContext);

    // PIXI Sound 插件使用的全局 audio context
    tryResume((window as any).__pixi?.sound?.context);

    // 遍历 document 上所有可能的 AudioContext 引用
    const contexts: AudioContext[] = (window as any).__audioContexts || [];
    contexts.forEach(tryResume);

    // 清理所有监听器
    events.forEach((e) => document.removeEventListener(e, handler));
  };

  const events = ['click', 'touchstart', 'keydown'];
  const handler = () => resumeContexts();
  events.forEach((e) => document.addEventListener(e, handler));
}

interface ModelInfo {
  path: string;
  name?: string;
}

interface UseLive2DModelOptions {
  models: ModelInfo[];
  initialModelIndex?: number;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

// 动态加载脚本
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // 移除可能存在的旧标签（HMR 后脚本元素仍在 DOM 但全局已丢失）
    const existingScript = document.querySelector(`script[src="${src}"]`)
    if (existingScript) {
      existingScript.remove()
    }

    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
    document.head.appendChild(script)
  })
}

// 延迟导入 pixi-live2d-display-advanced，确保运行时先加载
let Live2DModel: any = null;

export function useLive2DModel(options: UseLive2DModelOptions) {
  const { models, initialModelIndex = 0, onLoad, onError } = options;
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const modelRef = useRef<any>(null);
  const [currentModelIndex, setCurrentModelIndex] = useState(initialModelIndex);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const runtimeLoadedRef = useRef({ cubism2: false, cubism4: false });

  // 初始化：预加载 Cubism 2 和 Cubism 4 运行时（pixi-live2d-display-advanced 需要）
  useEffect(() => {
    // 注册音频解锁（浏览器自动播放策略）
    unlockAudioContext();

    let cancelled = false;

    async function init() {
      try {
        // 并行加载 Cubism 2 和 Cubism 4 运行时
        const loadPromises = [];
        
        if (!runtimeLoadedRef.current.cubism2) {
          logger.info('Preloading Cubism 2 runtime...');
          loadPromises.push(
            loadScript('/live2d/live2d.min.js').then(() => {
              runtimeLoadedRef.current.cubism2 = true;
              logger.info('Cubism 2 runtime loaded');
            })
          );
        }
        
        if (!runtimeLoadedRef.current.cubism4) {
          logger.info('Preloading Cubism 4 runtime...');
          loadPromises.push(
            loadScript('/live2d/live2dcubismcore.min.js').then(() => {
              runtimeLoadedRef.current.cubism4 = true;
              logger.info('Cubism 4 runtime loaded');
            })
          );
        }
        
        await Promise.all(loadPromises);
        
        // 动态导入 pixi-live2d-display-advanced
        if (!cancelled) {
          const { Live2DModel: L2DModel } = await import('pixi-live2d-display-advanced');
          Live2DModel = L2DModel;
          setIsReady(true);
          logger.info('Live2DModel imported successfully');
        }
      } catch (error) {
        logger.error('Failed to initialize Live2D:', error);
        onError?.(error as Error);
      }
    }
    
    init();
    
    return () => {
      cancelled = true;
    };
  }, [onError]);

  // 清理资源
  const cleanup = useCallback(() => {
    if (modelRef.current) {
      try {
        modelRef.current.destroy();
      } catch (e) {
        // 忽略清理错误
      }
      modelRef.current = null;
    }
    if (appRef.current) {
      try {
        appRef.current.destroy(true);
      } catch {
        // 忽略
      }
      appRef.current = null;
    }
    setIsLoaded(false);
  }, []);

  // 加载模型
  const loadModel = useCallback(async (modelPath: string) => {
    if (!canvasRef.current || isLoading || !isReady || !Live2DModel) return;
    
    setIsLoading(true);
    logger.info(`Loading model: ${modelPath}`);
    
    try {
      // 清理之前的模型
      if (modelRef.current) {
        try {
          modelRef.current.destroy();
        } catch {
          // 忽略
        }
        modelRef.current = null;
      }

      // 创建PIXI应用
      if (!appRef.current) {
        const canvas = canvasRef.current;
        // 逻辑尺寸必须用 CSS 尺寸（canvas.width 会被 autoDensity 改写为物理像素）
        appRef.current = new PIXI.Application({
          view: canvas,
          width: canvas.clientWidth || 220,
          height: canvas.clientHeight || 320,
          backgroundAlpha: 0,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
          preserveDrawingBuffer: true, // 启用以支持拍照功能
        });
        // 挂载到 canvas 以便外部访问
        (canvas as any).__pixi = appRef.current;
        logger.info(`PIXI App created: ${appRef.current.view.width}x${appRef.current.view.height}`);
      }

      // 加载Live2D模型（禁用自动交互，PIXI v7 兼容性问题）
      const model = await Live2DModel.from(modelPath, {
        autoUpdate: true,
        autoInteract: false, // 禁用自动交互以避免 manager.on 错误
      });

      modelRef.current = model;
      
      // 添加到舞台
      appRef.current.stage.addChild(model);
      
      // 获取 Canvas 逻辑尺寸（app.screen 为逻辑坐标，不受 devicePixelRatio 影响；
      // canvas.width/height 是物理像素 = 逻辑尺寸 × dpr，直接用于布局会导致模型放大 dpr 倍且错位）
      const canvasWidth = appRef.current.screen.width;
      const canvasHeight = appRef.current.screen.height;
      
      // 获取模型原始尺寸
      const modelWidth = model.internalWidth || model.width || 500;
      const modelHeight = model.internalHeight || model.height || 500;
      
      logger.info(`Canvas size: ${canvasWidth}x${canvasHeight}, Model size: ${modelWidth}x${modelHeight}`);
      
      // 调整模型大小和位置
      const scale = Math.min(
        canvasWidth / modelWidth,
        canvasHeight / modelHeight,
      );
      
      const finalScale = scale * 0.9;
      logger.info(`Setting model scale to: ${finalScale}`);
      
      model.scale.set(finalScale);
      
      // 居中显示
      model.x = canvasWidth / 2;
      model.y = canvasHeight / 2;
      model.anchor.set(0.5, 0.5);
      
      logger.info(`Model position: x=${model.x}, y=${model.y}`);

      // 启用交互（PIXI v7 方式）
      model.eventMode = 'static';
      model.cursor = 'pointer';
      
      // 点击事件
      model.on('pointertap', () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('live2d:tapbody'));
        }
      });

      // 悬停事件
      model.on('pointerover', () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('live2d:hoverbody'));
        }
      });

      setIsLoaded(true);
      onLoad?.();
      logger.info(`Model loaded successfully: ${modelPath}`);
    } catch (error) {
      logger.error('Failed to load Live2D model:', error);
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isReady, onLoad, onError]);

  // 切换到下一个模型
  const nextModel = useCallback(() => {
    if (models.length <= 1) return;
    const nextIndex = (currentModelIndex + 1) % models.length;
    setCurrentModelIndex(nextIndex);
    return models[nextIndex];
  }, [models, currentModelIndex]);

  return {
    canvasRef,
    model: modelRef.current,
    isLoading,
    isLoaded,
    isReady,
    currentModelIndex,
    setCurrentModelIndex,
    loadModel,
    nextModel,
    cleanup,
  };
}
