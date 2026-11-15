import type AppConfig from '@/server/config/AppConfig';
import parseConfig from '@/server/config/parseConfig';

const state: { config: AppConfig | null } = {config: null};

export default function getConfig(): AppConfig {
    if (state.config === null) {
        state.config = parseConfig(process.env);
    }
    return state.config;
}
