'use client'

import Link from 'next/link'
import { FileText, Shield, User, Clock, Mail, Cookie, Lock } from 'lucide-react'

export default function PrivacyPolicyPage() {
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

      <main className="container mx-auto sm:px-4 max-w-4xl page-transition relative z-10">
        <div className="bg-white/80 dark:bg-slate-800/40 backdrop-blur-sm md:rounded-xl shadow-md p-8 border border-slate-200 dark:border-slate-700/50 transform transition-all duration-300 hover:shadow-lg hover:border-blue-800/50">
          <div className="flex items-center mb-8">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full mr-4">
              <FileText className="text-blue-600 dark:text-blue-400 text-2xl" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-100">
              隐私条款
            </h1>
          </div>

          <p className="text-slate-600 dark:text-slate-400 mb-8">
            欢迎使用我的个人博客网站（以下简称“本网站”）。保护您的隐私对我们非常重要。
            本隐私政策解释了我们如何收集、使用、披露、保存和保护您的信息。
            您对本网站的使用将被视为您已接受并同意本政策的全部条款。
          </p>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-blue-700 dark:text-blue-400 border-l-4 border-blue-500 pl-3 flex items-center">
              <User className="mr-2" />
              1. 引言
            </h2>
            <p className="mb-4 leading-relaxed text-slate-700 dark:text-slate-300">
              使用本网站即表示您同意按照本隐私政策收集和使用您的信息。如果您不同意本隐私政策的任何部分，请不要使用本网站。
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-blue-700 dark:text-blue-400 border-l-4 border-blue-500 pl-3 flex items-center">
              <Mail className="mr-2" />
              2. 我们收集的信息
            </h2>
            <p className="mb-4 leading-relaxed text-slate-700 dark:text-slate-300">
              当您访问和使用本网站时，我们可能会收集以下类型的信息：
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2 text-slate-700 dark:text-slate-300">
              <li>
                <strong className="text-blue-700 dark:text-blue-300">个人身份信息</strong>
                ：当您在本网站上发表评论、订阅博客更新或联系我们时，您可能会自愿向我们提供个人身份信息，如您的姓名、电子邮件地址等。
              </li>
              <li>
                <strong className="text-blue-700 dark:text-blue-300">非个人身份信息</strong>
                ：当您与本网站交互时，我们可能会收集非个人身份信息，如您的浏览器类型、操作系统、访问设备、IP地址、访问时间和日期、访问的页面等。
              </li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-blue-700 dark:text-blue-400 border-l-4 border-blue-500 pl-3 flex items-center">
              <Shield className="mr-2" />
              3. 我们如何使用收集的信息
            </h2>
            <p className="mb-4 leading-relaxed text-slate-700 dark:text-slate-300">
              我们可能会将收集到的信息用于以下目的：
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2 text-slate-700 dark:text-slate-300">
              <li>提供、运营和维护本网站</li>
              <li>改进、个性化和扩展本网站</li>
              <li>理解和分析您如何使用本网站</li>
              <li>开发新的产品、服务、功能和功能</li>
              <li>就本网站与您沟通，包括客户服务</li>
              <li>向您发送博客更新和其他相关信息（仅当您订阅时）</li>
              <li>检测和防止欺诈活动</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-blue-700 dark:text-blue-400 border-l-4 border-blue-500 pl-3 flex items-center">
              <Cookie className="mr-2" />
              4. Cookie 的使用
            </h2>
            <p className="mb-4 leading-relaxed text-slate-700 dark:text-slate-300">
              本网站使用 “cookie” 来增强用户体验。Cookie
              是网站放置在您计算机上的小型数据文件。您的浏览器会将 cookie 存储在您的计算机硬盘上。
            </p>
            <p className="mb-4 leading-relaxed text-slate-700 dark:text-slate-300">
              我们使用 cookie 来收集信息并改进我们的服务。您可以指示您的浏览器拒绝所有 cookie
              或在发送 cookie 时提示您。但是，如果您不接受 cookie，您可能无法使用本网站的某些部分。
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-blue-700 dark:text-blue-400 border-l-4 border-blue-500 pl-3 flex items-center">
              <Shield className="mr-2" />
              5. 第三方服务
            </h2>
            <p className="mb-4 leading-relaxed text-slate-700 dark:text-slate-300">
              本网站可能包含指向第三方网站、服务和产品的链接。这些第三方网站有其自己的隐私政策，我们对这些第三方的隐私实践不承担任何责任。我们建议您在访问这些第三方网站前查看其隐私政策。
            </p>
            <p className="leading-relaxed text-slate-700 dark:text-slate-300">
              本网站可能使用第三方服务（如 Google
              Analytics）来帮助分析如何使用本网站。这些服务可能会收集有关您使用网站的信息，包括您的
              IP 地址、设备信息等。
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-blue-700 dark:text-blue-400 border-l-4 border-blue-500 pl-3 flex items-center">
              <Lock className="mr-2" />
              6. 信息安全
            </h2>
            <p className="mb-4 leading-relaxed text-slate-700 dark:text-slate-300">
              我们重视您的信息安全，并采取合理的安全措施来保护您提供给我们的信息免受未授权访问、使用或披露。然而，请注意，互联网上的任何传输都不是100%安全的，我们不能保证您信息的绝对安全。
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-blue-700 dark:text-blue-400 border-l-4 border-blue-500 pl-3 flex items-center">
              <Clock className="mr-2" />
              7. 隐私政策的变更
            </h2>
            <p className="mb-4 leading-relaxed text-slate-700 dark:text-slate-300">
              我们可能会不时更新本隐私政策。当我们这样做时，我们会在本页面上修订“最后更新”日期。建议您定期查看本隐私政策，以了解我们如何保护您的信息。
            </p>
            <p className="leading-relaxed text-slate-700 dark:text-slate-300">
              您继续使用本网站即表示您接受任何修改后的隐私政策。
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-blue-700 dark:text-blue-400 border-l-4 border-blue-500 pl-3 flex items-center">
              <Mail className="mr-2" />
              8. 联系我们
            </h2>
            <p className="mb-4 leading-relaxed text-slate-700 dark:text-slate-300">
              如果您对本隐私政策有任何疑问或建议，请通过以下方式联系我们：
            </p>
            <div className="bg-blue-100 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-300 dark:border-blue-800">
              <p className="flex items-center">
                <span className="font-medium md:mr-2">电子邮件：</span>
                <a
                  href="mailto:Janhizian@163.com"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Janhizian@163.com
                </a>
              </p>
            </div>
          </section>

          <section className="mt-12 pt-6 border-t border-slate-300 dark:border-slate-700/50">
            <div className="flex items-center text-slate-600 dark:text-slate-400">
              <FileText className="text-green-600 dark:text-green-500 mr-2" />
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
              <Link
                href="/terms"
                className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                用户协议
              </Link>
              <span className="text-slate-400 dark:text-slate-600">|</span>
              <Link href="/privacy" className="text-blue-600 dark:text-blue-400 font-medium">
                隐私政策
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
