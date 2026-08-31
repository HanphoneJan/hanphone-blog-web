// 文件类型
type FileType = 'image' | 'video' | 'text' | 'other'

// 画廊文件项（url + 展示类型）
interface GalleryFile {
  url: string
  type: FileType
}

// 文件列表接口：Media 为图片/视频（按存储顺序，可混排），Files 为文档及其他文件（按存储顺序）
interface FileList {
  Media: GalleryFile[]
  Files: GalleryFile[]
}

// API返回的文件接口
interface EssayFileUrl {
  id: number
  url: string
  urlType: 'IMAGE' | 'VIDEO' | 'TEXT' | 'OTHER'
  urlDesc?: string | null
  isValid: boolean
  createTime: string
}

// 评论接口
interface Comment {
  id: number
  userId: number
  nickname: string
  avatar: string
  content: string
  createTime: string
  parentCommentId?: number | null
  repliedToNickname?: string | null
  adminComment: boolean
}

// API返回的用户接口
interface ApiUser {
  id: number
  nickname: string
  username: string
  password: string
  email: string
  avatar: string
  loginProvince: string
  loginCity: string
  loginLat: string
  loginLng: string
  type: string
  createTime: string
  updateTime: string
  lastLoginTime: string
}

// 用户信息接口
interface UserInfo {
  avatar?: string
  nickname?: string
  username?: string
  type?: string
  id?: number | null
  email?: string
  loginProvince?: string
  loginCity?: string
}

// API返回的评论接口
interface ApiComment {
  id: number
  user: ApiUser
  createTime: string | null
  essay?: Record<string, unknown>
  parentCommentId: number | null
  adminComment: boolean
  content: string
}

// 随笔接口
interface Essay {
  id: number
  userId: number
  nickname: string
  avatar: string
  title: string
  content: string
  createTime: string
  likeCount: number
  isLiked: boolean
  fileList?: FileList
  comments: Comment[]
  commentCount: number
  recommend: boolean
}

// API返回的随笔接口
interface ApiEssay {
  id: number
  likes?: number | null
  liked: boolean
  user: ApiUser
  title: string
  content: string
  color?: string | null
  image?: string | null
  createTime: string
  essayFileUrls?: EssayFileUrl[]
  essayComments?: ApiComment[]
  recommend: boolean
}

// Reducer状态
interface EssayState {
  essays: Essay[]
  loading: boolean
  commentInputs: Record<number, string>
  replyInputs: Record<number, string>
  showReplyBox: Record<number, boolean>
}

// Reducer动作类型
type EssayAction =
  | { type: 'SET_ESSAYS'; payload: Essay[] }
  | { type: 'ADD_ESSAYS'; payload: Essay[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_LIKE'; payload: { essayId: number; isLiked: boolean; likeCount: number } }
  | { type: 'ADD_COMMENT'; payload: { essayId: number; comment: Comment } }
  | { type: 'DELETE_COMMENT'; payload: { essayId: number; commentId: number } }
  | { type: 'SET_COMMENT_INPUT'; payload: { essayId: number; value: string } }
  | { type: 'SET_REPLY_INPUT'; payload: { commentId: number; value: string } }
  | { type: 'TOGGLE_REPLY_BOX'; payload: { commentId: number; value: boolean } }

export type {
  FileType,
  GalleryFile,
  FileList,
  EssayFileUrl,
  Comment,
  ApiUser,
  UserInfo,
  ApiComment,
  Essay,
  ApiEssay,
  EssayState,
  EssayAction
}
