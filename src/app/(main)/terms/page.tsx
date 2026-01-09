'use client'

import Link from 'next/link'
import { CheckCircle, Info, AlertCircle } from 'lucide-react'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen z-1 flex flex-col bg-white dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-200">
      <style jsx global>{`
        ::-webkit-scrollbar {
          display: none;
        }
        html {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/40"></div>

      {/* 主要内容 */}
      <main className="container mx-auto sm:px-4 max-w-4xl page-transition relative z-10">
        <div className="bg-white/80 dark:bg-slate-800/40 backdrop-blur-sm md:rounded-xl shadow-md p-8 border border-slate-200 dark:border-slate-700/50 transform transition-all duration-300 hover:shadow-lg hover:border-blue-800/50">
          <div className="flex items-center mb-8">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full mr-4">
              <Info className="text-blue-600 dark:text-blue-400 text-2xl" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-100">
              用户协议
            </h1>
          </div>

          <p className="text-slate-600 dark:text-slate-400 mb-8">
            欢迎使用我的个人博客网站（以下简称“本网站”）。在使用本网站前，请您仔细阅读以下用户协议。
            您对本网站的使用将被视为您已接受并同意本协议的全部条款。
          </p>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400 border-l-4 border-blue-500 pl-3">
              1. 协议接受
            </h2>
            <p className="mb-4 text-slate-700 dark:text-slate-300">
              本用户协议（以下简称“协议”）是您与本网站所有者之间关于您使用本网站的法律协议。
              一旦您访问、浏览或使用本网站，即表示您同意并接受本协议的全部条款和条件。
              如果您不同意本协议的任何条款，请立即停止使用本网站。
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400 border-l-4 border-blue-500 pl-3">
              2. 使用条款
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
              <li>您承诺在使用本网站时遵守所有适用的法律法规。</li>
              <li>
                您不得利用本网站发布、传播任何违法、有害、侮辱、诽谤、淫秽、暴力或其他不当内容。
              </li>
              <li>您不得尝试未经授权访问本网站的任何部分或相关系统。</li>
              <li>
                您不得干扰或破坏本网站的正常运行，包括但不限于通过黑客行为、病毒或其他恶意手段。
              </li>
              <li>
                您不得以任何形式复制、分发、修改、展示、传输或利用本网站的内容，除非获得明确书面许可。
              </li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400 border-l-4 border-blue-500 pl-3">
              3. 知识产权
            </h2>
            <p className="mb-4 text-slate-700 dark:text-slate-300">
              本网站上的所有内容，包括但不限于文章、图片、视频、音频、文字、设计、代码等，均受知识产权法保护。
              除非另有说明，本网站的所有知识产权均归本网站所有者所有。
            </p>
            <p className="text-slate-700 dark:text-slate-300">
              您可以出于个人、非商业目的浏览和使用本网站内容，但未经本网站所有者书面许可，
              不得将任何内容用于商业用途，不得复制、分发、修改或创作衍生作品。
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400 border-l-4 border-blue-500 pl-3">
              4. 用户评论
            </h2>
            <p className="mb-4 text-slate-700 dark:text-slate-300">
              本网站可能提供评论功能，您在发表评论时应遵守以下规定：
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4 text-slate-700 dark:text-slate-300">
              <li>评论内容必须遵守法律法规和公序良俗。</li>
              <li>不得发表任何攻击性、侮辱性、诽谤性或其他不当言论。</li>
              <li>您应对自己发表的评论内容负责。</li>
            </ul>
            <p className="text-slate-700 dark:text-slate-300">
              本网站保留对任何评论进行审核、编辑或删除的权利，而无需事先通知或说明理由。
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400 border-l-4 border-blue-500 pl-3">
              5. 免责声明
            </h2>
            <div className="bg-amber-100 dark:bg-amber-900/30 p-4 rounded-lg border border-amber-300 dark:border-amber-800 mb-4">
              <div className="flex items-start">
                <AlertCircle className="text-amber-600 dark:text-amber-400 mr-2 mt-1 flex-shrink-0" />
                <p className="text-amber-800 dark:text-amber-200">
                  本网站提供的内容仅供参考，不构成任何形式的建议或推荐。
                  本网站所有者不对因使用或依赖本网站内容而造成的任何损失或损害承担责任。
                </p>
              </div>
            </div>
            <p className="text-slate-700 dark:text-slate-300">
              本网站将尽力确保所提供信息的准确性和完整性，但不对信息的绝对准确性和完整性做出任何明示或暗示的保证。
              本网站所有者保留随时修改、更新本网站内容的权利，而无需事先通知。
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400 border-l-4 border-blue-500 pl-3">
              6. 隐私保护
            </h2>
            <p className="text-slate-700 dark:text-slate-300">
              本网站尊重并保护所有使用本网站用户的个人隐私权。关于您的个人信息的收集、使用和保护，请参阅我们的
              <Link
                href="/privacy"
                className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
              >
                隐私政策
              </Link>
              。
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400 border-l-4 border-blue-500 pl-3">
              7. 协议修改
            </h2>
            <p className="text-slate-700 dark:text-slate-300">
              本网站所有者保留随时修改本协议的权利。任何修改将在本页面发布后立即生效。
              建议您定期查阅本协议，以了解最新条款。您继续使用本网站将被视为接受修改后的协议。
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400 border-l-4 border-blue-500 pl-3">
              8. 终止
            </h2>
            <p className="text-slate-700 dark:text-slate-300">
              本网站所有者有权在任何时候，基于任何理由，终止或限制您对本网站的访问，而无需事先通知。
              本协议的条款在终止后仍然有效。
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400 border-l-4 border-blue-500 pl-3">
              9. 联系我们
            </h2>
            <p className="mb-4 text-slate-700 dark:text-slate-300">
              如果您对本用户协议有任何疑问或建议，请通过以下方式联系我们：
            </p>
            <div className="bg-blue-100 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-300 dark:border-blue-800">
              <p className="flex items-center">
                <span className="font-medium md:mr-2">电子邮件：</span>
                <a
                  href="mailto:contact@example.com"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Janhizian@163.com
                </a>
              </p>
            </div>
          </section>

          <section className="mt-12 pt-6 border-t border-slate-300 dark:border-slate-700/50">
            <div className="flex items-center text-slate-600 dark:text-slate-400">
              <CheckCircle className="text-green-600 dark:text-green-500 mr-2" />
              <p>最后更新日期：2025年9月9日</p>
            </div>
          </section>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="bg-white/80 dark:bg-slate-800/40 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700/50 py-8 relative z-10">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-slate-600 dark:text-slate-400">
                © {new Date().getFullYear()} 寒枫的个人博客. 保留所有权利.
              </p>
            </div>
            <div className="flex space-x-6">
              <Link href="/terms" className="text-blue-600 dark:text-blue-400 font-medium">
                用户协议
              </Link>
              <span className="text-slate-400 dark:text-slate-600">|</span>
              <Link
                href="/privacy"
                className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                隐私政策
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
