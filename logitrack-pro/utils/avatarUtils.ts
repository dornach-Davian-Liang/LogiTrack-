/**
 * Avatar Utility Functions
 * Generate user avatars based on username
 */

// 颜色池 - 为用户名生成一致的颜色
const colorPool = [
  '#FF6B6B', // 红色
  '#4ECDC4', // 青色
  '#45B7D1', // 蓝色
  '#FFA07A', // 浅鲑鱼色
  '#98D8C8', // 薄荷色
  '#FF7675', // 红色
  '#FF85C0', // 粉色
  '#A0D995', // 绿色
  '#FFB236', // 橙色
  '#845EC2', // 紫色
  '#D65DB1', // 品红色
  '#FF9671', // 珊瑚红
];

/**
 * 根据用户名生成一致的颜色
 */
export const getColorFromUsername = (username: string): string => {
  const hash = username.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  return colorPool[hash % colorPool.length];
};

/**
 * 获取用户名的缩写（最多2个字符）
 */
export const getAvatarInitials = (username: string): string => {
  if (!username) return '?';
  
  const parts = username.split(/[\s\-_.]/);
  
  if (parts.length > 1) {
    // 多个单词，取每个单词的首字母
    return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  } else {
    // 单个单词，取前两个字符
    return username.slice(0, 2).toUpperCase();
  }
};

/**
 * 生成用户头像 HTML
 */
export const generateAvatarHTML = (username: string, size: number = 36): string => {
  const initials = getAvatarInitials(username);
  const color = getColorFromUsername(username);
  
  const fontSize = Math.max(size / 2 - 4, 12);
  
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${color}"/>
      <text 
        x="${size / 2}" 
        y="${size / 2 + fontSize / 3}" 
        font-size="${fontSize}" 
        font-weight="bold" 
        text-anchor="middle" 
        dominant-baseline="middle" 
        fill="white" 
        font-family="system-ui, -apple-system, sans-serif"
      >
        ${initials}
      </text>
    </svg>
  `;
};

/**
 * 创建64位的SVG Data URL
 */
export const getAvatarDataUrl = (username: string, size: number = 36): string => {
  const svg = generateAvatarHTML(username, size);
  const encoded = btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${encoded}`;
};
