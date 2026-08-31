'use client';

/**
 * Model Manager Hook
 */

import { useState, useCallback, useEffect } from 'react';
import { checkModelVersion, randomOtherOption, getLocalStorageInt, setLocalStorage } from '../utils';
import logger from '../logger';

interface ManagedModel {
  paths?: string[];
}

interface UseModelManagerOptions {
  models: ManagedModel[];
  cdnPath?: string;
}

export function useModelManager(options: UseModelManagerOptions) {
  const { models, cdnPath } = options;
  const [modelId, setModelIdState] = useState(() => {
    const stored = getLocalStorageInt('modelId', 0);
    return stored < models.length ? stored : 0;
  });
  const [modelTexturesId, setModelTexturesIdState] = useState(() => {
    const stored = getLocalStorageInt('modelTexturesId', 0);
    // 检查是否有效
    if (models[modelId]?.paths) {
      return stored < models[modelId].paths.length ? stored : 0;
    }
    return stored;
  });
  const [loading, setLoading] = useState(false);

  const setModelId = useCallback((id: number) => {
    setModelIdState(id);
    setLocalStorage('modelId', id.toString());
  }, []);

  const setModelTexturesId = useCallback((id: number) => {
    setModelTexturesIdState(id);
    setLocalStorage('modelTexturesId', id.toString());
  }, []);

  // 获取当前模型路径
  const getCurrentModelPath = useCallback(() => {
    const model = models[modelId];
    if (!model) return null;
    
    if (model.paths && model.paths.length > 0) {
      return model.paths[modelTexturesId % model.paths.length];
    }
    return null;
  }, [models, modelId, modelTexturesId]);

  // 切换到下一个模型
  const nextModel = useCallback(() => {
    setModelTexturesId(0);
    const nextId = (modelId + 1) % models.length;
    setModelId(nextId);
    return models[nextId];
  }, [models, modelId, setModelId, setModelTexturesId]);

  // 切换纹理
  const randomTexture = useCallback(() => {
    const model = models[modelId];
    if (!model?.paths || model.paths.length <= 1) {
      return null;
    }
    
    const newTextureId = randomOtherOption(model.paths.length, modelTexturesId);
    setModelTexturesId(newTextureId);
    return model.paths[newTextureId];
  }, [models, modelId, modelTexturesId, setModelTexturesId]);

  // 重置模型ID如果超出范围
  useEffect(() => {
    if (modelId >= models.length && models.length > 0) {
      setModelId(0);
      setModelTexturesId(0);
    }
  }, [models.length, modelId, setModelId, setModelTexturesId]);

  return {
    modelId,
    modelTexturesId,
    setModelId,
    setModelTexturesId,
    currentModel: models[modelId],
    currentModelPath: getCurrentModelPath(),
    nextModel,
    randomTexture,
    loading,
    setLoading,
  };
}
