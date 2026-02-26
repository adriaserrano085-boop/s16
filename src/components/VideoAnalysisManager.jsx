import React, { useState } from 'react';
import { FileJson, Upload, Save, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { analysisService } from '../services/analysisService';

const VideoAnalysisManager = ({ matchId, eventId, externalId, existingData, onSaveSuccess }) => {
    const [jsonInput, setJsonInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target.result);
                setJsonInput(JSON.stringify(json, null, 2));
                setStatus({ type: 'success', message: 'Archivo cargado correctamente.' });
            } catch (err) {
                setStatus({ type: 'error', message: 'Error al leer el archivo JSON: Formato inválido.' });
            }
        };
        reader.readAsText(file);
    };

    const handleSave = async () => {
        if (!jsonInput.trim()) {
            setStatus({ type: 'error', message: 'Por favor, pega un objeto JSON o sube un archivo.' });
            return;
        }

        // Guard: require at least one valid match identifier
        if (!matchId && !eventId && !externalId) {
            setStatus({
                type: 'error',
                message: 'Error: No se pudo identificar el partido. Faltan matchId, eventId y externalId.'
            });
            return;
        }

        setLoading(true);
        setStatus({ type: '', message: '' });

        try {
            const dataToSave = JSON.parse(jsonInput);

            // Check if it has the required structure
            if (!dataToSave.analisis_video_nac_sport) {
                setStatus({
                    type: 'error',
                    message: 'El JSON debe contener la propiedad "analisis_video_nac_sport".'
                });
                setLoading(false);
                return;
            }

            // Merge with existing raw_json if possible to preserve other data
            const finalRawJson = existingData ? { ...existingData, ...dataToSave } : dataToSave;

            const payload = {
                evento_id: eventId || null,
                partido_externo_id: externalId || null,
                partido_id: matchId || null,
                raw_json: finalRawJson
            };

            console.log('[VideoAnalysisManager] Saving with IDs:', {
                matchId, eventId, externalId
            });

            const saved = await analysisService.upsert(payload);
            setStatus({ type: 'success', message: 'Análisis de vídeo guardado correctamente.' });
            if (onSaveSuccess) onSaveSuccess(saved);
        } catch (err) {
            console.error('Error saving video analysis:', err);
            setStatus({
                type: 'error',
                message: 'Error al guardar: ' + (err.message || 'Formato inválido')
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="video-analysis-manager p-8 bg-white rounded-[24px] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-[#003366] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/10">
                    <FileJson size={26} />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-slate-800" style={{ fontFamily: 'var(--font-main)' }}>Centro de Importación Nac Sport</h3>
                    <p className="text-sm text-slate-500 font-medium">Carga y valida datos técnicos de videoanálisis</p>
                </div>
            </div>

            <div className="space-y-8">
                {/* File Upload Area */}
                <div className="group relative border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center hover:border-[#FF6600] hover:bg-orange-50/30 transition-all duration-300">
                    <input
                        type="file"
                        accept=".json"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center">
                        <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Upload size={32} className="group-hover:text-[#FF6600]" />
                        </div>
                        <p className="text-lg font-bold text-slate-700">Explorar archivo .json</p>
                        <p className="text-sm text-slate-400 mt-2">Arrastra el reporte exportado desde Nac Sport aquí</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="h-px bg-slate-100 flex-1"></div>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">O pega el código directamente</span>
                    <div className="h-px bg-slate-100 flex-1"></div>
                </div>

                {/* Textarea Area */}
                <div>
                    <textarea
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        placeholder='{ "analisis_video_nac_sport": { ... } }'
                        className="w-full h-64 p-6 font-mono text-[11px] bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-[#FF6600] outline-none transition-all resize-none shadow-inner"
                    />
                </div>

                {/* Status Message */}
                {status.message && (
                    <div className={`p-5 rounded-2xl flex items-center gap-4 text-sm font-medium animate-in fade-in slide-in-from-bottom-2 ${status.type === 'error'
                        ? 'bg-red-50 text-red-700 border border-red-100'
                        : 'bg-green-50 text-green-700 border border-green-100'
                        }`}>
                        {status.type === 'error' ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
                        {status.message}
                    </div>
                )}

                {/* Info Box */}
                <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100/50 flex gap-4">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-xl shrink-0"><Info size={20} /></div>
                    <div className="text-xs text-blue-900 leading-relaxed font-medium">
                        <p className="font-black uppercase tracking-wider mb-2 text-[10px] opacity-60">Protocolo de Datos:</p>
                        <p>Asegúrate de que el JSON mantenga la raíz <code>analisis_video_nac_sport</code>. El sistema detectará automáticamente los KPIs de posesión, placajes y fases estáticas para generar el dashboard visual.</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="pt-4">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-white shadow-xl shadow-blue-900/20 transition-all duration-300 ${loading
                            ? 'bg-slate-400 cursor-not-allowed'
                            : 'bg-[#003366] hover:bg-[#004e9a] hover:-translate-y-1 active:scale-[0.98]'
                            }`}
                    >
                        {loading ? 'Procesando Datos...' : <><Save size={22} /> Publicar Análisis Técnico</>}
                    </button>
                    {existingData && existingData.analisis_video_nac_sport && (
                        <p className="text-center text-[10px] text-slate-400 mt-4 font-bold uppercase tracking-widest">Ya existe un análisis prevío. Al guardar se actualizará la versión.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VideoAnalysisManager;
