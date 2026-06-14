# Plano: Isolamento de setor no InfoBoard + ChefeOverview dinâmico

## 1. BoardBlock model — adicionar `sector`

**Arquivo:** `api/models.py`

Adicionar campo:
```python
sector = models.CharField(max_length=50, default='')
```

Depois rodar `makemigrations api` e `migrate`.

## 2. BoardBlockSerializer — expor `sector`

**Arquivo:** `api/serializers.py`

Adicionar `sector` no `fields` do `BoardBlockSerializer` (após `color`).

## 3. BoardBlockViewSet — filtrar por `?sector=`

**Arquivo:** `api/views.py`

Substituir o ViewSet atual por:
```python
class BoardBlockViewSet(viewsets.ModelViewSet):
    queryset = BoardBlock.objects.all().prefetch_related('notes').order_by('created_at')
    serializer_class = BoardBlockSerializer
    lookup_field = 'id'

    def get_queryset(self):
        qs = super().get_queryset()
        sector = self.request.query_params.get('sector')
        if sector:
            qs = qs.filter(sector=sector)
        return qs
```

## 4. InfoBoardView — passar sector nas chamadas

**Arquivo:** `src/components/InfoBoardView.tsx`

- `loadBlocks`: `fetch('/api/board-blocks/?sector=' + currentUser.sector)`
- `handleAddBlock`: `body: JSON.stringify({ sector: currentUser.sector, ... })`
- Na migração do localStorage (linhas ~91-116): adicionar `sector: currentUser.sector` no POST de cada bloco legado

## 5. ChefeOverview — setores dinâmicos + filtro

**Arquivo:** `src/components/ChefeOverview.tsx`

- Remover `const SETORES = [...]`
- Adicionar `CORES` palette cíclica
- Derivar setores de `users` com `SECTOR_FULL_NAMES` map para nomes completos
- Adicionar estado `selectedSector: string | 'todas'`
- Adicionar seletor de setor no topo (após o header)
- Se `selectedSector === 'todas'`: renderizar tudo como hoje
- Se `selectedSector` for um setor específico: renderizar apenas os dados daquele setor (secretário, auditores, portarias ativas)
- Adaptar os `sectors.map(...)` para respeitar o filtro

## 6. Seed — blocos setoriais

**Arquivo:** `api/management/commands/seed_test_data.py`

Substituir `blocks_data` por blocos com `sector`:

```python
SECTOR_BLOCKS = {
    'SEAMP': [
        ('Reuniões SEAMP', 'border-blue-500 bg-blue-50', ['Alinhamento semanal - seg 14h', '...']),
        ('Prazos SEAMP', 'border-red-500 bg-red-50', ['16/06 - Fim Planejamento 021/2026']),
    ],
    'SECEX': [
        ('Reuniões SECEX', 'border-blue-500 bg-blue-50', ['...']),
        ('Prazos SECEX', 'border-red-500 bg-red-50', ['...']),
        ('Contatos SECEX', 'border-green-500 bg-green-50', ['...']),
    ],
    'SELIC': [
        ('Reuniões SELIC', 'border-purple-500 bg-purple-50', ['...']),
        ('Prazos Contratos', 'border-red-500 bg-red-50', ['...']),
    ],
}
```

Criar bloco com `sector=sigla`. Blocos do admin (sem setor específico) podem ter `sector=''`.

---

## Arquivos afetados

| Arquivo | Tipo | Mudança |
|---|---|---|
| `api/models.py` | Backend | + campo `sector` |
| `api/serializers.py` | Backend | + field `sector` |
| `api/views.py` | Backend | + filtro `?sector=` |
| `src/components/InfoBoardView.tsx` | Frontend | + `?sector=` nas chamadas |
| `src/components/ChefeOverview.tsx` | Frontend | Setores dinâmicos + seletor |
| `api/management/commands/seed_test_data.py` | Seed | Blocos por setor |
| `api/migrations/0009_boardblock_sector.py` | Migration | Gerado automaticamente |
