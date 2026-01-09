'use client';

import React, { useRef, useState, useEffect } from 'react';
import * as echarts from 'echarts';
import { ENDPOINTS } from "@/lib/api";
import apiClient from '@/lib/utils'; // 导入axios实例

// 定义类型接口
interface TypeItem {
  name: string;
  blogs: { length: number }[];
}

interface ChartData {
  name: string;
  value: number;
}

interface TypeProps {
  style?: React.CSSProperties;
}

const Type: React.FC<TypeProps> = ({ style }) => {
  // DOM引用
  const typeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 状态管理
  const [typeList, setTypeList] = useState<TypeItem[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [chartInstance, setChartInstance] = useState<echarts.ECharts | null>(null);
  const [loading, setLoading] = useState(true);
  const colorMap = [
    '#3b82f6', // 蓝色
    '#10b981', // 绿色
    '#f59e0b', // 琥珀色
    '#ec4899', // 粉色
    '#8b5cf6'  // 紫色（用于"其他"分类）
  ];

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

  // 屏幕适配 - 图表 resize
  const screenAdapter = () => {
    if (chartInstance && containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const containerHeight = containerRef.current.offsetHeight;

      chartInstance.resize({
        width: containerWidth,
        height: containerHeight
      });
    }
  };

  // 比较函数 - 用于排序
  const compare = (property: keyof TypeItem) => {
    return (a: TypeItem, b: TypeItem) => {
      const value1 = Array.isArray(a[property])
        ? (a[property] as Array<{ length: number }>).length
        : 0;
      const value2 = Array.isArray(b[property])
        ? (b[property] as Array<{ length: number }>).length
        : 0;
      return value2 - value1;
    };
  };

  // 初始化图表（核心修改：检查并清除已存在的实例）
  const initChart = () => {
    if (!typeRef.current || !containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    const containerHeight = containerRef.current.offsetHeight;

    // 关键修改：先检查并清除已存在的实例
    if (chartInstance) {
      chartInstance.dispose();
      setChartInstance(null);
    }

    // 检查DOM上是否有残留的实例并清除
    const existingInstance = echarts.getInstanceByDom(typeRef.current);
    if (existingInstance) {
      existingInstance.dispose();
    }

    // 设置容器尺寸
    typeRef.current.style.width = `${containerWidth}px`;
    typeRef.current.style.height = `${containerHeight}px`;

    // 初始化新实例
    const instance = echarts.init(typeRef.current);
    setChartInstance(instance);

    const initOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        formatter: '{b} : {c} ({d}%)',
        padding: [5, 10],
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        borderColor: 'rgba(71, 85, 105, 0.5)',
        borderWidth: 1,
        textStyle: {
          color: '#e2e8f0'
        }
      },
      // 删除了图例配置
      series: [
        {
          name: '分类',
          type: 'pie',
          roseType: 'radius',
          radius: containerWidth < 400 ? ['15%', '55%'] : ['15%', '80%'],
          center: ['50%', containerWidth < 400 ? '40%' : '50%'], // 调整中心位置，因为删除了图例
          data: [],
          itemStyle: {
            color: (params: any) => colorMap[params.dataIndex % colorMap.length],
            borderColor: 'rgba(15, 23, 42, 0.3)',
            borderWidth: 1
          },
          animationDuration: 2800,
          animationEasing: 'cubicInOut',
          label: {
            position: containerWidth < 400 ? 'outer' : 'inner',
            alignTo: containerWidth < 400 ? 'edge' : undefined,
            // 使用edgeDistance替代margin，解决deprecated警告
            edgeDistance: containerWidth < 400 ? 12 : 8,
            // 移除textStyle层级，解决deprecated警告
            fontSize: 10
          }
        }
      ]
    };

    instance.setOption(initOption);
  };

  // 更新图表数据
  const updateChart = () => {
    if (!chartInstance || !containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;

    chartInstance.setOption({
      // 删除了图例配置
      series: [
        {
          data: chartData,
          radius: containerWidth < 400 ? ['15%', '55%'] : ['15%', '80%'],
          center: ['50%', containerWidth < 400 ? '40%' : '50%'], // 调整中心位置，因为删除了图例
          label: {
            position: containerWidth < 400 ? 'outer' : 'inner',
            alignTo: containerWidth < 400 ? 'edge' : undefined,
            edgeDistance: containerWidth < 400 ? 12 : 8,
            fontSize: 10
          },
          itemStyle: {
            color: (params: any) => colorMap[params.dataIndex % colorMap.length]
          }
        }
      ]
    });
  };

  // 获取数据并更新图表
  const fetchTypeData = async () => {
    const res = await fetchData(ENDPOINTS.ADMIN.FULL_TYPE_LIST);
    if (res.code === 200) {
      const resData = res.data as TypeItem[];
      const sortedList = resData.sort(compare('blogs'));
      setTypeList(sortedList);

      const processedData = sortedList.slice(0, 4).map(item => ({
        name: item.name,
        value: item.blogs.length
      }));

      const othersValue = sortedList.slice(4).reduce(
        (sum, item) => sum + item.blogs.length,
        0
      );
      processedData.push({ name: '其他', value: othersValue });

      setChartData(processedData);
      updateChart();
    } else {
      console.log('获取分类数据失败');
    }
  };

  // 组件挂载时初始化
  useEffect(() => {
    initChart();
    fetchTypeData();

    // 监听窗口大小变化（优化：只在resize时更新尺寸，避免重新初始化）
    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        screenAdapter();
        // 关键修改：resize时不再重新初始化，只更新配置
        updateChart();
      }, 300);
    };

    window.addEventListener('resize', debouncedResize);

    // 清理函数：确保组件卸载时销毁实例
    return () => {
      window.removeEventListener('resize', debouncedResize);
      if (chartInstance) {
        chartInstance.dispose();
        setChartInstance(null);
      }
    };
  }, []);

  // 数据变化时更新图表
  useEffect(() => {
    if (chartData.length > 0) {
      updateChart();
    }
  }, [chartData]);

  return (
    <div ref={containerRef} style={style} className="relative w-full h-full">
      <div ref={typeRef} className="w-full h-full" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 rounded-xl">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
};

export default Type;