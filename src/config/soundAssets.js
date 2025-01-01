/*
 * @Author: hiddenSharp429 z404878860@163.com
 * @Date: 2024-12-01 16:54:04
 */
/**
 * 打字音效配置
 * @typedef {Object} SoundrItem
 * @property {string} path - 路由路径
 * @property {string} name - 显示名称
 * @property {string} id
 */

export const SOUND_ASSETS = {
  typewriter: {
    id: 'typewriter',
    name: '打字机',
    path: '/sounds/typewriter.mp3'
  },
  soft: {
    id: 'soft',
    name: '轻柔按键',
    path: '/sounds/soft-keyboard.mp3'
  },
  mahjong: {
    id: 'mahjong',
    name: '麻将',
    path: '/sounds/mahjong.mp3'
  },
  bubble: {
    id: 'bubble',
    name: '泡泡破裂',
    path: '/sounds/bubble.mp3'
  }
};
