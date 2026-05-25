import { useEffect, useState } from 'react';
import { TaskContextProvider, useTaskContext } from '../../context/TaskContext';
import { SaveForm } from '../../components/popup/SaveForm';
import type { Task } from '../../types/task';

interface PageMeta {
  title: string;
  url: string;
  domain: string;
  favicon?: string;
  description?: string;
  ogImage?: string;
}

function PopupContent() {
  const { addTask, tasks } = useTaskContext();
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, async tabs => {
      const tab = tabs[0];
      if (!tab?.id || !tab.url) return;
      const domain = new URL(tab.url).hostname;
      let description: string | undefined;
      let ogImage: string | undefined;
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => ({
            description:
              document.querySelector('meta[name="description"]')?.getAttribute('content') ??
              document.querySelector('meta[property="og:description"]')?.getAttribute('content') ??
              undefined,
            ogImage:
              document.querySelector('meta[property="og:image"]')?.getAttribute('content') ?? undefined,
          }),
        });
        description = results[0]?.result?.description ?? undefined;
        ogImage = results[0]?.result?.ogImage ?? undefined;
      } catch {
        // Restricted pages (chrome://, etc.) — skip metadata extraction
      }
      setMeta({ title: tab.title ?? domain, url: tab.url, domain, favicon: tab.favIconUrl, description, ogImage });
    });
  }, []);

  const buildTaskData = (form: { title: string; why: string; successCriteria: string }) =>
    ({
      title: form.title,
      url: meta!.url,
      domain: meta!.domain,
      favicon: meta!.favicon,
      description: meta!.description,
      ogImage: meta!.ogImage,
      why: form.why,
      successCriteria: form.successCriteria,
    } as Omit<Task, 'id' | 'status' | 'activeSeconds' | 'createdAt' | 'updatedAt'>);

  const handleSaveToInbox = async (form: { title: string; why: string; successCriteria: string }) => {
    await addTask(buildTaskData(form));
    setSaved(true);
    setTimeout(() => window.close(), 600);
  };

  const handleAddToToday = async (form: { title: string; why: string; successCriteria: string }) => {
    await addTask(buildTaskData(form), true);
    setSaved(true);
    setTimeout(() => window.close(), 600);
  };

  if (saved) return <div style={{ padding: 16, fontFamily: 'system-ui' }}>Saved ✓</div>;
  if (!meta) return <div style={{ padding: 16, fontFamily: 'system-ui' }}>Loading…</div>;

  const existingTask = tasks.find(t => t.url === meta.url && t.status !== 'done');
  const existingLocation = existingTask
    ? (existingTask.status === 'inbox' ? 'inbox' : 'today')
    : undefined;

  return (
    <SaveForm
      initialTitle={meta.title}
      url={meta.url}
      domain={meta.domain}
      favicon={meta.favicon}
      existingLocation={existingLocation}
      onSaveToInbox={handleSaveToInbox}
      onAddToToday={handleAddToToday}
    />
  );
}

export default function App() {
  return (
    <TaskContextProvider>
      <PopupContent />
    </TaskContextProvider>
  );
}
