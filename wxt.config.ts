import { defineConfig } from 'wxt';

export default defineConfig({
  extensionApi: 'chrome',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'QuestTab',
    description: 'Daily learning quest planner — turn web pages into focused, trackable tasks',
    permissions: ['storage', 'tabs', 'scripting', 'activeTab'],
    host_permissions: ['<all_urls>'],
  },
});
