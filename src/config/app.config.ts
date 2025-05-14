export const EnvConfiguration = () => ({
  environment: process.env.NODE_ENV || 'dev',
  mongoDb: process.env.MONGO_DB,
  port: process.env.PORT || 3001
})