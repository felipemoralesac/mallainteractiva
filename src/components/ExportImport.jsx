import React from 'react';
export function ExportImport({data,setData}){
  const exportJSON=()=>{
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='malla-pedmat.json';a.click();
    URL.revokeObjectURL(url);
  };
  const importJSON=(e)=>{
    const f=e.target.files?.[0];if(!f)return;
    const reader=new FileReader();
    reader.onload=()=>{try{setData(JSON.parse(reader.result));}catch(err){alert('Archivo inválido');}};
    reader.readAsText(f);
  };
  return(<div style={{display:'flex',gap:8}}>
    <button className='small' onClick={exportJSON}>Exportar</button>
    <label className='small'>Importar<input type='file' accept='application/json' style={{display:'none'}} onChange={importJSON}/></label>
  </div>);
}