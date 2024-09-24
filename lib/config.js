import envSchema from 'env-schema'
import S from 'fluent-json-schema'

const config = envSchema({
  schema: S.object()
    .prop('PORT', S.number().default(3000))
    .prop('PRIVATE_KEY', S.string().required())
    .prop('APP_ID', S.string().required()),
  dotenv: true,
})

export default config
