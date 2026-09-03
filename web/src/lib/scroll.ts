/**
 * 滚动重置工具。
 *
 * 背景：Next.js App Router 导航时只重置 window（documentElement）的滚动位置，
 * 不会处理页面内部的 overflow-y-auto 容器（如博客列表三栏、博客/文库详情正文）。
 * 因此内部滚动布局的页面在分页、筛选或内容切换时，必须显式重置容器 scrollTop。
 */

/**
 * 将内部滚动容器重置到顶部，并同步重置 window 滚动。
 *
 * - container 为内部滚动容器（可空：移动端布局下可能不存在，此时仅 window 在滚动）
 * - window 重置对内部滚动布局是无害的（window 本就位于顶部），但能覆盖
 *   移动端等以 window 为滚动主体的布局
 */
export function scrollToTopOf(container: HTMLElement | null | undefined) {
  container?.scrollTo({ top: 0, left: 0 })
  window.scrollTo({ top: 0, left: 0 })
}
