import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

// Botão "Instalar app" — aparece quando o navegador permite instalar a PWA
// (Android/Chrome/Edge). Em iOS o utilizador usa "Partilhar > Adicionar ao ecrã".
export default function InstallButton() {
  const [deferred, setDeferred] = useState(null);

  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setDeferred(e); };
    const onInstalled = () => setDeferred(null);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!deferred) return null;

  const install = async () => {
    deferred.prompt();
    try { await deferred.userChoice; } catch { /* ignora */ }
    setDeferred(null);
  };

  return (
    <button className="btn-primary install-btn" onClick={install} style={{ padding: '0.6rem 1rem' }} aria-label="Instalar aplicação">
      <Download size={17} /> <span className="hide-sm">Instalar</span>
    </button>
  );
}
