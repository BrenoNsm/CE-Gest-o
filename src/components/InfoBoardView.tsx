import React, { useState, useEffect, useRef } from 'react';
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

const STORAGE_KEY = 'cronos_infoboard';

function loadBlocks(): BoardBlock[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveBlocks(blocks: BoardBlock[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(blocks));
}

function generateId(): string {
  return 'block-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
}

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
  const [blocks, setBlocks] = useState<BoardBlock[]>(loadBlocks);
  const [showNewBlockForm, setShowNewBlockForm] = useState(false);
  const [newBlockTitle, setNewBlockTitle] = useState('');
  const [newBlockColor, setNewBlockColor] = useState(BLOCK_COLORS[0].value);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editingBlockTitle, setEditingBlockTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState<Record<string, string>>({});
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [activeBlockInput, setActiveBlockInput] = useState<string | null>(null);

  const editRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    saveBlocks(blocks);
  }, [blocks]);

  const execFormat = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
  };

  const handleAddBlock = () => {
    if (!newBlockTitle.trim()) return;
    const block: BoardBlock = {
      id: generateId(),
      title: newBlockTitle.trim(),
      color: newBlockColor,
      notes: [],
      createdAt: new Date().toISOString(),
    };
    setBlocks(prev => [...prev, block]);
    setNewBlockTitle('');
    setNewBlockColor(BLOCK_COLORS[0].value);
    setShowNewBlockForm(false);
  };

  const handleDeleteBlock = (blockId: string) => {
    if (!window.confirm('Excluir este bloco e todas as suas notas?')) return;
    setBlocks(prev => prev.filter(b => b.id !== blockId));
  };

  const handleStartEditBlock = (block: BoardBlock) => {
    setEditingBlockId(block.id);
    setEditingBlockTitle(block.title);
  };

  const handleSaveEditBlock = () => {
    if (!editingBlockId || !editingBlockTitle.trim()) return;
    setBlocks(prev => prev.map(b =>
      b.id === editingBlockId ? { ...b, title: editingBlockTitle.trim() } : b
    ));
    setEditingBlockId(null);
    setEditingBlockTitle('');
  };

  const handleChangeBlockColor = (blockId: string, color: string) => {
    setBlocks(prev => prev.map(b =>
      b.id === blockId ? { ...b, color } : b
    ));
    setShowColorPicker(null);
  };

  const handleAddNote = (blockId: string) => {
    const el = inputRefs.current[blockId];
    if (!el) return;
    const html = el.innerHTML.trim();
    if (!html || html === '<br>') return;
    const clean = sanitizeHtml(html);
    const note: BoardNote = {
      id: 'note-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      content: clean,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setBlocks(prev => prev.map(b =>
      b.id === blockId ? { ...b, notes: [...b.notes, note] } : b
    ));
    el.innerHTML = '';
    setActiveBlockInput(null);
  };

  const handleDeleteNote = (blockId: string, noteId: string) => {
    if (!window.confirm('Excluir esta nota?')) return;
    setBlocks(prev => prev.map(b =>
      b.id === blockId ? { ...b, notes: b.notes.filter(n => n.id !== noteId) } : b
    ));
  };

  const handleStartEditNote = (note: BoardNote) => {
    setEditingNoteId(note.id);
    setEditingNoteContent(note.content);
  };

  const handleSaveEditNote = () => {
    if (!editingNoteId) return;
    const el = editRef.current;
    if (!el) return;
    const html = el.innerHTML.trim();
    if (!html || html === '<br>') return;
    const clean = sanitizeHtml(html);
    setBlocks(prev => prev.map(b => ({
      ...b,
      notes: b.notes.map(n =>
        n.id === editingNoteId ? { ...n, content: clean, updatedAt: new Date().toISOString() } : n
      )
    })));
    setEditingNoteId(null);
    setEditingNoteContent('');
  };

  const handleKeyDown = (blockId: string, e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddNote(blockId);
    }
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
          <p className="text-xs text-gray-500 mt-1">Blocos temáticos com notas para reuniões, prazos, contatos e lembretes.</p>
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

      {/* Blocks Grid */}
      {blocks.length === 0 && !showNewBlockForm ? (
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
                  <div className="border-b border-gray-200">
                    <FormatToolbar onCmd={(cmd, val) => { inputRefs.current[block.id]?.focus(); execFormat(cmd, val); }} />
                  </div>
                  <div className="flex items-start p-2.5 space-x-1.5">
                    <div
                      ref={el => { inputRefs.current[block.id] = el; }}
                      contentEditable
                      onKeyDown={e => handleKeyDown(block.id, e)}
                      onFocus={() => setActiveBlockInput(block.id)}
                      data-placeholder="Nova nota..."
                      className="flex-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-800 focus:border-blue-600 focus:outline-hidden min-h-[28px] max-h-24 overflow-y-auto [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
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
