const STORAGE_KEY = 'story_app_data_v1';

interface StoreData {
  characters: any[];
  events: any[];
  backgrounds: any[];
  affiliations: any[];
  relationships: any[];
  groups: any[];
  dialogues: any[];
  settings: { title: string };
}

const getDefaultStore = (): StoreData => ({
  characters: [],
  events: [],
  backgrounds: [],
  affiliations: [],
  relationships: [],
  groups: [],
  dialogues: [],
  settings: { title: '이야기 결' }
});

const getStore = (): StoreData => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    const initial = getDefaultStore();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  try {
    const parsed = JSON.parse(data);
    return {
      characters: Array.isArray(parsed.characters) ? parsed.characters : [],
      events: Array.isArray(parsed.events) ? parsed.events : [],
      backgrounds: Array.isArray(parsed.backgrounds) ? parsed.backgrounds : [],
      affiliations: Array.isArray(parsed.affiliations) ? parsed.affiliations : [],
      relationships: Array.isArray(parsed.relationships) ? parsed.relationships : [],
      groups: Array.isArray(parsed.groups) ? parsed.groups : [],
      dialogues: Array.isArray(parsed.dialogues) ? parsed.dialogues : [],
      settings: parsed.settings && typeof parsed.settings.title === 'string' ? parsed.settings : { title: '이야기 결' }
    };
  } catch (e) {
    return getDefaultStore();
  }
};

const saveStore = (data: StoreData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const makeResponse = (data: any, status = 200) => {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
  };
};

export const api = async (path: string, init?: RequestInit) => {
  const store = getStore();
  const method = (init?.method || 'GET').toUpperCase();
  const body = init?.body ? JSON.parse(init.body as string) : null;
  const cleanPath = path.replace(/^\/+/, '').replace(/\/+$/, '');

  // 1. Story Reset (초기화)
  if (cleanPath === 'story-reset' && method === 'POST') {
    const emptyStore = getDefaultStore();
    saveStore(emptyStore);
    return makeResponse({ ok: true });
  }

  // 2. Story Import (불러오기)
  if (cleanPath === 'story-import' && method === 'POST') {
    const importedStore: StoreData = {
      characters: body?.characters || [],
      events: body?.events || [],
      backgrounds: body?.backgrounds || [],
      affiliations: body?.affiliations || [],
      relationships: body?.relationships || [],
      groups: body?.groups || [],
      dialogues: body?.dialogues || [],
      settings: body?.settings || { title: '이야기 결' }
    };
    saveStore(importedStore);
    return makeResponse({ ok: true });
  }

  // 3. Story Settings
  if (cleanPath === 'story-settings') {
    if (method === 'GET') return makeResponse({ title: store.settings.title });
    if (method === 'PUT') {
      store.settings.title = body?.title || store.settings.title;
      saveStore(store);
      return makeResponse(store.settings);
    }
  }

  // 4. Characters (인물)
  if (cleanPath === 'characters') {
    if (method === 'GET') return makeResponse(store.characters);
    if (method === 'POST') {
      const newChar = {
        id: Date.now(),
        name: body.name,
        description: body.description || '',
        photo_data: body.photo_data || '',
        affiliation_ids: body.affiliation_ids || []
      };
      store.characters.push(newChar);
      saveStore(store);
      return makeResponse(newChar);
    }
  }

  if (cleanPath.startsWith('characters/')) {
    const id = Number(cleanPath.split('/')[1]);
    if (method === 'PUT') {
      const index = store.characters.findIndex((c) => Number(c.id) === id);
      if (index !== -1) {
        store.characters[index] = { ...store.characters[index], ...body };
        saveStore(store);
        return makeResponse(store.characters[index]);
      }
    }
    if (method === 'DELETE') {
      store.characters = store.characters.filter((c) => Number(c.id) !== id);
      saveStore(store);
      return makeResponse({ ok: true });
    }
  }

  // 5. Events (사건)
  if (cleanPath === 'events') {
    if (method === 'GET') return makeResponse(store.events);
    if (method === 'POST') {
      const newEvent = {
        id: Date.now(),
        title: body.title,
        happened_at: body.happened_at,
        description: body.description || '',
        photo_data: body.photo_data || '',
        character_ids: body.character_ids || [],
        background_ids: body.background_ids || []
      };
      store.events.push(newEvent);
      saveStore(store);
      return makeResponse(newEvent);
    }
  }

  if (cleanPath.startsWith('events/') && !cleanPath.endsWith('/dialogues')) {
    const id = Number(cleanPath.split('/')[1]);
    if (method === 'PUT') {
      const index = store.events.findIndex((e) => Number(e.id) === id);
      if (index !== -1) {
        store.events[index] = { ...store.events[index], ...body };
        saveStore(store);
        return makeResponse(store.events[index]);
      }
    }
    if (method === 'DELETE') {
      store.events = store.events.filter((e) => Number(e.id) !== id);
      store.dialogues = store.dialogues.filter((d) => Number(d.event_id) !== id);
      saveStore(store);
      return makeResponse({ ok: true });
    }
  }

  // 6. Dialogues (코멘트)
  if (cleanPath.startsWith('events/') && cleanPath.endsWith('/dialogues')) {
    const eventId = Number(cleanPath.split('/')[1]);
    if (method === 'GET') {
      const filtered = store.dialogues.filter((d) => Number(d.event_id) === eventId);
      return makeResponse(filtered);
    }
    if (method === 'POST') {
      const newDialogue = {
        id: Date.now(),
        event_id: eventId,
        character_id: body.character_id,
        message: body.message,
        created_at: new Date().toISOString()
      };
      store.dialogues.push(newDialogue);
      saveStore(store);
      return makeResponse(newDialogue);
    }
  }

  if (cleanPath.startsWith('dialogues/')) {
    const id = Number(cleanPath.split('/')[1]);
    if (method === 'DELETE') {
      store.dialogues = store.dialogues.filter((d) => Number(d.id) !== id);
      saveStore(store);
      return makeResponse({ ok: true });
    }
  }

  // 7. Backgrounds (배경)
  if (cleanPath === 'backgrounds') {
    if (method === 'GET') return makeResponse(store.backgrounds);
    if (method === 'POST') {
      const item = { id: Date.now(), ...body };
      store.backgrounds.push(item);
      saveStore(store);
      return makeResponse(item);
    }
  }

  if (cleanPath.startsWith('backgrounds/')) {
    const id = Number(cleanPath.split('/')[1]);
    if (method === 'PUT') {
      const index = store.backgrounds.findIndex((b) => Number(b.id) === id);
      if (index !== -1) {
        store.backgrounds[index] = { ...store.backgrounds[index], ...body };
        saveStore(store);
        return makeResponse(store.backgrounds[index]);
      }
    }
    if (method === 'DELETE') {
      store.backgrounds = store.backgrounds.filter((b) => Number(b.id) !== id);
      saveStore(store);
      return makeResponse({ ok: true });
    }
  }

  // 8. Affiliations (소속)
  if (cleanPath === 'affiliations') {
    if (method === 'GET') return makeResponse(store.affiliations);
    if (method === 'POST') {
      const item = { id: Date.now(), ...body };
      store.affiliations.push(item);
      saveStore(store);
      return makeResponse(item);
    }
  }

  if (cleanPath.startsWith('affiliations/')) {
    const id = Number(cleanPath.split('/')[1]);
    if (method === 'DELETE') {
      store.affiliations = store.affiliations.filter((a) => Number(a.id) !== id);
      saveStore(store);
      return makeResponse({ ok: true });
    }
  }

  // 9. Relationships (개인 관계)
  if (cleanPath === 'relationships') {
    if (method === 'GET') return makeResponse(store.relationships);
    if (method === 'POST') {
      const item = { id: Date.now(), ...body };
      store.relationships.push(item);
      saveStore(store);
      return makeResponse(item);
    }
  }

  if (cleanPath.startsWith('relationships/')) {
    const id = Number(cleanPath.split('/')[1]);
    if (method === 'DELETE') {
      store.relationships = store.relationships.filter((r) => Number(r.id) !== id);
      saveStore(store);
      return makeResponse({ ok: true });
    }
  }

  // 10. Relationship Groups (관계 그룹)
  if (cleanPath === 'relationship-groups') {
    if (method === 'GET') return makeResponse(store.groups);
    if (method === 'POST') {
      const item = { id: Date.now(), ...body };
      store.groups.push(item);
      saveStore(store);
      return makeResponse(item);
    }
  }

  if (cleanPath.startsWith('relationship-groups/')) {
    const id = Number(cleanPath.split('/')[1]);
    if (method === 'DELETE') {
      store.groups = store.groups.filter((g) => Number(g.id) !== id);
      saveStore(store);
      return makeResponse({ ok: true });
    }
  }

  return makeResponse({ ok: true });
};
