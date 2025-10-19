import React from 'react';

function slugifyName(name = '') {
  return name
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'malla';
}

export function ExportImport({ data, setData, planName }) {
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const safeName = slugifyName(planName || 'malla');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeName}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        setData(JSON.parse(reader.result));
      } catch (err) {
        alert('Archivo inválido');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button className='small' onClick={exportJSON}>
        Exportar
      </button>
      <label className='small'>
        Importar
        <input
          type='file'
          accept='application/json'
          style={{ display: 'none' }}
          onChange={importJSON}
        />
      </label>
    </div>
  );
}
