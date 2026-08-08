const STORAGE_KEY = 'story_app_data_v1';

interface StoreData {
  characters: any[];
  events: any[];
  backgrounds: any[];
  affiliations: any[];
  relationships: any[];
  groups: any[];
  settings: { title: string };
}

const getStore = (): StoreData => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    const initial: StoreData = {
      characters: [],
      events: [],
      backgrounds: [],
      affiliations: [],
      relationships: [],
      groups: [],
      settings: { title: '이야기 결' }
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(data);
};

const saveStore = (data: StoreData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// fetch API 응답 객체(Response) 모방 함수
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
  const method = init?.method || 'GET';
  const body = init?.body ? JSON.parse(init.body as string) : null;
  const cleanPath = path.replace(/^\/+/, '');

  // 1. Story Settings
  if (cleanPath === 'story-settings') {
    if (method === 'GET') return makeResponse({ title: store.settings.title });
    if (method === 'PUT') {
      store.settings.title = body.title;
      saveStore(store);
      return makeResponse(store.settings);
    }
  }

  // 2. Characters
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
    const parts = cleanPath.split('/');
    const id = Number(parts[1]);
    if (method === 'PUT') {
      const index = store.characters.findIndex((c) => c.id === id);
      if (index !== -1) {
        store.characters[index] = { ...store.characters[index], ...body };
        saveStore(store);
        return makeResponse(store.characters[index]);
      }
    }
    if (method === 'DELETE') {
      store.characters = store.characters.filter((c) => c.id !== id);
      saveStore(store);
      return makeResponse({ ok: true });
    }
  }

  // 3. Events
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

  // 4. Backgrounds & Affiliations & Relationships
  if (cleanPath === 'backgrounds') {
    if (method === 'GET') return makeResponse(store.backgrounds);
    if (method === 'POST') {
      const item = { id: Date.now(), ...body };
      store.backgrounds.push(item);
      saveStore(store);
      return makeResponse(item);
    }
  }

  if (cleanPath === 'affiliations') {
    if (method === 'GET') return makeResponse(store.affiliations);
    if (method === 'POST') {
      const item = { id: Date.now(), ...body };
      store.affiliations.push(item);
      saveStore(store);
      return makeResponse(item);
    }
  }

  if (cleanPath === 'relationships') {
    if (method === 'GET') return makeResponse(store.relationships);
    if (method === 'POST') {
      const item = { id: Date.now(), ...body };
      store.relationships.push(item);
      saveStore(store);
      return makeResponse(item);
    }
  }

  if (cleanPath === 'relationship-groups') {
    if (method === 'GET') return makeResponse(store.groups);
    if (method === 'POST') {
      const item = { id: Date.now(), ...body };
      store.groups.push(item);
      saveStore(store);
      return makeResponse(item);
    }
  }

  return makeResponse([]);
};
