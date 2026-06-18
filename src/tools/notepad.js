/**
 * 快捷便签
 */
class NotepadTool {
  constructor() {
    this.notes = [];
    this._load();
  }

  _load() {
    try { this.notes = JSON.parse(localStorage.getItem('web_pet_notes') || '[]'); } catch { this.notes = []; }
  }

  _save() {
    try { localStorage.setItem('web_pet_notes', JSON.stringify(this.notes)); } catch {}
  }

  add(text, pinned = false) {
    const note = { id: Date.now().toString(36), text, pinned, done: false, createdAt: Date.now() };
    this.notes.unshift(note);
    this._save();
    return note.id;
  }

  remove(id) {
    this.notes = this.notes.filter(n => n.id !== id);
    this._save();
  }

  toggleDone(id) {
    const n = this.notes.find(n => n.id === id);
    if (n) { n.done = !n.done; this._save(); }
  }

  togglePin(id) {
    const n = this.notes.find(n => n.id === id);
    if (n) { n.pinned = !n.pinned; this._save(); }
  }

  edit(id, text) {
    const n = this.notes.find(n => n.id === id);
    if (n) { n.text = text; this._save(); }
  }

  getAll() { return [...this.notes]; }
  getPinned() { return this.notes.filter(n => n.pinned && !n.done); }
  clear() { this.notes = []; this._save(); }
}
