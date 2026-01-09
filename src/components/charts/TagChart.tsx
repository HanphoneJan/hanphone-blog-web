'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ENDPOINTS } from "@/lib/api";
import apiClient from '@/lib/utils';

// 定义标签的类型接口
interface Tag {
  id: number;
  name: string;
  x: number;
  y: number;
  z: number;
  color: string;
  opacity: number;
  filter: string;
  fontSize: number;
  transform?: string;
  webkitTransform?: string;
  zIndex?: number;
}

interface TagChartProps {
  style?: React.CSSProperties;
  rotationSpeed?: number; // 新增旋转速度参数
}

const TagChart: React.FC<TagChartProps> = ({ style, rotationSpeed = 0.3 }) => {
  // 状态管理
  const [tagList, setTagList] = useState<string[]>([]);
  const [renderList, setRenderList] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [containerSize, setContainerSize] = useState({ width: 400, height: 300 });
  const tagRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // 常量定义
  const radius = 112;
  const distance = 187;

  // API调用函数（使用axios重构）
  const fetchData = async (url: string, method: string = 'GET', data?: unknown) => {
    try {
      setLoading(true);
      const response = await apiClient({
        url,
        method,
        data: method !== 'GET' ? data : undefined,
        params: method === 'GET' ? data : undefined // GET请求参数放在params
      });

      setLoading(false);
      return response.data;
    } catch (error) {
      console.log(`Error fetching ${url}:`, error);
      setLoading(false);
      return { code: 500, data: [] };
    }
  };

  // 获取标签数据
  const getData = async () => {
    const res = await fetchData(ENDPOINTS.ADMIN.FULL_TAG_LIST);
    if (res.code === 200) {
      const tags = res.data.map((item: { name: string }) => item.name);
      setTagList(tags);
      initPosition(tags);
    } else {
      console.log('获取标签数据失败');
    }
  };

  // 初始化标签的3D位置
  const initPosition = (tags: string[]) => {
    const len = tags.length;
    const newRenderList: Tag[] = [];

    // 标签云颜色方案（与BlogChart风格保持一致）
    const tagColors = [
      '#3b82f6', // 蓝色
      '#10b981', // 绿色
      '#f59e0b', // 琥珀色
      '#ec4899', // 粉色
      '#8b5cf6', // 紫色
      '#6366f1', // 靛蓝色
    ];

    for (let i = 0; i < len; i++) {
      const k = (2 * (i + 1) - 1) / len - 1;
      const a = Math.acos(k);
      const b = a * Math.sqrt(len * Math.PI);

      // 计算3D坐标
      const x = radius * Math.sin(a) * Math.cos(b);
      const y = radius * Math.sin(a) * Math.sin(b);
      const z = radius * Math.cos(a);

      // 使用预设颜色而非随机颜色，保持风格统一
      const color = tagColors[i % tagColors.length];

      // 计算透明度
      const alpha = (z + radius) / (2 * radius);
      const opacity = alpha + 0.5;

      // 根据标签长度调整字体大小
      const fontSize = Math.max(10, Math.min(16, 14 - Math.floor(tags[i].length / 3)));

      newRenderList.push({
        id: i,
        name: tags[i],
        x,
        y,
        z,
        color,
        opacity,
        filter: `alpha(opacity = ${(alpha + 0.5) * 100})`,
        fontSize,
      });
    }

    setRenderList(newRenderList);
  };

  // 动画循环
  const animate = (timestamp: number) => {
    if (!lastTimeRef.current) {
      lastTimeRef.current = timestamp;
    }

    const deltaTime = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    // 使用时间增量来控制旋转速度，实现平滑动画
    const timeFactor = Math.min(deltaTime / 16, 2); // 标准化时间因子

    setRenderList(prevTags => {
      // 更新每个标签的位置和样式
      const updatedTags = prevTags.map(item => {
        const scale = distance / (distance - item.z);
        const alpha = (item.z + radius) / (2 * radius);
        const transform = `translate(-50%,-50%) scale(${scale})`;

        return {
          ...item,
          opacity: alpha + 0.5,
          zIndex: Math.floor(scale * 100),
          transform,
          webkitTransform: transform,
        };
      });

      // 应用旋转（使用时间因子和速度参数）
      return rotateY(rotateX(updatedTags, timeFactor * rotationSpeed), timeFactor * rotationSpeed);
    });

    // 继续动画循环
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  // X轴旋转（添加速度参数）
  const rotateX = (tags: Tag[], speed: number = 0.3) => {
    const angleX = (Math.PI / 1000) * speed; // 降低基础旋转速度
    const cos = Math.cos(angleX);
    const sin = Math.sin(angleX);

    return tags.map(item => {
      const y1 = item.y * cos - item.z * sin;
      const z1 = item.z * cos + item.y * sin;
      return { ...item, y: y1, z: z1 };
    });
  };

  // Y轴旋转（添加速度参数）
  const rotateY = (tags: Tag[], speed: number = 0.3) => {
    const angleY = (Math.PI / 1000) * speed; // 降低基础旋转速度
    const cos = Math.cos(angleY);
    const sin = Math.sin(angleY);

    return tags.map(item => {
      const x1 = item.x * cos - item.z * sin;
      const z1 = item.z * cos + item.x * sin;
      return { ...item, x: x1, z: z1 };
    });
  };

  // 屏幕适配
  const screenAdapter = () => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setContainerSize({ width, height });
    }
  };

  // 组件挂载时初始化
  useEffect(() => {
    getData();
    const handleResize = () => {
      screenAdapter();
    };

    // 初始屏幕适配
    screenAdapter();

    window.addEventListener('resize', handleResize);

    // 开始动画
    animationFrameRef.current = requestAnimationFrame(animate);

    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [rotationSpeed]); // 添加rotationSpeed依赖

  return (
    <div
      ref={containerRef}
      style={style}
      className="relative w-full h-full min-h-[300px] overflow-hidden"
    >
      <div
        ref={tagRef}
        className="absolute left-1/2 top-1/2 w-full h-full"
        style={{
          transform: 'translate(-50%, -50%)',
          perspective: '1000px',
        }}
      >
        {renderList.map(tag => {
          // 计算标签在屏幕上的位置和大小
          const scale = distance / (distance - tag.z);
          const left = containerSize.width / 2 + tag.x * scale;
          const top = containerSize.height / 2 + tag.y * scale;

          // 检查是否超出视口
          const isOutOfViewport =
            left < 0 ||
            left > containerSize.width ||
            top < 0 ||
            top > containerSize.height;

          return (
            <div
              key={tag.id}
              className="absolute transition-all duration-300 cursor-pointer px-2 py-1 hover:bg-slate-800/20 rounded-md whitespace-nowrap"
              style={{
                left: `${left}px`,
                top: `${top}px`,
                color: tag.color,
                opacity: isOutOfViewport ? 0 : tag.opacity,
                filter: tag.filter,
                fontSize: `${tag.fontSize * scale}px`,
                transform: tag.transform,
                WebkitTransform: tag.webkitTransform,
                zIndex: tag.zIndex,
                textShadow: '0 0 1px rgba(0,0,0,0.5)',
                transition: 'opacity 0.5s ease, transform 0.5s ease', // 延长过渡时间
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = `${tag.transform} scale(1.2)`;
                e.currentTarget.style.zIndex = '1000';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = tag.transform || '';
                e.currentTarget.style.zIndex = tag.zIndex?.toString() || '0';
              }}
            >
              {tag.name}
            </div>
          );
        })}
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 rounded-xl">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
};

export default TagChart;