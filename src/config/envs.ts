import 'dotenv/config'
import * as process from 'node:process'
import * as pckg from '../../package.json'

export type Envs = {
  POSTGRES_HOST: string;
  POSTGRES_PORT: string;
  POSTGRES_USER: string;
  POSTGRES_PASSWORD: string;
  POSTGRES_DB: string;
  TOKEN: string;
  AURA_CHANNEL_ID: string;
  RANKING_CHANNEL_ID: string;
  GUILD_ID: string;
  NODE_ENV?: string;
};

const customConfig = Object.assign({}, process.env, {
  SERVER_NAME: pckg.name,
  SERVER_DESCRIPTION: pckg.description,
  SERVER_VERSION: pckg.version,
})

export const envs = new Proxy(customConfig as unknown as Envs, {
  get(target: Envs, p: string | symbol) {
    return target[p as keyof Envs];
  },
});
