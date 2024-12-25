/**
 * 导航菜单配置
 * @typedef {Object} NavigatorItem
 * @property {string} path - 路由路径
 * @property {string} label - 显示文本
 * @property {string} icon - Material Icon 名称
 * @property {boolean} [hidden] - 是否在菜单中隐藏
 * @property {string} [permission] - 访问所需权限
 */

export const NAVIGATOR_ASSETS = {
  gamelobby: {
    path: '/game-lobby',
    label: '游戏大厅',
    icon: 'sports_esports',
    permission: 'user'
  },
  personal: {
    path: '/personal',
    label: '个人中心',
    icon: 'person',
    permission: 'user'
  },
  settings: {
    path: '/settings',
    label: '设置',
    icon: 'settings',
    permission: 'user'
  },
  matchMakelobby: {
    path: '/macth-make-lobby',
    label: '匹配大厅',
    icon: 'military_tech',
    permisson: 'user'
  }
};

/**
 * 获取可见的导航菜单项
 * @param {string[]} [userPermissions=[]] - 用户权限列表
 * @returns {NavigatorItem[]} 过滤后的导航项数组
 */
export const getVisibleNavigators = (userPermissions = []) => {
  return Object.values(NAVIGATOR_ASSETS)
    .filter(item => {
      // 如果项目被标记为隐藏，则不显示
      if (item.hidden) return false;
      // 如果需要权限且用户没有对应权限，则不显示
      if (item.permission && !userPermissions.includes(item.permission)) return false;
      return true;
    });
};