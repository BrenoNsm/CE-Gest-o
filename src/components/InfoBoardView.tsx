import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, BoardBlock, BoardNote } from '../types';
import { Plus, Trash2, Edit3, X, Check, Palette, Bold, List, ListOrdered, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

const BLOCK_COLORS = [
  { name: 'Azul', value: 'border-blue-500 bg-blue-50' },
  { name: 'Verde', value: 'border-emerald-500 bg-emerald-50' },
  { name: 'Vermelho', value: 'border-red-500 bg-red-50' },
  { name: 'Âmbar', value: 'border-amber-500 bg-amber-50' },
  { name: 'Roxo', value: 'border-purple-500 bg-purple-50' },
  { name: 'Rosa', value: 'border-pink-500 bg-pink-50' },
  { name: 'Ciano', value: 'border-cyan-500 bg-cyan-50' },
  { name: 'Laranja', value: 'border-orange-500 bg-orange-50' },
];

const HEADER_COLORS: Record<string, string> = {
  'border-blue-500': 'bg-blue-600',
  'border-emerald-500': 'bg-emerald-600',
  'border-red-500': 'bg-red-600',
  'border-amber-500': 'bg-amber-600',
  'border-purple-500': 'bg-purple-600',
  'border-pink-500': 'bg-pink-600',
  'border-cyan-500': 'bg-cyan-600',
  'border-orange-500': 'bg-orange-600',
};

interface InfoBoardViewProps {
  currentUser: User;
}

function FormatToolbar({ onCmd }: { onCmd: (cmd: string, val?: string) => void }) {
  return (
    <div className="flex items-center space-x-0.5 border-b border-gray-200 bg-gray-50/80 px-2 py-1 rounded-t-md">
      <button type="button" onMouseDown={e => { e.preventDefault(); onCmd('bold'); }} title="Negrito" className="rounded p-0.5 hover:bg-gray-200 text-gray-600">
        <Bold className="h-3.5 w-3.5" />
      </button>
      <span className="w-px h-4 bg-gray-200 mx-0.5" />
      <button type="button" onMouseDown={e => { e.preventDefault(); onCmd('insertUnorderedList'); }} title="Lista com bullet" className="rounded p-0.5 hover:bg-gray-200 text-gray-600">
        <List className="h-3.5 w-3.5" />
      </button>
      <button type="button" onMouseDown={e => { e.preventDefault(); onCmd('insertOrderedList'); }} title="Lista numerada" className="rounded p-0.5 hover:bg-gray-200 text-gray-600">
        <ListOrdered className="h-3.5 w-3.5" />
      </button>
      <span className="w-px h-4 bg-gray-200 mx-0.5" />
      <button type="button" onMouseDown={e => { e.preventDefault(); onCmd('justifyLeft'); }} title="Alinhar à esquerda" className="rounded p-0.5 hover:bg-gray-200 text-gray-600">
        <AlignLeft className="h-3.5 w-3.5" />
      </button>
      <button type="button" onMouseDown={e => { e.preventDefault(); onCmd('justifyCenter'); }} title="Centralizar" className="rounded p-0.5 hover:bg-gray-200 text-gray-600">
        <AlignCenter className="h-3.5 w-3.5" />
      </button>
      <button type="button" onMouseDown={e => { e.preventDefault(); onCmd('justifyRight'); }} title="Alinhar à direita" className="rounded p-0.5 hover:bg-gray-200 text-gray-600">
        <AlignRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function sanitizeHtml(html: string): string {
  const allowed = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '');
  if (allowed.includes('<') && !allowed.includes('</')) {
    return html.replace(/<[^>]*>/g, '');
  }
  return allowed;
}

export default function InfoBoardView({ currentUser }: InfoBoardViewProps) {
  const [blocks, setBlocks] = useState<BoardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewBlockForm, setShowNewBlockForm] = useState(false);
  const [newBlockTitle, setNewBlockTitle] = useState('');
  const [newBlockColor, setNewBlockColor] = useState(BLOCK_COLORS[0].value);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editingBlockTitle, setEditingBlockTitle] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);

  const editRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<Record<string, HTMLElement | null>>({});

  const loadBlocks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/board-blocks/?sector=${currentUser.sector}`);
      if (res.ok) {
        const data = await res.json();
        if (data.length === 0) {
          const saved = localStorage.getItem('cronos_infoboard');
          if (saved) {
            try {
              const localBlocks = JSON.parse(saved);
              for (const block of localBlocks) {
                const bRes = await fetch('/api/board-blocks/', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id: block.id, title: block.title, color: block.color, sector: currentUser.sector }),
                });
                if (bRes.ok) {
                  for (const note of block.notes || []) {
                    await fetch('/api/board-notes/', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ id: note.id, block: block.id, content: note.content }),
                    });
                  }
                }
              }
              localStorage.removeItem('cronos_infoboard');
              const reload = await fetch(`/api/board-blocks/?sector=${currentUser.sector}`);
              if (reload.ok) setBlocks(await reload.json());
              return;
            } catch { /* ignore migration errors */ }
          }
        }
        setBlocks(data);
      }
    } catch (e) {
      console.error('Erro ao carregar quadro:', e);
    } finally {
      setLoading(false);
    }
  }, [currentUser.sector]);

  useEffect(() => {
    loadBlocks();
  }, [loadBlocks]);

  const execFormat = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
  };

  const handleAddBlock = async () => {
    if (!newBlockTitle.trim()) return;
    try {
      const res = await fetch('/api/board-blocks/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'block-' + Date.now(),
          title: newBlockTitle.trim(),
          color: newBlockColor,
          sector: currentUser.sector,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setBlocks(prev => [...prev, { ...created, notes: [] }]);
      }
    } catch (e) {
      console.error('Erro ao criar bloco:', e);
    }
    setNewBlockTitle('');
    setNewBlockColor(BLOCK_COLORS[0].value);
    setShowNewBlockForm(false);
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!window.confirm('Excluir este bloco e todas as suas notas?')) return;
    try {
      const res = await fetch(`/api/board-blocks/${blockId}/`, { method: 'DELETE' });
      if (res.ok) {
        setBlocks(prev => prev.filter(b => b.id !== blockId));
      }
    } catch (e) {
      console.error('Erro ao excluir bloco:', e);
    }
  };

  const handleStartEditBlock = (block: BoardBlock) => {
    setEditingBlockId(block.id);
    setEditingBlockTitle(block.title);
  };

  const handleSaveEditBlock = async () => {
    if (!editingBlockId || !editingBlockTitle.trim()) return;
    try {
      const res = await fetch(`/api/board-blocks/${editingBlockId}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editingBlockTitle.trim() }),
      });
      if (res.ok) {
        setBlocks(prev => prev.map(b =>
          b.id === editingBlockId ? { ...b, title: editingBlockTitle.trim() } : b
        ));
      }
    } catch (e) {
      console.error('Erro ao atualizar bloco:', e);
    }
    setEditingBlockId(null);
    setEditingBlockTitle('');
  };

  const handleChangeBlockColor = async (blockId: string, color: string) => {
    try {
      const res = await fetch(`/api/board-blocks/${blockId}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color }),
      });
      if (res.ok) {
        setBlocks(prev => prev.map(b =>
          b.id === blockId ? { ...b, color } : b
        ));
      }
    } catch (e) {
      console.error('Erro ao alterar cor:', e);
    }
    setShowColorPicker(null);
  };

  const handleAddNote = async (blockId: string) => {
    const el = inputRefs.current[blockId] as HTMLTextAreaElement | null;
    if (!el) return;
    const text = el.value.trim();
    if (!text) return;
    try {
      const res = await fetch('/api/board-notes/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'note-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
          block: blockId,
          content: text,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setBlocks(prev => prev.map(b =>
          b.id === blockId ? { ...b, notes: [...b.notes, created] } : b
        ));
      }
    } catch (e) {
      console.error('Erro ao adicionar nota:', e);
    }
    el.value = '';
  };

  const handleDeleteNote = async (blockId: string, noteId: string) => {
    if (!window.confirm('Excluir esta nota?')) return;
    try {
      const res = await fetch(`/api/board-notes/${noteId}/`, { method: 'DELETE' });
      if (res.ok) {
        setBlocks(prev => prev.map(b =>
          b.id === blockId ? { ...b, notes: b.notes.filter(n => n.id !== noteId) } : b
        ));
      }
    } catch (e) {
      console.error('Erro ao excluir nota:', e);
    }
  };

  const handleStartEditNote = (note: BoardNote) => {
    setEditingNoteId(note.id);
    setEditingNoteContent(note.content);
  };

  const handleSaveEditNote = async () => {
    if (!editingNoteId) return;
    const el = editRef.current;
    if (!el) return;
    const html = el.innerHTML.trim();
    if (!html || html === '<br>') {
      alert('A nota não pode ficar vazia.');
      return;
    }
    const clean = sanitizeHtml(html);
    try {
      const res = await fetch(`/api/board-notes/${editingNoteId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: clean }),
      });
      if (res.ok) {
        const updated = await res.json();
        setBlocks(prev => prev.map(b => ({
          ...b,
          notes: b.notes.map(n =>
            n.id === editingNoteId ? updated : n
          )
        })));
      } else {
        const err = await res.json();
        alert('Erro ao salvar nota: ' + (err.error || JSON.stringify(err)));
      }
    } catch (e) {
      alert('Erro ao salvar nota. Verifique o console.');
      console.error('Erro ao salvar nota:', e);
    }
    setEditingNoteId(null);
    setEditingNoteContent('');
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 leading-none">Quadro de Informação</h2>
          <p className="text-xs text-gray-500 mt-1">
            Blocos temáticos com notas para reuniões, prazos, contatos e lembretes.
            <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800">
              {currentUser.sector}
            </span>
          </p>
        </div>
        <button
          onClick={() => setShowNewBlockForm(!showNewBlockForm)}
          className="inline-flex items-center space-x-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>{showNewBlockForm ? 'Cancelar' : 'Novo Bloco'}</span>
        </button>
      </div>

      {/* New Block Form */}
      {showNewBlockForm && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-5 space-y-4 shadow-xs">
          <div className="flex items-center space-x-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">Criar Novo Bloco</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Título do Bloco</label>
              <input
                type="text"
                value={newBlockTitle}
                onChange={e => setNewBlockTitle(e.target.value)}
                placeholder="Ex: Ambiental, Contratos, Prazos..."
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
                onKeyDown={e => e.key === 'Enter' && handleAddBlock()}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Cor do Bloco</label>
              <div className="flex space-x-1.5 flex-wrap gap-1.5">
                {BLOCK_COLORS.map(c => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setNewBlockColor(c.value)}
                    title={c.name}
                    className={`h-7 w-7 rounded-full border-2 transition-all ${
                      c.value.split(' ')[0]
                    } ${
                      newBlockColor === c.value ? 'ring-2 ring-offset-1 ring-blue-500 scale-110' : ''
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleAddBlock}
              disabled={!newBlockTitle.trim()}
              className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 px-5 py-1.5 text-xs font-bold text-white shadow-xs transition-colors"
            >
              Criar Bloco
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="py-20 text-center text-gray-400">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Carregando quadro...</p>
        </div>
      ) : blocks.length === 0 && !showNewBlockForm ? (
        <div className="py-20 text-center text-gray-400">
          <Edit3 className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-semibold text-gray-500">Nenhum bloco criado ainda</p>
          <p className="text-xs mt-1">Crie blocos temáticos para organizar suas notas e lembretes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          {blocks.map(block => {
            const borderColor = block.color.split(' ')[0];
            const headerBg = HEADER_COLORS[borderColor] || 'bg-blue-600';

            return (
              <div
                key={block.id}
                className={`rounded-xl border-2 ${block.color} shadow-xs flex flex-col overflow-hidden`}
              >
                {/* Block Header */}
                <div className={`${headerBg} px-4 py-2.5 flex items-center justify-between`}>
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    {editingBlockId === block.id ? (
                      <div className="flex items-center space-x-1 flex-1">
                        <input
                          type="text"
                          value={editingBlockTitle}
                          onChange={e => setEditingBlockTitle(e.target.value)}
                          className="w-full rounded bg-white/20 px-2 py-0.5 text-xs font-bold text-white placeholder-white/60 focus:outline-hidden"
                          onKeyDown={e => e.key === 'Enter' && handleSaveEditBlock()}
                          autoFocus
                        />
                        <button onClick={handleSaveEditBlock} className="text-white/80 hover:text-white">
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setEditingBlockId(null)} className="text-white/80 hover:text-white">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm font-bold text-white truncate">{block.title}</span>
                        <button
                          onClick={() => handleStartEditBlock(block)}
                          className="text-white/60 hover:text-white shrink-0"
                          title="Editar título"
                        >
                          <Edit3 className="h-3 w-3" />
                        </button>
                      </>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 shrink-0 ml-2">
                    <div className="relative">
                      <button
                        onClick={() => setShowColorPicker(showColorPicker === block.id ? null : block.id)}
                        className="text-white/60 hover:text-white"
                        title="Alterar cor"
                      >
                        <Palette className="h-3.5 w-3.5" />
                      </button>
                      {showColorPicker === block.id && (
                        <div className="absolute right-0 top-full mt-1 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex space-x-1">
                          {BLOCK_COLORS.map(c => (
                            <button
                              key={c.name}
                              type="button"
                              onClick={() => handleChangeBlockColor(block.id, c.value)}
                              title={c.name}
                              className={`h-5 w-5 rounded-full border-2 ${c.value.split(' ')[0]} ${
                                block.color === c.value ? 'ring-2 ring-blue-500' : ''
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteBlock(block.id)}
                      className="text-white/60 hover:text-red-300"
                      title="Excluir bloco"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Notes List */}
                <div className="flex-1 p-3 space-y-2 bg-white/60 min-h-32 max-h-80 overflow-y-auto">
                  {block.notes.length === 0 && (
                    <p className="text-[10px] text-gray-400 text-center py-6">Nenhuma nota ainda</p>
                  )}
                  {block.notes.map(note => (
                    <div
                      key={note.id}
                      className="rounded-lg bg-white border border-gray-200 p-2.5 shadow-xs text-xs space-y-1 group"
                    >
                      {editingNoteId === note.id ? (
                        <div className="space-y-1.5">
                          <div className="border border-gray-200 rounded-md overflow-hidden focus-within:border-blue-600">
                            <FormatToolbar onCmd={(cmd, val) => { editRef.current?.focus(); execFormat(cmd, val); }} />
                            <div
                              ref={editRef}
                              contentEditable
                              dangerouslySetInnerHTML={{ __html: editingNoteContent }}
                              className="px-2.5 py-1.5 text-xs text-gray-800 focus:outline-hidden min-h-[60px] max-h-[120px] overflow-y-auto [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4"
                            />
                          </div>
                          <div className="flex justify-end space-x-1">
                            <button
                              onClick={handleSaveEditNote}
                              className="rounded bg-blue-600 text-white px-2 py-0.5 text-[10px] font-bold"
                            >
                              Salvar
                            </button>
                            <button
                              onClick={() => setEditingNoteId(null)}
                              className="rounded border border-gray-200 px-2 py-0.5 text-[10px]"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div
                            className="text-gray-800 leading-relaxed break-words [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_b]:font-bold"
                            dangerouslySetInnerHTML={{ __html: note.content }}
                          />
                          <div className="flex items-center justify-between pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[9px] text-gray-400">{formatDate(note.updatedAt)}</span>
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleStartEditNote(note)}
                                className="text-gray-400 hover:text-blue-600"
                                title="Editar nota"
                              >
                                <Edit3 className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteNote(block.id, note.id)}
                                className="text-gray-400 hover:text-red-600"
                                title="Excluir nota"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Note Input */}
                <div className="border-t border-gray-200 bg-gray-50/80">
                  <div className="flex items-start p-2.5 space-x-1.5">
                    <textarea
                      ref={el => { inputRefs.current[block.id] = el; }}
                      rows={2}
                      placeholder="Nova nota..."
                      className="flex-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-800 focus:border-blue-600 focus:outline-hidden resize-none"
                    />
                    <button
                      onClick={() => handleAddNote(block.id)}
                      className="rounded-md bg-blue-600 hover:bg-blue-700 px-2.5 py-1.5 text-white shrink-0 mt-0.5"
                      title="Adicionar nota"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
