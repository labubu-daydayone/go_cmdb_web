/**
 * @name 代理的配置
 * @see 在生产环境 代理是无法生效的，所以这里没有生产环境的配置
 * -------------------------------
 * The agent cannot take effect in the production environment
 * so there is no configuration of the production environment
 * For details, please see
 * https://pro.ant.design/docs/deploy
 *
 * @doc https://umijs.org/docs/guides/proxy
 */
export default {
  /**
   * @name 开发环境代理配置
   * @description 开发环境下，将 /api 请求代理到后端服务器
   */
  dev: {
    '/api/': {
      // 后端服务器地址
      target: 'http://20.2.140.226:8080',
      // 允许跨域
      changeOrigin: true,
      // 不重写路径，保持 /api 前缀
      pathRewrite: { '^': '' },
    },
  },
  /**
   * @name 测试环境代理配置
   */
  test: {
    '/api/': {
      target: 'http://20.2.140.226:8080',
      changeOrigin: true,
      pathRewrite: { '^': '' },
    },
  },
  /**
   * @name 预发布环境代理配置
   */
  pre: {
    '/api/': {
      target: 'http://20.2.140.226:8080',
      changeOrigin: true,
      pathRewrite: { '^': '' },
    },
  },
};
