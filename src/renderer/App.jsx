import React, { useState, useEffect } from 'react';

const App = () => {
  const [macros, setMacros] = useState([]);
  const [selectedMacroId, setSelectedMacroId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [runStatus, setRunStatus] = useState(null);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    loadMacros();

    // Listen for OS theme changes (Lecture 11)
    window.electronAPI.onThemeChanged((newTheme) => {
      setTheme(newTheme);
    });
  }, []);

  const loadMacros = async () => {
    const savedMacros = await window.electronAPI.invoke('get-macros');
    setMacros(savedMacros);
  };

  const saveMacros = async () => {
    setIsSaving(true);
    await window.electronAPI.invoke('save-macros', macros);
    setIsSaving(false);
  };

  const createMacro = () => {
    const newMacro = {
      id: Date.now().toString(),
      name: 'New Macro',
      actions: [],
    };
    setMacros([...macros, newMacro]);
    setSelectedMacroId(newMacro.id);
  };

  const deleteMacro = (id) => {
    setMacros(macros.filter(m => m.id !== id));
    if (selectedMacroId === id) setSelectedMacroId(null);
  };

  const updateMacro = (id, updates) => {
    setMacros(macros.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const selectedMacro = macros.find(m => m.id === selectedMacroId);

  const addAction = (macroId, type) => {
    const macro = macros.find(m => m.id === macroId);
    if (!macro) return;

    const newAction = {
      id: Date.now().toString(),
      type,
      config: getDefaultConfig(type),
    };

    updateMacro(macroId, { actions: [...macro.actions, newAction] });
  };

  const updateAction = (macroId, actionId, config) => {
    const macro = macros.find(m => m.id === macroId);
    if (!macro) return;

    const newActions = macro.actions.map(a =>
      a.id === actionId ? { ...a, config } : a
    );

    updateMacro(macroId, { actions: newActions });
  };

  const removeAction = (macroId, actionId) => {
    const macro = macros.find(m => m.id === macroId);
    if (!macro) return;

    updateMacro(macroId, { actions: macro.actions.filter(a => a.id !== actionId) });
  };

  const moveAction = (macroId, actionId, direction) => {
    const macro = macros.find(m => m.id === macroId);
    if (!macro) return;

    const index = macro.actions.findIndex(a => a.id === actionId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= macro.actions.length) return;

    const newActions = [...macro.actions];
    [newActions[index], newActions[newIndex]] = [newActions[newIndex], newActions[index]];

    updateMacro(macroId, { actions: newActions });
  };

  const getDefaultConfig = (type) => {
    switch (type) {
      case 'open-app': return { appPath: '' };
      case 'open-website': return { url: '' };
      case 'run-command': return { command: '' };
      case 'wait': return { duration: 1000 };
      case 'notification': return { message: '' };
      default: return {};
    }
  };

  const runSelectedMacro = async () => {
    if (!selectedMacro) return;

    setIsRunning(true);
    setRunStatus(null);
    try {
      const result = await window.electronAPI.invoke('run-macro', selectedMacro);
      setRunStatus(result);
    } catch (e) {
      setRunStatus({ success: false, error: e.message });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, sans-serif', background: theme === 'dark' ? '#333' : 'white', color: theme === 'dark' ? 'white' : 'black' }}>
      {/* Sidebar */}
      <div style={{ width: '250px', borderRight: '1px solid #ccc', display: 'flex', flexDirection: 'column', background: theme === 'dark' ? '#222' : '#f5f5f5' }}>
        <div style={{ padding: '15px', borderBottom: '1px solid #ccc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Macros</h2>
          <button onClick={createMacro} style={{ cursor: 'pointer' }}>+</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {macros.map(m => (
            <div
              key={m.id}
              onClick={() => setSelectedMacroId(m.id)}
              style={{
                padding: '10px 15px',
                cursor: 'pointer',
                background: selectedMacroId === m.id ? (theme === 'dark' ? '#444' : '#ddd') : 'transparent',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
              <button onClick={(e) => { e.stopPropagation(); deleteMacro(m.id); }} style={{ marginLeft: '10px', cursor: 'pointer' }}>×</button>
            </div>
          ))}
          {macros.length === 0 && <div style={{ padding: '15px', color: '#666', fontSize: '0.9rem' }}>No macros created yet.</div>}
        </div>
        <div style={{ padding: '15px', borderTop: '1px solid #ccc' }}>
          <button
            onClick={saveMacros}
            disabled={isSaving}
            style={{ width: '100%', padding: '10px', cursor: 'pointer', background: '#007aff', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            {isSaving ? 'Saving...' : 'Save All Macros'}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto', background: theme === 'dark' ? '#333' : 'white' }}>
        {selectedMacro ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <input
                value={selectedMacro.name}
                onChange={(e) => updateMacro(selectedMacro.id, { name: e.target.value })}
                style={{ fontSize: '1.5rem', fontWeight: 'bold', border: 'none', borderBottom: '2px solid #ccc', padding: '5px', width: '70%', outline: 'none', background: 'transparent', color: 'inherit' }}
              />
              <button
                onClick={runSelectedMacro}
                disabled={isRunning}
                style={{
                  padding: '10px 20px',
                  cursor: isRunning ? 'not-allowed' : 'pointer',
                  background: isRunning ? '#ccc' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 'bold'
                }}
              >
                {isRunning ? 'Running...' : '▶ Run Macro'}
              </button>
            </div>

            {runStatus && (
              <div style={{
                padding: '10px',
                marginBottom: '20px',
                borderRadius: '4px',
                background: runStatus.success ? '#d4edda' : '#f8d7da',
                color: runStatus.success ? '#155724' : '#721c24',
                border: `1px solid ${runStatus.success ? '#c3e6cb' : '#f5c6cb'}`
              }}>
                {runStatus.success ? 'Macro completed successfully!' : `Macro failed: ${runStatus.error}`}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button onClick={() => addAction(selectedMacro.id, 'open-app')}>+ Open App</button>
              <button onClick={() => addAction(selectedMacro.id, 'open-website')}>+ Open Web</button>
              <button onClick={() => addAction(selectedMacro.id, 'run-command')}>+ Run Cmd</button>
              <button onClick={() => addAction(selectedMacro.id, 'wait')}>+ Wait</button>
              <button onClick={() => addAction(selectedMacro.id, 'notification')}>+ Notify</button>
              <button onClick={() => addAction(selectedMacro.id, 'screenshot')}>+ Screenshot</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {selectedMacro.actions.map((action, index) => (
                <div key={action.id} style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px', position: 'relative', background: theme === 'dark' ? '#444' : '#fafafa' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 'bold', color: '#666' }}>Step {index + 1}: {action.type}</span>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button onClick={() => moveAction(selectedMacro.id, action.id, 'up')} disabled={index === 0} style={{ cursor: 'pointer', padding: '2px 5px' }}>↑</button>
                        <button onClick={() => moveAction(selectedMacro.id, action.id, 'down')} disabled={index === selectedMacro.actions.length - 1} style={{ cursor: 'pointer', padding: '2px 5px' }}>↓</button>
                      </div>
                    </div>
                    <button onClick={() => removeAction(selectedMacro.id, action.id)} style={{ cursor: 'pointer', border: 'none', background: 'none', color: 'red' }}>Remove</button>
                  </div>

                  {action.type === 'open-app' && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input
                        placeholder="App path"
                        value={action.config.appPath}
                        onChange={(e) => updateAction(selectedMacro.id, action.id, { ...action.config, appPath: e.target.value })}
                        style={{ flex: 1, padding: '8px', boxSizing: 'border-box', background: theme === 'dark' ? '#555' : 'white', color: 'inherit' }}
                      />
                      <button
                        onClick={async () => {
                          const path = await window.electronAPI.invoke('select-app-path');
                          if (path) updateAction(selectedMacro.id, action.id, { ...action.config, appPath: path });
                        }}
                        style={{ padding: '8px', cursor: 'pointer' }}
                      >
                        Browse
                      </button>
                    </div>
                  )}
                  {action.type === 'open-website' && (
                    <input
                      placeholder="URL (https://...)"
                      value={action.config.url}
                      onChange={(e) => updateAction(selectedMacro.id, action.id, { ...action.config, url: e.target.value })}
                      style={{ width: '100%', padding: '8px', boxSizing: 'border-box', background: theme === 'dark' ? '#555' : 'white', color: 'inherit' }}
                    />
                  )}
                  {action.type === 'run-command' && (
                    <input
                      placeholder="Terminal command"
                      value={action.config.command}
                      onChange={(e) => updateAction(selectedMacro.id, action.id, { ...action.config, command: e.target.value })}
                      style={{ width: '100%', padding: '8px', boxSizing: 'border-box', fontFamily: 'monospace', background: theme === 'dark' ? '#555' : 'white', color: 'inherit' }}
                    />
                  )}
                  {action.type === 'wait' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span>Wait for: </span>
                      <input
                        type="number"
                        value={action.config.duration}
                        onChange={(e) => updateAction(selectedMacro.id, action.id, { ...action.config, duration: parseInt(e.target.value) || 0 })}
                        style={{ width: '80px', padding: '8px', background: theme === 'dark' ? '#555' : 'white', color: 'inherit' }}
                      />
                      <span>ms</span>
                    </div>
                  )}
                  {action.type === 'notification' && (
                    <input
                      placeholder="Notification message"
                      value={action.config.message}
                      onChange={(e) => updateAction(selectedMacro.id, action.id, { ...action.config, message: e.target.value })}
                      style={{ width: '100%', padding: '8px', boxSizing: 'border-box', background: theme === 'dark' ? '#555' : 'white', color: 'inherit' }}
                    />
                  )}
                </div>
              ))}
              {selectedMacro.actions.length === 0 && <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>No actions added yet. Use the buttons above to add steps.</div>}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#999' }}>
            Select a macro from the list or create a new one to start editing.
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
