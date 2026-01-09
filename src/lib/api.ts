// API接口地址配置
// 通过修改API_BASE_URL来切换不同的环境
export const API_BASE_URL = 'https://www.hanphone.top/api'
// export const NEXT_API_BASE_URL = 'https://www.hanphone.top/next-api'
export const NEXT_API_BASE_URL = 'http://localhost:8090/next-api'
// export const API_BASE_URL = 'http://localhost:8090'
export const PICTURE_BASE_URL = 'https://hanphone.top'
// 通过修改ENDPOINTS可以修改API接口路径
export const ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/login`,
  REGISTER: `${API_BASE_URL}/register`,
  SEARCH: `${API_BASE_URL}/search`,
  BLOG: `${API_BASE_URL}/blog`,
  BLOGS: `${API_BASE_URL}/blogs`,
  PROJECTS: `${API_BASE_URL}/projects`,
  FRIENDLINKS: `${API_BASE_URL}/friendLinks`,
  RECOMMEND_BLOG_LIST: `${API_BASE_URL}/getRecommendBlogList`,
  TYPE_LIST: `${API_BASE_URL}/getTypeList`,
  TAG_LIST: `${API_BASE_URL}/getTagList`,
  FULL_TYPE_LIST: `${API_BASE_URL}/getFullTypeList`,
  FULL_TAG_LIST: `${API_BASE_URL}/getFullTagList`,
  TYPE_BLOGS: (id: number) => `${API_BASE_URL}/types/${id}`,
  TAG_BLOGS: (id: number) => `${API_BASE_URL}/tags/${id}`,
  MESSAGES: `${API_BASE_URL}/messages`,
  ESSAYS: `${API_BASE_URL}/essays`,
  RECOMMEND_BLOGS: `${API_BASE_URL}/getRecommendBlogList`,
  UPLOAD_BLOG_IMAGE: `${API_BASE_URL}/upload/blogs`,
  COMMENTS: `${API_BASE_URL}/comments`,
  GET_VISIT_COUNT: `${API_BASE_URL}/getVisitCount`,
  FILE: {
    UPLOAD: `${PICTURE_BASE_URL}/upload/`,
    DELETE: `${PICTURE_BASE_URL}/delete/`,
    GET_FILE: `${PICTURE_BASE_URL}/file/`,
    GET_FILES: `${PICTURE_BASE_URL}/files/`,
    DIRECTORY: `${PICTURE_BASE_URL}/directory/`
  },
  CHAT: {
    POST_PRIVATE_MESSAGES: `${NEXT_API_BASE_URL}/postPrivateMessages`,
    GET_PRIVATE_MESSAGES: `${NEXT_API_BASE_URL}/getPrivateMessages`,
    GETUSER: `${NEXT_API_BASE_URL}/user`
  },
  USER: {
    PERSONINFOS: `${API_BASE_URL}/personInfos`,
    SET_AVATAR: `${API_BASE_URL}/admin/setAvatar`,
    SEND_CAPTCHA: `${API_BASE_URL}/user/sendCaptcha`,
    FORGET_PASSWORD: `${API_BASE_URL}/user/resetPassword`,
    RESET_PASSWORD: `${API_BASE_URL}/admin/user/resetPassword`
  },
  ADMIN: {
    USERS: `${API_BASE_URL}/admin/users`,
    PERSONINFOS: `${API_BASE_URL}/admin/personInfos`,
    PERSONINFO: `${API_BASE_URL}/admin/personInfo`,
    GETBLOGCOUNT: `${API_BASE_URL}/admin/getBlogCount`,
    GET_VISIT_COUNT_BY_MONTH: `${API_BASE_URL}/admin/getVisitCountByMonth`,
    GETVIEWCOUNT: `${API_BASE_URL}/admin/getViewCount`,
    GETAPPRECIATECOUNT: `${API_BASE_URL}/admin/getAppreciateCount`,
    GETCOMMENTCOUNT: `${API_BASE_URL}/admin/getCommentCount`,
    GETBLOGLIKES: `${API_BASE_URL}/admin/getBlogLikes`,
    BLOG_RECOMMEND: `${API_BASE_URL}/admin/blogs/recommend`,
    ESSAY_RECOMMEND: `${API_BASE_URL}/admin/essays/recommend`,
    PROJECT_RECOMMEND: `${API_BASE_URL}/admin/projects/recommend`,
    FRIENDLINK_RECOMMEND: `${API_BASE_URL}/admin/friendLinks/recommend`,
    LIKES_BY_MONTH: `${API_BASE_URL}/admin/getLikesByMonth`,
    VIEWS_BY_MONTH: `${API_BASE_URL}/admin/getViewCountByMonth`,
    BLOGS_BY_MONTH: `${API_BASE_URL}/admin/getBlogCountByMonth`,
    APPRECIATES_BY_MONTH: `${API_BASE_URL}/admin/getAppreciateCountByMonth`,
    COMMENTS_BY_MONTH: `${API_BASE_URL}/admin/getCommentCountByMonth`,
    FULL_TAG_LIST: `${API_BASE_URL}/admin/getFullTagList`,
    GET_FULL_TAG_LIST_AND_BLOG_NUMBER: `${API_BASE_URL}/admin/getFullTagListAndBlogNumber`,
    FULL_TYPE_LIST: `${API_BASE_URL}/admin/getFullTypeList`,
    USER_AREA_LIST: `${API_BASE_URL}/admin/getUserAreaList`,
    COMMMENT_LIST: `${API_BASE_URL}/admin/getCommentList`,
    BLOG_LIST: `${API_BASE_URL}/admin/getBlogList`,
    BLOGS: `${API_BASE_URL}/admin/blogs`,
    USER: `${API_BASE_URL}/admin/user`,
    TAGS: `${API_BASE_URL}/admin/tags`,
    TYPES: `${API_BASE_URL}/admin/types`,
    PROJECT: `${API_BASE_URL}/admin/project`,
    PROJECTS: `${API_BASE_URL}/admin/projects`,
    FRIENDLINK: `${API_BASE_URL}/admin/friendLink`,
    FRIENDLINKS: `${API_BASE_URL}/admin/friendLinks`,
    ESSAY: `${API_BASE_URL}/admin/essay`,
    ESSAYS: `${API_BASE_URL}/admin/essays`,
    DEAL_DELETED_TAG: `${API_BASE_URL}/admin/dealDeletedTag`
  }
}
