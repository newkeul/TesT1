import os
import sqlite3
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "..", "data", "app.db")
def get_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn
def init_db():
    with get_db() as conn:
        conn.executescript('''
        CREATE TABLE IF NOT EXISTS characters (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          happened_at TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS relationships (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          from_id INTEGER NOT NULL,
          to_id INTEGER NOT NULL,
          relation_type TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(from_id) REFERENCES characters(id) ON DELETE CASCADE,
          FOREIGN KEY(to_id) REFERENCES characters(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS event_characters (
          event_id INTEGER NOT NULL,
          character_id INTEGER NOT NULL,
          PRIMARY KEY(event_id, character_id),
          FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE,
          FOREIGN KEY(character_id) REFERENCES characters(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS relationship_groups (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS relationship_group_members (
          group_id INTEGER NOT NULL,
          character_id INTEGER NOT NULL,
          PRIMARY KEY(group_id, character_id),
          FOREIGN KEY(group_id) REFERENCES relationship_groups(id) ON DELETE CASCADE,
          FOREIGN KEY(character_id) REFERENCES characters(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS character_event_comments (
          event_id INTEGER NOT NULL,
          character_id INTEGER NOT NULL,
          comment TEXT NOT NULL DEFAULT '',
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY(event_id, character_id),
          FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE,
          FOREIGN KEY(character_id) REFERENCES characters(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS event_dialogues (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          event_id INTEGER NOT NULL,
          character_id INTEGER NOT NULL,
          message TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE,
          FOREIGN KEY(character_id) REFERENCES characters(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS backgrounds (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS event_backgrounds (
          event_id INTEGER NOT NULL,
          background_id INTEGER NOT NULL,
          PRIMARY KEY(event_id, background_id),
          FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE,
          FOREIGN KEY(background_id) REFERENCES backgrounds(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS affiliations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          color_r INTEGER NOT NULL DEFAULT 117,
          color_g INTEGER NOT NULL DEFAULT 99,
          color_b INTEGER NOT NULL DEFAULT 183,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS character_affiliations (
          character_id INTEGER NOT NULL,
          affiliation_id INTEGER NOT NULL,
          PRIMARY KEY(character_id, affiliation_id),
          FOREIGN KEY(character_id) REFERENCES characters(id) ON DELETE CASCADE,
          FOREIGN KEY(affiliation_id) REFERENCES affiliations(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS story_settings (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          title TEXT NOT NULL DEFAULT '이야기 결'
        );
        INSERT OR IGNORE INTO story_settings(id, title) VALUES (1, '이야기 결');
        ''')
        event_columns = [row['name'] for row in conn.execute('PRAGMA table_info(events)')]
        if 'photo_data' not in event_columns:
            conn.execute("ALTER TABLE events ADD COLUMN photo_data TEXT NOT NULL DEFAULT ''")
        relationship_columns = [row['name'] for row in conn.execute('PRAGMA table_info(relationships)')]
        if 'origin_event_id' not in relationship_columns:
            conn.execute('ALTER TABLE relationships ADD COLUMN origin_event_id INTEGER')
        columns = [row['name'] for row in conn.execute('PRAGMA table_info(characters)')]
        if 'photo_data' not in columns:
            conn.execute("ALTER TABLE characters ADD COLUMN photo_data TEXT NOT NULL DEFAULT ''")
        background_columns = [row['name'] for row in conn.execute('PRAGMA table_info(backgrounds)')]
        if 'photo_data' not in background_columns:
            conn.execute("ALTER TABLE backgrounds ADD COLUMN photo_data TEXT NOT NULL DEFAULT ''")
        affiliation_columns = [row['name'] for row in conn.execute('PRAGMA table_info(affiliations)')]
        if 'description' not in affiliation_columns:
            conn.execute("ALTER TABLE affiliations ADD COLUMN description TEXT NOT NULL DEFAULT ''")
        group_columns = [row['name'] for row in conn.execute('PRAGMA table_info(relationship_groups)')]
        if 'name' not in group_columns:
            conn.execute("ALTER TABLE relationship_groups ADD COLUMN name TEXT NOT NULL DEFAULT ''")
        if 'description' not in group_columns:
            conn.execute("ALTER TABLE relationship_groups ADD COLUMN description TEXT NOT NULL DEFAULT ''")
        if 'origin_event_id' not in group_columns:
            conn.execute('ALTER TABLE relationship_groups ADD COLUMN origin_event_id INTEGER')
        if 'relation_type' in group_columns:
            conn.execute("UPDATE relationship_groups SET relation_type = COALESCE(NULLIF(relation_type, ''), name)")
app = FastAPI()
init_db()
class CharacterPayload(BaseModel):
    name: str
    description: str = ''
    photo_data: str = ''
    affiliation_ids: list[int] = []
class EventPayload(BaseModel):
    title: str
    happened_at: str
    description: str = ''
    photo_data: str = ''
    character_ids: list[int] = []
    background_ids: list[int] = []
class RelationshipPayload(BaseModel):
    from_id: int
    to_id: int
    relation_type: str
    description: str = ''
    origin_event_id: int | None = None
class GroupPayload(BaseModel):
    name: str
    description: str = ''
    character_ids: list[int] = []
    origin_event_id: int | None = None
class CharacterEventCommentPayload(BaseModel):
    comment: str
class DialoguePayload(BaseModel):
    character_id: int
    message: str
class AffiliationPayload(BaseModel):
    name: str
    description: str = ''
    color_r: int
    color_g: int
    color_b: int
class StoryImportPayload(BaseModel):
    version: int = 1
    characters: list[dict] = []
    events: list[dict] = []
    backgrounds: list[dict] = []
    affiliations: list[dict] = []
    relationships: list[dict] = []
    groups: list[dict] = []
def row_dict(row):
    return dict(row)
def ensure_character_ids(conn, character_ids, minimum=0):
    ids = list(dict.fromkeys(character_ids))
    if len(ids) < minimum:
        raise HTTPException(400, f'인물을 {minimum}명 이상 선택해 주세요.')
    if ids:
        marks = ','.join('?' for _ in ids)
        valid = {row['id'] for row in conn.execute(f'SELECT id FROM characters WHERE id IN ({marks})', ids)}
        if len(valid) != len(ids):
            raise HTTPException(400, '선택한 인물을 찾을 수 없어요.')
    return ids
@app.get('/api/health')
def health():
    return {'ok': True}
@app.get('/api/story-settings')
def get_story_settings():
    with get_db() as conn:
        row = conn.execute('SELECT title FROM story_settings WHERE id=1').fetchone()
        return {'title': row['title'] if row else '이야기 결'}
@app.put('/api/story-settings')
def update_story_settings(item: dict):
    title = str(item.get('title', '')).strip()
    if not title:
        raise HTTPException(400, '이야기 제목을 입력해 주세요.')
    if len(title) > 60:
        raise HTTPException(400, '이야기 제목은 60자 이하로 입력해 주세요.')
    with get_db() as conn:
        conn.execute('INSERT INTO story_settings(id, title) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET title=excluded.title', (title,))
    return {'title': title}
@app.post('/api/story-reset')
def reset_story():
    with get_db() as conn:
        conn.execute('PRAGMA foreign_keys = OFF')
        for table in ['character_event_comments', 'event_characters', 'event_backgrounds', 'character_affiliations', 'relationship_group_members', 'relationships', 'relationship_groups', 'events', 'backgrounds', 'characters', 'affiliations']:
            conn.execute(f'DELETE FROM {table}')
        conn.execute('PRAGMA foreign_keys = ON')
    return {'ok': True}
@app.post('/api/story-import')
def import_story(item: StoryImportPayload):
    try:
        with get_db() as conn:
            conn.execute('PRAGMA foreign_keys = OFF')
            for table in ['character_event_comments', 'event_characters', 'event_backgrounds', 'character_affiliations', 'relationship_group_members', 'relationships', 'relationship_groups', 'events', 'backgrounds', 'characters', 'affiliations']:
                conn.execute(f'DELETE FROM {table}')
            affiliation_ids = set()
            for row in item.affiliations:
                identifier = int(row.get('id', 0))
                name = str(row.get('name', '')).strip()
                if identifier <= 0 or not name:
                    continue
                conn.execute('INSERT INTO affiliations(id,name,description,color_r,color_g,color_b) VALUES (?,?,?,?,?,?)', (identifier, name, str(row.get('description', '')).strip(), max(0, min(255, int(row.get('color_r', 117)))), max(0, min(255, int(row.get('color_g', 99)))), max(0, min(255, int(row.get('color_b', 183))))))
                affiliation_ids.add(identifier)
            character_ids = set()
            character_affiliations = []
            for row in item.characters:
                identifier = int(row.get('id', 0))
                name = str(row.get('name', '')).strip()
                if identifier <= 0 or not name:
                    continue
                conn.execute('INSERT INTO characters(id,name,description,photo_data) VALUES (?,?,?,?)', (identifier, name, str(row.get('description', '')).strip(), str(row.get('photo_data', ''))))
                character_ids.add(identifier)
                character_affiliations.extend((identifier, int(affiliation_id)) for affiliation_id in row.get('affiliation_ids', []) if int(affiliation_id) in affiliation_ids)
            conn.executemany('INSERT OR IGNORE INTO character_affiliations(character_id,affiliation_id) VALUES (?,?)', character_affiliations)
            background_ids = set()
            for row in item.backgrounds:
                identifier = int(row.get('id', 0))
                name = str(row.get('name', '')).strip()
                if identifier <= 0 or not name:
                    continue
                conn.execute('INSERT INTO backgrounds(id,name,description,photo_data) VALUES (?,?,?,?)', (identifier, name, str(row.get('description', '')).strip(), str(row.get('photo_data', ''))))
                background_ids.add(identifier)
            event_ids = set()
            event_characters = []
            event_backgrounds = []
            for row in item.events:
                identifier = int(row.get('id', 0))
                title = str(row.get('title', '')).strip()
                happened_at = str(row.get('happened_at', '')).strip()
                if identifier <= 0 or not title or not happened_at:
                    continue
                conn.execute('INSERT INTO events(id,title,happened_at,description) VALUES (?,?,?,?)', (identifier, title, happened_at, str(row.get('description', '')).strip()))
                event_ids.add(identifier)
                event_characters.extend((identifier, int(character_id)) for character_id in row.get('character_ids', []) if int(character_id) in character_ids)
                event_backgrounds.extend((identifier, int(background_id)) for background_id in row.get('background_ids', []) if int(background_id) in background_ids)
            conn.executemany('INSERT OR IGNORE INTO event_characters(event_id,character_id) VALUES (?,?)', event_characters)
            conn.executemany('INSERT OR IGNORE INTO event_backgrounds(event_id,background_id) VALUES (?,?)', event_backgrounds)
            for row in item.relationships:
                from_id, to_id = int(row.get('from_id', 0)), int(row.get('to_id', 0))
                if from_id in character_ids and to_id in character_ids and from_id != to_id and str(row.get('relation_type', '')).strip():
                    conn.execute('INSERT INTO relationships(from_id,to_id,relation_type,description) VALUES (?,?,?,?)', (from_id, to_id, str(row.get('relation_type', '')).strip(), str(row.get('description', '')).strip()))
            for row in item.groups:
                members = list(dict.fromkeys(int(character_id) for character_id in row.get('character_ids', []) if int(character_id) in character_ids))
                name = str(row.get('name', '')).strip()
                if not name or len(members) < 3:
                    continue
                group_columns = {column['name'] for column in conn.execute('PRAGMA table_info(relationship_groups)')}
                if 'relation_type' in group_columns:
                    cur = conn.execute('INSERT INTO relationship_groups(name,relation_type,description) VALUES (?,?,?)', (name, name, str(row.get('description', '')).strip()))
                else:
                    cur = conn.execute('INSERT INTO relationship_groups(name,description) VALUES (?,?)', (name, str(row.get('description', '')).strip()))
                conn.executemany('INSERT INTO relationship_group_members(group_id,character_id) VALUES (?,?)', [(cur.lastrowid, member) for member in members])
            conn.execute('PRAGMA foreign_keys = ON')
        return {'ok': True}
    except (TypeError, ValueError, sqlite3.Error):
        raise HTTPException(400, '이야기 파일을 불러오지 못했어요. 파일 형식을 확인해 주세요.')
@app.get('/api/affiliations')
def list_affiliations():
    with get_db() as conn:
        return [row_dict(row) for row in conn.execute('SELECT * FROM affiliations ORDER BY name COLLATE NOCASE')]
@app.post('/api/affiliations')
def create_affiliation(item: AffiliationPayload):
    if not item.name.strip():
        raise HTTPException(400, '소속 이름을 입력해 주세요.')
    values = [item.color_r, item.color_g, item.color_b]
    if any(value < 0 or value > 255 for value in values):
        raise HTTPException(400, 'RGB 색상값은 0부터 255 사이로 입력해 주세요.')
    with get_db() as conn:
        cur = conn.execute('INSERT INTO affiliations(name, description, color_r, color_g, color_b) VALUES (?,?,?,?,?)', (item.name.strip(), item.description.strip(), *values))
        return row_dict(conn.execute('SELECT * FROM affiliations WHERE id=?', (cur.lastrowid,)).fetchone())
@app.delete('/api/affiliations/{item_id}')
def delete_affiliation(item_id: int):
    with get_db() as conn:
        conn.execute('DELETE FROM character_affiliations WHERE affiliation_id=?', (item_id,))
        deleted = conn.execute('DELETE FROM affiliations WHERE id=?', (item_id,)).rowcount
        if not deleted:
            raise HTTPException(404, '소속을 찾을 수 없어요.')
    return {'ok': True}
def affiliation_ids_for(conn, character_id):
    return [row['affiliation_id'] for row in conn.execute('SELECT affiliation_id FROM character_affiliations WHERE character_id=? ORDER BY affiliation_id', (character_id,))]
def character_dict(conn, row):
    item = row_dict(row)
    item['affiliation_ids'] = affiliation_ids_for(conn, item['id'])
    return item
def save_character_affiliations(conn, character_id, affiliation_ids):
    ids = list(dict.fromkeys(affiliation_ids))
    if ids:
        marks = ','.join('?' for _ in ids)
        valid = {row['id'] for row in conn.execute(f'SELECT id FROM affiliations WHERE id IN ({marks})', ids)}
        if len(valid) != len(ids):
            raise HTTPException(400, '선택한 소속을 찾을 수 없어요.')
    conn.execute('DELETE FROM character_affiliations WHERE character_id=?', (character_id,))
    conn.executemany('INSERT INTO character_affiliations(character_id, affiliation_id) VALUES (?,?)', [(character_id, affiliation_id) for affiliation_id in ids])
@app.get('/api/backgrounds')
def list_backgrounds():
    with get_db() as conn:
        return [row_dict(row) for row in conn.execute('SELECT * FROM backgrounds ORDER BY name COLLATE NOCASE')]
@app.post('/api/backgrounds')
def create_background(item: CharacterPayload):
    if not item.name.strip():
        raise HTTPException(400, '배경 이름을 입력해 주세요.')
    with get_db() as conn:
        cur = conn.execute('INSERT INTO backgrounds(name, description, photo_data) VALUES (?,?,?)', (item.name.strip(), item.description.strip(), item.photo_data.strip()))
        return row_dict(conn.execute('SELECT * FROM backgrounds WHERE id=?', (cur.lastrowid,)).fetchone())
@app.put('/api/backgrounds/{item_id}')
def update_background(item_id: int, item: CharacterPayload):
    if not item.name.strip():
        raise HTTPException(400, '배경 이름을 입력해 주세요.')
    with get_db() as conn:
        updated = conn.execute('UPDATE backgrounds SET name=?, description=?, photo_data=? WHERE id=?', (item.name.strip(), item.description.strip(), item.photo_data.strip(), item_id)).rowcount
        if not updated:
            raise HTTPException(404, '배경을 찾을 수 없어요.')
        return row_dict(conn.execute('SELECT * FROM backgrounds WHERE id=?', (item_id,)).fetchone())
@app.delete('/api/backgrounds/{item_id}')
def delete_background(item_id: int):
    with get_db() as conn:
        conn.execute('DELETE FROM event_backgrounds WHERE background_id=?', (item_id,))
        deleted = conn.execute('DELETE FROM backgrounds WHERE id=?', (item_id,)).rowcount
        if not deleted:
            raise HTTPException(404, '배경을 찾을 수 없어요.')
    return {'ok': True}
@app.get('/api/characters')
def list_characters():
    with get_db() as conn:
        return [character_dict(conn, x) for x in conn.execute('SELECT * FROM characters ORDER BY name COLLATE NOCASE')]
@app.post('/api/characters')
def create_character(item: CharacterPayload):
    if not item.name.strip():
        raise HTTPException(400, '이름을 입력해 주세요.')
    with get_db() as conn:
        cur = conn.execute('INSERT INTO characters(name, description, photo_data) VALUES (?,?,?)', (item.name.strip(), item.description.strip(), item.photo_data.strip()))
        save_character_affiliations(conn, cur.lastrowid, item.affiliation_ids)
        return character_dict(conn, conn.execute('SELECT * FROM characters WHERE id=?', (cur.lastrowid,)).fetchone())
@app.put('/api/characters/{item_id}')
def update_character(item_id: int, item: CharacterPayload):
    if not item.name.strip():
        raise HTTPException(400, '이름을 입력해 주세요.')
    with get_db() as conn:
        row = conn.execute('SELECT * FROM characters WHERE id=?', (item_id,)).fetchone()
        if not row:
            raise HTTPException(404, '인물을 찾을 수 없어요.')
        conn.execute('UPDATE characters SET name=?, description=?, photo_data=? WHERE id=?', (item.name.strip(), item.description.strip(), item.photo_data.strip(), item_id))
        save_character_affiliations(conn, item_id, item.affiliation_ids)
        return character_dict(conn, conn.execute('SELECT * FROM characters WHERE id=?', (item_id,)).fetchone())
@app.delete('/api/characters/{item_id}')
def delete_character(item_id: int):
    with get_db() as conn:
        exists = conn.execute('SELECT id FROM characters WHERE id=?', (item_id,)).fetchone()
        if not exists:
            raise HTTPException(404, '인물을 찾을 수 없어요.')
        affected_groups = [row['group_id'] for row in conn.execute('SELECT group_id FROM relationship_group_members WHERE character_id=?', (item_id,))]
        conn.execute('DELETE FROM relationships WHERE from_id=? OR to_id=?', (item_id, item_id))
        conn.execute('DELETE FROM character_affiliations WHERE character_id=?', (item_id,))
        conn.execute('DELETE FROM character_event_comments WHERE character_id=?', (item_id,))
        conn.execute('DELETE FROM event_characters WHERE character_id=?', (item_id,))
        conn.execute('DELETE FROM relationship_group_members WHERE character_id=?', (item_id,))
        for group_id in affected_groups:
            member_count = conn.execute('SELECT COUNT(*) AS count FROM relationship_group_members WHERE group_id=?', (group_id,)).fetchone()['count']
            if member_count < 3:
                conn.execute('DELETE FROM relationship_group_members WHERE group_id=?', (group_id,))
                conn.execute('DELETE FROM relationship_groups WHERE id=?', (group_id,))
        conn.execute('DELETE FROM characters WHERE id=?', (item_id,))
    return {'ok': True}
def event_dict(conn, row):
    item = row_dict(row)
    item['character_ids'] = [x['character_id'] for x in conn.execute('SELECT character_id FROM event_characters WHERE event_id=?', (item['id'],))]
    item['background_ids'] = [x['background_id'] for x in conn.execute('SELECT background_id FROM event_backgrounds WHERE event_id=?', (item['id'],))]
    return item
def save_event_characters(conn, event_id, character_ids):
    ids = ensure_character_ids(conn, character_ids)
    conn.execute('DELETE FROM event_characters WHERE event_id=?', (event_id,))
    conn.executemany('INSERT INTO event_characters(event_id, character_id) VALUES (?,?)', [(event_id, character_id) for character_id in ids])
def save_event_backgrounds(conn, event_id, background_ids):
    ids = list(dict.fromkeys(background_ids))
    if ids:
        marks = ','.join('?' for _ in ids)
        valid = {row['id'] for row in conn.execute(f'SELECT id FROM backgrounds WHERE id IN ({marks})', ids)}
        if len(valid) != len(ids):
            raise HTTPException(400, '선택한 배경을 찾을 수 없어요.')
    conn.execute('DELETE FROM event_backgrounds WHERE event_id=?', (event_id,))
    conn.executemany('INSERT INTO event_backgrounds(event_id, background_id) VALUES (?,?)', [(event_id, background_id) for background_id in ids])
@app.get('/api/events')
def list_events():
    with get_db() as conn:
        rows = conn.execute('SELECT * FROM events ORDER BY datetime(happened_at) ASC, id ASC')
        return [event_dict(conn, x) for x in rows]
@app.post('/api/events')
def create_event(item: EventPayload):
    if not item.title.strip() or not item.happened_at:
        raise HTTPException(400, '제목과 날짜·시간을 입력해 주세요.')
    with get_db() as conn:
        cur = conn.execute('INSERT INTO events(title, happened_at, description, photo_data) VALUES (?,?,?,?)', (item.title.strip(), item.happened_at, item.description.strip(), item.photo_data))
        save_event_characters(conn, cur.lastrowid, item.character_ids)
        save_event_backgrounds(conn, cur.lastrowid, item.background_ids)
        return event_dict(conn, conn.execute('SELECT * FROM events WHERE id=?', (cur.lastrowid,)).fetchone())
@app.put('/api/events/{item_id}')
def update_event(item_id: int, item: EventPayload):
    if not item.title.strip() or not item.happened_at:
        raise HTTPException(400, '제목과 날짜·시간을 입력해 주세요.')
    with get_db() as conn:
        row = conn.execute('SELECT * FROM events WHERE id=?', (item_id,)).fetchone()
        if not row:
            raise HTTPException(404, '사건을 찾을 수 없어요.')
        conn.execute('UPDATE events SET title=?, happened_at=?, description=?, photo_data=? WHERE id=?', (item.title.strip(), item.happened_at, item.description.strip(), item.photo_data, item_id))
        save_event_characters(conn, item_id, item.character_ids)
        save_event_backgrounds(conn, item_id, item.background_ids)
        return event_dict(conn, conn.execute('SELECT * FROM events WHERE id=?', (item_id,)).fetchone())
@app.get('/api/characters/{character_id}/event-comments')
def list_character_event_comments(character_id: int):
    with get_db() as conn:
        return [row_dict(row) for row in conn.execute(
            'SELECT event_id, character_id, comment, updated_at FROM character_event_comments WHERE character_id=?',
            (character_id,)
        )]
@app.put('/api/events/{event_id}/characters/{character_id}/comment')
def save_character_event_comment(event_id: int, character_id: int, item: CharacterEventCommentPayload):
    comment = item.comment.strip()
    with get_db() as conn:
        linked = conn.execute(
            'SELECT 1 FROM event_characters WHERE event_id=? AND character_id=?',
            (event_id, character_id)
        ).fetchone()
        if not linked:
            raise HTTPException(400, '이 인물이 등장하는 사건에서만 코멘트를 남길 수 있어요.')
        if comment:
            conn.execute(
                '''INSERT INTO character_event_comments(event_id, character_id, comment, updated_at)
                   VALUES (?,?,?,CURRENT_TIMESTAMP)
                   ON CONFLICT(event_id, character_id) DO UPDATE SET comment=excluded.comment, updated_at=CURRENT_TIMESTAMP''',
                (event_id, character_id, comment)
            )
        else:
            conn.execute('DELETE FROM character_event_comments WHERE event_id=? AND character_id=?', (event_id, character_id))
    return {'ok': True}
@app.get('/api/events/{event_id}/dialogues')
def list_event_dialogues(event_id: int):
    with get_db() as conn:
        event = conn.execute('SELECT id FROM events WHERE id=?', (event_id,)).fetchone()
        if not event:
            raise HTTPException(404, '사건을 찾을 수 없어요.')
        return [row_dict(row) for row in conn.execute(
            'SELECT * FROM event_dialogues WHERE event_id=? ORDER BY datetime(created_at) ASC, id ASC',
            (event_id,)
        )]
@app.post('/api/events/{event_id}/dialogues')
def create_event_dialogue(event_id: int, item: DialoguePayload):
    message = item.message.strip()
    if not message:
        raise HTTPException(400, '코멘트를 입력해 주세요.')
    if len(message) > 300:
        raise HTTPException(400, '코멘트는 300자 이하로 입력해 주세요.')
    with get_db() as conn:
        event = conn.execute('SELECT id FROM events WHERE id=?', (event_id,)).fetchone()
        if not event:
            raise HTTPException(404, '사건을 찾을 수 없어요.')
        ensure_character_ids(conn, [item.character_id], 1)
        cur = conn.execute(
            'INSERT INTO event_dialogues(event_id, character_id, message) VALUES (?,?,?)',
            (event_id, item.character_id, message)
        )
        return row_dict(conn.execute('SELECT * FROM event_dialogues WHERE id=?', (cur.lastrowid,)).fetchone())
@app.delete('/api/dialogues/{item_id}')
def delete_event_dialogue(item_id: int):
    with get_db() as conn:
        deleted = conn.execute('DELETE FROM event_dialogues WHERE id=?', (item_id,)).rowcount
        if not deleted:
            raise HTTPException(404, '코멘트를 찾을 수 없어요.')
    return {'ok': True}
@app.delete('/api/events/{item_id}')
def delete_event(item_id: int):
    with get_db() as conn:
        exists = conn.execute('SELECT id FROM events WHERE id=?', (item_id,)).fetchone()
        if not exists:
            raise HTTPException(404, '사건을 찾을 수 없어요.')
        conn.execute('DELETE FROM character_event_comments WHERE event_id=?', (item_id,))
        conn.execute('DELETE FROM event_dialogues WHERE event_id=?', (item_id,))
        conn.execute('DELETE FROM event_characters WHERE event_id=?', (item_id,))
        conn.execute('DELETE FROM event_backgrounds WHERE event_id=?', (item_id,))
        conn.execute('UPDATE relationships SET origin_event_id=NULL WHERE origin_event_id=?', (item_id,))
        conn.execute('UPDATE relationship_groups SET origin_event_id=NULL WHERE origin_event_id=?', (item_id,))
        conn.execute('DELETE FROM events WHERE id=?', (item_id,))
    return {'ok': True}
@app.get('/api/relationships')
def list_relationships():
    with get_db() as conn:
        return [row_dict(x) for x in conn.execute('SELECT * FROM relationships ORDER BY id DESC')]
@app.post('/api/relationships')
def create_relationship(item: RelationshipPayload):
    if item.from_id == item.to_id:
        raise HTTPException(400, '서로 다른 두 인물을 선택해 주세요.')
    if not item.relation_type.strip():
        raise HTTPException(400, '관계 유형을 입력해 주세요.')
    with get_db() as conn:
        ensure_character_ids(conn, [item.from_id, item.to_id], 2)
        if item.origin_event_id is not None:
            event = conn.execute('SELECT id FROM events WHERE id=?', (item.origin_event_id,)).fetchone()
            if not event:
                raise HTTPException(400, '선택한 사건을 찾을 수 없어요.')
            linked_ids = {row['character_id'] for row in conn.execute('SELECT character_id FROM event_characters WHERE event_id=?', (item.origin_event_id,))}
            if item.from_id not in linked_ids or item.to_id not in linked_ids:
                raise HTTPException(400, '선택한 사건에 두 인물이 모두 등장해야 관계를 기록할 수 있어요.')
        cur = conn.execute(
            'INSERT INTO relationships(from_id,to_id,relation_type,description,origin_event_id) VALUES (?,?,?,?,?)',
            (item.from_id, item.to_id, item.relation_type.strip(), item.description.strip(), item.origin_event_id)
        )
        return row_dict(conn.execute('SELECT * FROM relationships WHERE id=?', (cur.lastrowid,)).fetchone())
@app.delete('/api/relationships/{item_id}')
def delete_relationship(item_id: int):
    with get_db() as conn:
        deleted = conn.execute('DELETE FROM relationships WHERE id=?', (item_id,)).rowcount
        if not deleted:
            raise HTTPException(404, '개인 관계를 찾을 수 없어요.')
    return {'ok': True}
def group_dict(conn, row):
    item = row_dict(row)
    item['character_ids'] = [x['character_id'] for x in conn.execute('SELECT character_id FROM relationship_group_members WHERE group_id=? ORDER BY character_id', (item['id'],))]
    return item
@app.get('/api/relationship-groups')
def list_relationship_groups():
    with get_db() as conn:
        rows = conn.execute('SELECT * FROM relationship_groups ORDER BY id DESC')
        return [group_dict(conn, row) for row in rows]
@app.post('/api/relationship-groups')
def create_relationship_group(item: GroupPayload):
    if not item.name.strip():
        raise HTTPException(400, '그룹 이름을 입력해 주세요.')
    with get_db() as conn:
        ids = ensure_character_ids(conn, item.character_ids, 3)
        if item.origin_event_id is not None:
            event = conn.execute('SELECT id FROM events WHERE id=?', (item.origin_event_id,)).fetchone()
            if not event:
                raise HTTPException(400, '선택한 사건을 찾을 수 없어요.')
            linked_ids = {row['character_id'] for row in conn.execute('SELECT character_id FROM event_characters WHERE event_id=?', (item.origin_event_id,))}
            if not set(ids).issubset(linked_ids):
                raise HTTPException(400, '선택한 사건에 그룹의 모든 참여 인물이 등장해야 해요.')
        group_columns = {row['name'] for row in conn.execute('PRAGMA table_info(relationship_groups)')}
        if 'relation_type' in group_columns:
            cur = conn.execute('INSERT INTO relationship_groups(name, relation_type, description, origin_event_id) VALUES (?,?,?,?)', (item.name.strip(), item.name.strip(), item.description.strip(), item.origin_event_id))
        else:
            cur = conn.execute('INSERT INTO relationship_groups(name, description, origin_event_id) VALUES (?,?,?)', (item.name.strip(), item.description.strip(), item.origin_event_id))
        conn.executemany('INSERT INTO relationship_group_members(group_id, character_id) VALUES (?,?)', [(cur.lastrowid, character_id) for character_id in ids])
        return group_dict(conn, conn.execute('SELECT * FROM relationship_groups WHERE id=?', (cur.lastrowid,)).fetchone())
@app.delete('/api/relationship-groups/{item_id}')
def delete_relationship_group(item_id: int):
    with get_db() as conn:
        exists = conn.execute('SELECT id FROM relationship_groups WHERE id=?', (item_id,)).fetchone()
        if not exists:
            raise HTTPException(404, '그룹 관계를 찾을 수 없어요.')
        conn.execute('DELETE FROM relationship_group_members WHERE group_id=?', (item_id,))
        conn.execute('DELETE FROM relationship_groups WHERE id=?', (item_id,))
    return {'ok': True}
