import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import {
    Shield,
    Zap,
    Target,
    MessageSquare,
    ArrowUpCircle,
    ArrowDownCircle,
    TrendingUp,
    Activity,
    Award,
    Trophy,
    Gamepad2,
    BarChart3,
    AlertTriangle,
    AlertCircle
} from 'lucide-react';
import './VideoAnalysisDashboard.css';

ChartJS.register(ArcElement, Tooltip, Legend);

const VideoAnalysisDashboard = ({ data, match, allPlayers = [] }) => {
    if (!data || !data.analisis_video_nac_sport) {
        return (
            <div className="empty-dashboard">
                <Award size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-lg font-serif italic">No hay datos de videoanálisis disponibles para este partido.</p>
                <p className="text-sm opacity-60">Sube un archivo JSON de Nac Sport para ver las métricas de rendimiento.</p>
            </div>
        );
    }

    const nacData = data.analisis_video_nac_sport;

    // ── KPI extraction: supports BOTH new (kpis_globales_partido) and old schemas ──
    const kpisGlobales = nacData.kpis_globales_partido || {};
    const possessionRaw = kpisGlobales.posesion || nacData.kpis_posesion_y_ritmo || {};
    const defenseRaw = kpisGlobales.placajes_globales || nacData.kpis_defensivos_placajes || {};
    // ataque_y_retencion (new name) OR ataque_y_disciplina (old) OR kpis_eficiencia_ofensiva (legacy)
    const offenseRaw = kpisGlobales.ataque_y_retencion || kpisGlobales.ataque_y_disciplina || nacData.kpis_eficiencia_ofensiva || {};
    const conquest = nacData.kpis_conquista_fases_estaticas || {};

    // Normalize possession fields
    const possession = possessionRaw;

    // Normalize defense field names
    const defense = {
        ...defenseRaw,
        placajes_totales_registrados: defenseRaw.placajes_totales_registrados ?? defenseRaw.totales_registrados,
        placajes_ganados_exitosos: defenseRaw.placajes_ganados_exitosos ?? defenseRaw.ganados_exitosos,
        placajes_perdidos_fallados: defenseRaw.placajes_perdidos_fallados ?? defenseRaw.perdidos_fallados,
        porcentaje_exito_global: defenseRaw.porcentaje_exito_global,
        analisis_critico: defenseRaw.analisis_critico,
    };

    // Normalize offense — flatten fases_de_juego if nested, map new field names to old
    const fasesRaw = offenseRaw.fases_de_juego || {};
    const offense = {
        ...offenseRaw,
        ensayos_a_favor: offenseRaw.ensayos_a_favor,
        ensayos_en_contra: offenseRaw.ensayos_en_contra,
        errores_no_forzados_manos: fasesRaw.errores_no_forzados_manos ?? offenseRaw.errores_no_forzados_manos,
        penales_sacados_a_favor: offenseRaw.penales_sacados_a_favor,
        fases_de_juego: {
            // Support both naming conventions
            maxima_retencion: fasesRaw.posesion_con_mas_fases ?? fasesRaw.maxima_retencion ?? null,
            veces_alcanzado_6_fases: fasesRaw.veces_alcanzado_maximo ?? fasesRaw.veces_alcanzado_6_fases ?? null,
            errores_no_forzados_manos: fasesRaw.errores_no_forzados_manos ?? offenseRaw.errores_no_forzados_manos,
            jugada_con_mas_fases: fasesRaw.jugada_con_mas_fases ?? fasesRaw.descripcion_jugada ?? null,
        },
        disciplina_forzada: offenseRaw.disciplina_forzada || {
            penales_sacados_a_favor: offenseRaw.penales_sacados_a_favor,
        },
    };

    // Conquest normalization: support both old (ganadas) and new (ganadas_retenidas) field names
    const melePropia = conquest.mele_scrum?.propia || {};
    const meleRival = conquest.mele_scrum?.rival || {};
    const touchPropia = conquest.touch_lineout?.propia || {};
    const touchRival = conquest.touch_lineout?.rival || {};
    const meleGanadas = melePropia.ganadas_retenidas ?? melePropia.ganadas ?? 0;
    const touchGanadas = touchPropia.ganadas_retenidas ?? touchPropia.ganadas ?? 0;
    const meleRivalPerdidas = meleRival.disputas_perdidas_por_hospitalet ?? meleRival.perdidas_forzadas;
    const touchRivalRobos = touchRival.disputas_perdidas_por_hospitalet ?? touchRival.robos_forzados ?? touchRival.robos_for_forzados;

    const calcRetention = (retProp, won, total) => retProp ? parseInt(retProp) || 0 : (total > 0 ? Math.round((won / total) * 100) : 0);
    const meleRetentionValue = calcRetention(melePropia.retencion, meleGanadas, melePropia.lanzamientos);
    const touchRetentionValue = calcRetention(touchPropia.retencion, touchGanadas, touchPropia.lanzamientos);

    const intelMeta = nacData.metadatos || null;
    const discrepancias = nacData.cruce_acta_vs_video?.discrepancias_detectadas || [];
    const topTacklers = nacData.rendimiento_individual_defensivo?.top_tacklers_los_muros || [];
    const alertasDef = nacData.rendimiento_individual_defensivo?.alertas_rendimiento_focos_de_rotura || [];
    const tactico = nacData.analisis_tactico_global || null;
    const insights = nacData.insights_para_app_entrenador || [];
    const informeJugadores = nacData.analisis_individual_plantilla || null;

    const getPlayerPhoto = (dorsal, name) => {
        if (!allPlayers || allPlayers.length === 0) return null;
        // Try finding by dorsal first, as it's more accurate
        const byDorsal = dorsal ? allPlayers.find(p => String(p.dorsal) === String(dorsal) || String(p.numero) === String(dorsal)) : null;
        if (byDorsal && byDorsal.foto) return byDorsal.foto;
        // Fallback to searching by name
        if (name) {
            const nameLower = name.toLowerCase();
            const byName = allPlayers.find(p => {
                const fullName = `${p.nombre} ${p.apellidos}`.toLowerCase();
                return fullName.includes(nameLower) || nameLower.includes(p.nombre.toLowerCase());
            });
            if (byName && byName.foto) return byName.foto;
        }
        return null;
    };

    const tackleSuccessRate = parseFloat(defense.porcentaje_exito_global?.replace('%', '')) || 0;
    const isDefenseWeak = tackleSuccessRate < 80;

    return (
        <div className="video-analysis-dashboard">
            {/* MÉTRICAS HEADER */}
            <div className="w-full" style={{ marginTop: '2rem', marginBottom: '0.5rem' }}>
                <div className="flex items-center gap-4">
                    <div className="h-px bg-slate-200 flex-1"></div>
                    <h4 className="flex items-center gap-3 font-black uppercase text-slate-400" style={{ fontSize: '1.75rem', letterSpacing: '0.25em' }}>
                        <BarChart3 className="text-blue-900" size={28} /> Métricas
                    </h4>
                    <div className="h-px bg-slate-200 flex-1"></div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* ELITE PERFORMANCE HEADER */}
                <div className="premium-card lg:col-span-12 shadow-sm bg-white rounded-2xl flex items-center justify-center p-8" style={{ border: '1px solid #f1f5f9' }}>
                    <div className="italic font-serif" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'stretch', gap: '1.5rem', width: '100%' }}>

                        {/* Métrica Azul 1: Posesión (Envuelto en recuadro azul pastel extra) */}
                        <div style={{ width: 'auto', padding: '0.4rem', backgroundColor: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: '1.25rem', minWidth: '140px' }}>
                            <div className="bg-white rounded-xl shadow-sm relative flex flex-col items-center text-center" style={{ width: '100%', height: '100%', padding: '0.75rem', border: '1px solid #f8fafc' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <div className="icon-box-premium" style={{ width: '28px', height: '28px' }}><Activity size={14} /></div>
                                    <span className="performance-pill pill-blue" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>Ritmo</span>
                                </div>
                                <p style={{ fontSize: '10px', color: '#1e3a8a', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem', opacity: 0.8 }}>Posesión</p>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#003366', lineHeight: 1, marginTop: 'auto' }}>{possession.porcentaje_posesion_propia}</h3>
                            </div>
                        </div>

                        {/* Métrica Azul 2: Defensa */}
                        <div style={{ width: 'auto', padding: '0.4rem', backgroundColor: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: '1.25rem', minWidth: '140px' }}>
                            <div className="bg-white rounded-xl shadow-sm relative flex flex-col items-center text-center" style={{ width: '100%', height: '100%', padding: '0.75rem', border: '1px solid #f8fafc' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <div className="icon-box-premium icon-box-orange" style={{ width: '28px', height: '28px' }}><Shield size={14} /></div>
                                    <span className={`performance-pill ${isDefenseWeak ? 'bg-red-100 text-red-700' : 'pill-orange'}`} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>
                                        {isDefenseWeak ? 'Crítico' : 'Eficaz'}
                                    </span>
                                </div>
                                <p style={{ fontSize: '10px', color: '#1e3a8a', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem', opacity: 0.8 }}>Defensa</p>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: isDefenseWeak ? '#dc2626' : '#003366', lineHeight: 1, marginTop: 'auto' }}>{defense.porcentaje_exito_global}</h3>
                            </div>
                        </div>

                        {/* Métrica Azul 3: Retención estática */}
                        <div style={{ width: 'auto', padding: '0.4rem', backgroundColor: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: '1.25rem', minWidth: '140px' }}>
                            <div className="bg-white rounded-xl shadow-sm relative flex flex-col items-center text-center" style={{ width: '100%', height: '100%', padding: '0.75rem', border: '1px solid #f8fafc' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <div className="icon-box-premium" style={{ width: '28px', height: '28px' }}><TrendingUp size={14} /></div>
                                    <span className="performance-pill pill-blue" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>Estática</span>
                                </div>
                                <p style={{ fontSize: '10px', color: '#1e3a8a', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem', opacity: 0.8 }}>Retención</p>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#003366', lineHeight: 1, marginTop: 'auto' }}>
                                    {conquest.retencion_global_propias || melePropia.retencion || '—'}
                                </h3>
                            </div>
                        </div>

                        {/* Métrica Azul 4: Ensayos */}
                        <div style={{ width: 'auto', padding: '0.4rem', backgroundColor: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: '1.25rem', minWidth: '140px' }}>
                            <div className="bg-white rounded-xl shadow-sm relative flex flex-col items-center text-center" style={{ width: '100%', height: '100%', padding: '0.75rem', border: '1px solid #f8fafc' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <div className="icon-box-premium icon-box-orange" style={{ width: '28px', height: '28px' }}><Trophy size={14} /></div>
                                    <span className="performance-pill pill-orange" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>Score</span>
                                </div>
                                <p style={{ fontSize: '10px', color: '#1e3a8a', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem', opacity: 0.8 }}>Ensayos</p>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: 'auto' }}>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#FF6600', lineHeight: 1 }}>{offense.ensayos_a_favor ?? '—'}</h3>
                                    {offense.ensayos_en_contra != null && (
                                        <span style={{ fontSize: '1rem', fontWeight: '900', color: '#1e3a8a', opacity: 0.5 }}>/{offense.ensayos_en_contra}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* POSSESSION SECTION */}
                <div className="premium-card lg:col-span-12 relative flex flex-col justify-start" style={{ paddingTop: '2rem', paddingRight: '2rem', paddingBottom: '3.5rem', paddingLeft: '2rem' }}>
                    <div className="relative h-full flex flex-col justify-center">
                        <h4 className="flex items-center gap-3 text-2xl font-black mb-8 w-full text-[#003366]">
                            <Activity className="text-orange-500" /> Control del Dominio
                        </h4>

                        {/* DOMINANCE BAR */}
                        <div style={{ width: '100%', padding: '0 1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                <span className="performance-pill pill-blue" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>Posesión Global</span>
                            </div>

                            <div className="possession-bar-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <span style={{ color: '#FF6600', fontWeight: '900', fontSize: '1.5rem', minWidth: '60px', textAlign: 'right', letterSpacing: '-0.05em' }}>
                                    {possession.porcentaje_posesion_propia}
                                </span>
                                <div style={{ flex: 1, height: '18px', backgroundColor: '#e2e8f0', borderRadius: '9px', display: 'flex', overflow: 'hidden', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }}>
                                    <div style={{ width: possession.porcentaje_posesion_propia, backgroundColor: '#FF6600', transition: 'width 1s ease' }} />
                                    <div style={{ width: possession.porcentaje_posesion_rival, backgroundColor: '#003366', transition: 'width 1s ease' }} />
                                </div>
                                <span style={{ color: '#003366', fontWeight: '900', fontSize: '1.5rem', minWidth: '60px', letterSpacing: '-0.05em' }}>
                                    {possession.porcentaje_posesion_rival}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 65px', marginTop: '0.5rem' }}>
                                <span style={{ fontSize: '10px', color: '#ea580c', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Propia</span>
                                <span style={{ fontSize: '10px', color: '#1e3a8a', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Rival</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* DEFENSE SECTION */}
                <div className="premium-card lg:col-span-7 flex flex-col justify-start" style={{ paddingTop: '2rem', paddingRight: '2rem', paddingBottom: '3.5rem', paddingLeft: '2rem' }}>
                    <h4 className="flex items-center gap-3 text-2xl font-black mb-8">
                        <Shield className="text-orange-500" /> Rendimiento Defensivo
                    </h4>

                    {/* 5-stat cards — styled like the performance header */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1.5rem', width: '100%', marginBottom: '2rem' }}>
                        {/* Placajes totales — grey */}
                        <div style={{ width: 'auto', minWidth: '120px', padding: '0.4rem', backgroundColor: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: '1.25rem' }}>
                            <div className="bg-white rounded-xl shadow-sm relative flex flex-col items-center text-center" style={{ width: '100%', height: '100%', padding: '0.75rem', border: '1px solid #f8fafc' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <div className="icon-box-premium" style={{ width: '28px', height: '28px', background: '#f1f5f9' }}>
                                        <BarChart3 size={14} className="text-slate-500" />
                                    </div>
                                    <span className="performance-pill" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: '#f1f5f9', color: '#64748b' }}>Total</span>
                                </div>
                                <p style={{ fontSize: '10px', color: '#1e3a8a', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem', opacity: 0.8 }}>Placajes</p>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#003366', lineHeight: 1, marginTop: 'auto' }}>{defense.placajes_totales_registrados ?? '—'}</h3>
                            </div>
                        </div>

                        {/* Éxitos — green */}
                        <div style={{ width: 'auto', minWidth: '120px', padding: '0.4rem', backgroundColor: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: '1.25rem' }}>
                            <div className="bg-white rounded-xl shadow-sm relative flex flex-col items-center text-center" style={{ width: '100%', height: '100%', padding: '0.75rem', border: '1px solid #f8fafc' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <div className="icon-box-premium" style={{ width: '28px', height: '28px', background: '#dcfce7' }}>
                                        <ArrowUpCircle size={14} className="text-green-600" />
                                    </div>
                                    <span className="performance-pill" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: '#dcfce7', color: '#16a34a' }}>Éxito</span>
                                </div>
                                <p style={{ fontSize: '10px', color: '#1e3a8a', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem', opacity: 0.8 }}>Ganados</p>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#16a34a', lineHeight: 1, marginTop: 'auto' }}>{defense.placajes_ganados_exitosos ?? '—'}</h3>
                            </div>
                        </div>

                        {/* Fallos — red */}
                        <div style={{ width: 'auto', minWidth: '120px', padding: '0.4rem', backgroundColor: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: '1.25rem' }}>
                            <div className="bg-white rounded-xl shadow-sm relative flex flex-col items-center text-center" style={{ width: '100%', height: '100%', padding: '0.75rem', border: '1px solid #f8fafc' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <div className="icon-box-premium" style={{ width: '28px', height: '28px', background: '#fee2e2' }}>
                                        <ArrowDownCircle size={14} className="text-red-500" />
                                    </div>
                                    <span className="performance-pill" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: '#fee2e2', color: '#dc2626' }}>{isDefenseWeak ? 'Crítico' : 'Fallos'}</span>
                                </div>
                                <p style={{ fontSize: '10px', color: '#1e3a8a', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem', opacity: 0.8 }}>Perdidos</p>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#ef4444', lineHeight: 1, marginTop: 'auto' }}>{defense.placajes_perdidos_fallados ?? '—'}</h3>
                            </div>
                        </div>

                        {/* Eficacia global — orange */}
                        <div style={{ width: 'auto', minWidth: '120px', padding: '0.4rem', backgroundColor: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: '1.25rem' }}>
                            <div className="bg-white rounded-xl shadow-sm relative flex flex-col items-center text-center" style={{ width: '100%', height: '100%', padding: '0.75rem', border: '1px solid #f8fafc' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <div className="icon-box-premium icon-box-orange" style={{ width: '28px', height: '28px' }}>
                                        <Shield size={14} />
                                    </div>
                                    <span className="performance-pill pill-orange" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>{isDefenseWeak ? 'Débil' : 'Eficaz'}</span>
                                </div>
                                <p style={{ fontSize: '10px', color: '#1e3a8a', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem', opacity: 0.8 }}>Eficacia</p>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: isDefenseWeak ? '#ef4444' : '#FF6600', lineHeight: 1, marginTop: 'auto' }}>{defense.porcentaje_exito_global ?? '—'}</h3>
                            </div>
                        </div>

                        {/* Objetivo — blue */}
                        <div style={{ width: 'auto', minWidth: '120px', padding: '0.4rem', backgroundColor: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: '1.25rem' }}>
                            <div className="bg-white rounded-xl shadow-sm relative flex flex-col items-center text-center" style={{ width: '100%', height: '100%', padding: '0.75rem', border: '1px solid #f8fafc' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <div className="icon-box-premium" style={{ width: '28px', height: '28px' }}>
                                        <Target size={14} />
                                    </div>
                                    <span className="performance-pill pill-blue" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>Target</span>
                                </div>
                                <p style={{ fontSize: '10px', color: '#1e3a8a', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem', opacity: 0.8 }}>Objetivo</p>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#003366', lineHeight: 1, marginTop: 'auto' }}>80%</h3>
                            </div>
                        </div>
                    </div>

                    {defense.analisis_critico && (
                        <div className="flex gap-4 p-5 rounded-xl bg-orange-50 border border-orange-100">
                            <BarChart3 className="text-orange-500 shrink-0" size={20} />
                            <p className="text-sm text-slate-700 font-serif leading-relaxed"><strong>Disciplina Defensiva:</strong> {defense.analisis_critico}</p>
                        </div>
                    )}
                </div>

                {/* OFFENSIVE SECTION */}
                <div className="premium-card lg:col-span-5 flex flex-col justify-start" style={{ paddingTop: '2rem', paddingRight: '2rem', paddingBottom: '3.5rem', paddingLeft: '2rem' }}>
                    <h4 className="flex items-center gap-3 text-2xl font-black mb-8">
                        <Zap className="text-blue-900" /> Presión Ofensiva
                    </h4>

                    {/* 4 métricas — styled like the performance header */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1.5rem', width: '100%', marginBottom: '2rem' }}>
                        {/* Ensayos */}
                        <div style={{ width: 'auto', minWidth: '120px', padding: '0.4rem', backgroundColor: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: '1.25rem' }}>
                            <div className="bg-white rounded-xl shadow-sm relative flex flex-col items-center text-center" style={{ width: '100%', height: '100%', padding: '0.75rem', border: '1px solid #f8fafc' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <div className="icon-box-premium icon-box-orange" style={{ width: '28px', height: '28px' }}><Trophy size={14} /></div>
                                    <span className="performance-pill pill-orange" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>Score</span>
                                </div>
                                <p style={{ fontSize: '10px', color: '#1e3a8a', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem', opacity: 0.8 }}>Ensayos</p>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#FF6600', lineHeight: 1, marginTop: 'auto' }}>
                                    {offense.ensayos_a_favor ?? '—'}
                                </h3>
                            </div>
                        </div>

                        {/* Penales forzados */}
                        <div style={{ width: 'auto', minWidth: '120px', padding: '0.4rem', backgroundColor: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: '1.25rem' }}>
                            <div className="bg-white rounded-xl shadow-sm relative flex flex-col items-center text-center" style={{ width: '100%', height: '100%', padding: '0.75rem', border: '1px solid #f8fafc' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <div className="icon-box-premium" style={{ width: '28px', height: '28px' }}><Target size={14} /></div>
                                    <span className="performance-pill pill-blue" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>Discipl</span>
                                </div>
                                <p style={{ fontSize: '10px', color: '#1e3a8a', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem', opacity: 0.8 }}>Penales fz</p>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#003366', lineHeight: 1, marginTop: 'auto' }}>
                                    {offense.disciplina_forzada?.penales_sacados_a_favor ?? offense.penales_sacados_a_favor ?? '—'}
                                </h3>
                            </div>
                        </div>

                        {/* Errores de mano */}
                        <div style={{ width: 'auto', minWidth: '120px', padding: '0.4rem', backgroundColor: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: '1.25rem' }}>
                            <div className="bg-white rounded-xl shadow-sm relative flex flex-col items-center text-center" style={{ width: '100%', height: '100%', padding: '0.75rem', border: '1px solid #f8fafc' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <div className="icon-box-premium" style={{ width: '28px', height: '28px', background: '#fee2e2' }}>
                                        <Activity size={14} className="text-red-500" />
                                    </div>
                                    <span className="performance-pill" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: '#fee2e2', color: '#dc2626' }}>Error</span>
                                </div>
                                <p style={{ fontSize: '10px', color: '#1e3a8a', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem', opacity: 0.8 }}>Errores rn</p>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#ef4444', lineHeight: 1, marginTop: 'auto' }}>
                                    {offense.fases_de_juego?.errores_no_forzados_manos ?? offense.errores_no_forzados_manos ?? '—'}
                                </h3>
                            </div>
                        </div>

                        {/* Máxima Continuidad */}
                        <div style={{ width: 'auto', minWidth: '120px', padding: '0.4rem', backgroundColor: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: '1.25rem' }}>
                            <div className="bg-white rounded-xl shadow-sm relative flex flex-col items-center text-center" style={{ width: '100%', height: '100%', padding: '0.75rem', border: '1px solid #f8fafc' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <div className="icon-box-premium" style={{ width: '28px', height: '28px' }}><Gamepad2 size={14} /></div>
                                    <span className="performance-pill pill-blue" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>Fases</span>
                                </div>
                                <p style={{ fontSize: '10px', color: '#1e3a8a', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem', opacity: 0.8 }}>Máx Cont.</p>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#003366', lineHeight: 1, marginTop: 'auto', display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px' }}>
                                    <span>{offense.fases_de_juego?.maxima_retencion ?? offense.maxima_retencion ?? '—'}</span>
                                    {(offense.fases_de_juego?.veces_alcanzado_6_fases ?? offense.veces_alcanzado_6_fases) && (
                                        <span style={{ fontSize: '1rem', fontWeight: '900', color: '#1e3a8a', opacity: 0.5 }}>
                                            ({offense.fases_de_juego?.veces_alcanzado_6_fases ?? offense.veces_alcanzado_6_fases}×)
                                        </span>
                                    )}
                                </h3>
                            </div>
                        </div>
                    </div>

                    {/* Jugada destacada — si existe */}
                    {(offense.fases_de_juego?.jugada_con_mas_fases ?? offense.jugada_con_mas_fases ?? offense.fases_de_juego?.descripcion_jugada ?? offense.descripcion_jugada) && (
                        <div className="flex gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100 mb-4">
                            <Gamepad2 className="text-slate-400 shrink-0" size={16} />
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Jugada Destacada</p>
                                <p className="text-xs text-slate-600 italic font-serif leading-relaxed">
                                    "{offense.fases_de_juego?.jugada_con_mas_fases ?? offense.jugada_con_mas_fases ?? offense.fases_de_juego?.descripcion_jugada ?? offense.descripcion_jugada}"
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Análisis ofensivo si existe */}
                    {offense.analisis && (
                        <div className="flex gap-4 p-5 rounded-xl bg-orange-50 border border-orange-100">
                            <Zap className="text-orange-500 shrink-0" size={18} />
                            <p className="text-sm text-slate-700 font-serif leading-relaxed italic">"{offense.analisis}"</p>
                        </div>
                    )}
                </div>

                {/* SET PIECES PROPIOS */}
                <div className="premium-card lg:col-span-6 relative overflow-hidden flex flex-col justify-center" style={{ paddingTop: '2rem', paddingRight: '2rem', paddingBottom: '3.5rem', paddingLeft: '2rem' }}>
                    <div className="relative">
                        <h4 className="flex items-center gap-3 text-2xl font-black mb-8">
                            <TrendingUp className="text-blue-900" /> Set Pieces Propios
                        </h4>

                        {/* Retención global si disponible */}
                        {conquest.retencion_global_propias && (
                            <div className="mb-10 w-full px-4">
                                <div className="w-full flex flex-col items-center">
                                    <div className="w-full" style={{ maxWidth: '400px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <span style={{ color: '#16a34a', fontWeight: '900', fontSize: '1.5rem', minWidth: '65px', textAlign: 'right', letterSpacing: '-0.05em' }}>
                                                {conquest.retencion_global_propias}
                                            </span>
                                            <div style={{ flex: 1, height: '18px', backgroundColor: '#fee2e2', borderRadius: '9px', display: 'flex', overflow: 'hidden', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }}>
                                                <div style={{ width: `${parseFloat(conquest.retencion_global_propias.replace('%', '')) || 0}%`, backgroundColor: '#16a34a', transition: 'width 1s ease' }} />
                                                <div style={{ width: `${100 - (parseFloat(conquest.retencion_global_propias.replace('%', '')) || 0)}%`, backgroundColor: '#dc2626', transition: 'width 1s ease' }} />
                                            </div>
                                            <span style={{ color: '#dc2626', fontWeight: '900', fontSize: '1.5rem', minWidth: '65px', letterSpacing: '-0.05em' }}>
                                                {(100 - (parseFloat(conquest.retencion_global_propias.replace('%', '')) || 0)).toFixed(1).replace('.0', '')}%
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 65px', marginTop: '0.5rem' }}>
                                            <span style={{ fontSize: '10px', color: '#16a34a', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Retención</span>
                                            <span style={{ fontSize: '10px', color: '#dc2626', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Pérdida</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-row flex-wrap md:flex-nowrap justify-center items-stretch gap-4 italic font-serif mb-6">
                            {/* Melé Propia */}
                            <div className="flex-1 w-full md:w-auto p-6 bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col items-center">
                                {/* Only Title and Number in Blue Wrapper */}
                                <div style={{ padding: '0.5rem', backgroundColor: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: '1.25rem', width: '100%', maxWidth: '200px', aspectRatio: '1/1', display: 'flex', marginBottom: '1.5rem' }}>
                                    <div className="bg-white rounded-xl shadow-sm relative flex flex-col items-center justify-center text-center w-full p-3 border border-slate-50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="icon-box-premium"><Shield size={16} /></div>
                                            <span className="performance-pill pill-blue">Melé</span>
                                        </div>
                                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-2">Ganadas</p>
                                        <h3 className="text-3xl font-black text-blue-900 leading-none">{meleGanadas}/{melePropia.lanzamientos}</h3>
                                    </div>
                                </div>

                                {/* Progress Bar & Percentages Outside */}
                                {conquest.mele_scrum ? (
                                    <div className="w-full mt-auto mb-2 px-2 flex flex-col items-center">
                                        {melePropia.lanzamientos > 0 && (
                                            <div className="w-full mx-auto" style={{ maxWidth: '300px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                                                    <span style={{ color: '#16a34a', fontWeight: '900', fontSize: '1.25rem', minWidth: '45px', textAlign: 'right', letterSpacing: '-0.05em' }}>
                                                        {meleRetentionValue}%
                                                    </span>
                                                    <div style={{ flex: 1, height: '14px', backgroundColor: '#fee2e2', borderRadius: '7px', display: 'flex', overflow: 'hidden', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }}>
                                                        <div style={{ width: `${meleRetentionValue}%`, backgroundColor: '#16a34a', transition: 'width 1s ease' }} />
                                                        <div style={{ width: `${100 - meleRetentionValue}%`, backgroundColor: '#dc2626', transition: 'width 1s ease' }} />
                                                    </div>
                                                    <span style={{ color: '#dc2626', fontWeight: '900', fontSize: '1.25rem', minWidth: '45px', textAlign: 'left', letterSpacing: '-0.05em' }}>
                                                        {100 - meleRetentionValue}%
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 45px', marginTop: '0.25rem' }}>
                                                    <span style={{ fontSize: '9px', color: '#16a34a', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Retención</span>
                                                    <span style={{ fontSize: '9px', color: '#dc2626', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Pérdida</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic mt-auto mb-2 w-full text-center">Sin datos</p>
                                )}

                                {/* Bocadillo Análisis Melé Propia Outside */}
                                {(melePropia.nota || tactico?.fases_de_conquista?.mele) && (
                                    <div className="relative mt-8 w-full text-left pt-3 flex flex-col items-center" style={{ marginTop: '3rem' }}>
                                        <div className="absolute top-1 max-md:top-2 left-1/2 -translate-x-1/2 w-4 h-4 transform rotate-45 z-0" style={{ backgroundColor: '#fef2f2', borderTop: '1px solid #fecaca', borderLeft: '1px solid #fecaca' }}></div>
                                        <div className="relative z-10 rounded-xl p-4 shadow-sm" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', width: '100%', maxWidth: '280px' }}>
                                            <p className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center justify-center gap-1.5" style={{ color: '#dc2626' }}><Shield size={12} /> Info Táctica</p>
                                            <div style={{ minHeight: '4.8rem' }}>
                                                <p className="text-[11px] italic font-serif leading-relaxed text-justify" style={{ color: '#7f1d1d' }}>"{melePropia.nota || tactico?.fases_de_conquista?.mele}"</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Touch Propia */}
                            <div className="flex-1 w-full md:w-auto p-6 bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col items-center">
                                {/* Only Title and Number in Blue Wrapper */}
                                <div style={{ padding: '0.5rem', backgroundColor: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: '1.25rem', width: '100%', maxWidth: '200px', aspectRatio: '1/1', display: 'flex', marginBottom: '1.5rem' }}>
                                    <div className="bg-white rounded-xl shadow-sm relative flex flex-col items-center justify-center text-center w-full p-3 border border-slate-50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="icon-box-premium" style={{ background: '#f1f5f9' }}><TrendingUp size={16} className="text-slate-500" /></div>
                                            <span className="performance-pill" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: '#f1f5f9', color: '#64748b' }}>Touch</span>
                                        </div>
                                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-2">Ganadas</p>
                                        <h3 className="text-3xl font-black text-blue-900 leading-none">{touchGanadas}/{touchPropia.lanzamientos}</h3>
                                    </div>
                                </div>

                                {/* Progress Bar & Percentages Outside */}
                                {conquest.touch_lineout ? (
                                    <div className="w-full mt-auto mb-2 px-2 flex flex-col items-center">
                                        {touchPropia.lanzamientos > 0 && (
                                            <div className="w-full mx-auto" style={{ maxWidth: '300px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                                                    <span style={{ color: '#16a34a', fontWeight: '900', fontSize: '1.25rem', minWidth: '45px', textAlign: 'right', letterSpacing: '-0.05em' }}>
                                                        {touchRetentionValue}%
                                                    </span>
                                                    <div style={{ flex: 1, height: '14px', backgroundColor: '#fee2e2', borderRadius: '7px', display: 'flex', overflow: 'hidden', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }}>
                                                        <div style={{ width: `${touchRetentionValue}%`, backgroundColor: '#16a34a', transition: 'width 1s ease' }} />
                                                        <div style={{ width: `${100 - touchRetentionValue}%`, backgroundColor: '#dc2626', transition: 'width 1s ease' }} />
                                                    </div>
                                                    <span style={{ color: '#dc2626', fontWeight: '900', fontSize: '1.25rem', minWidth: '45px', textAlign: 'left', letterSpacing: '-0.05em' }}>
                                                        {100 - touchRetentionValue}%
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 45px', marginTop: '0.25rem' }}>
                                                    <span style={{ fontSize: '9px', color: '#16a34a', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Retención</span>
                                                    <span style={{ fontSize: '9px', color: '#dc2626', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Pérdida</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic mt-auto mb-2 w-full text-center">Sin datos</p>
                                )}

                                {/* Bocadillo Análisis Touch Propia Outside */}
                                {(touchPropia.nota || tactico?.fases_de_conquista?.touch) && (
                                    <div className="relative mt-8 w-full text-left pt-3 flex flex-col items-center" style={{ marginTop: '3rem' }}>
                                        <div className="absolute top-1 max-md:top-2 left-1/2 -translate-x-1/2 w-4 h-4 transform rotate-45 z-0" style={{ backgroundColor: '#fef2f2', borderTop: '1px solid #fecaca', borderLeft: '1px solid #fecaca' }}></div>
                                        <div className="relative z-10 rounded-xl p-4 shadow-sm" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', width: '100%', maxWidth: '280px' }}>
                                            <p className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center justify-center gap-1.5" style={{ color: '#dc2626' }}><TrendingUp size={12} /> Info Táctica</p>
                                            <div style={{ minHeight: '4.8rem' }}>
                                                <p className="text-[11px] italic font-serif leading-relaxed text-justify" style={{ color: '#7f1d1d' }}>"{touchPropia.nota || tactico?.fases_de_conquista?.touch}"</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* CONQUISTA RIVAL */}
                <div className="premium-card lg:col-span-6 relative overflow-hidden flex flex-col justify-center" style={{ paddingTop: '2rem', paddingRight: '2rem', paddingBottom: '3.5rem', paddingLeft: '2rem' }}>
                    <div className="relative">
                        <h4 className="flex items-center gap-3 text-2xl font-black mb-8">
                            <Target className="text-orange-500" /> Conquista Rival
                        </h4>

                        <div className="flex flex-row flex-wrap md:flex-nowrap justify-center items-stretch gap-4 italic font-serif mb-6">
                            {/* Melé Rival */}
                            <div className="flex-1 w-full md:w-auto p-6 bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col items-center">
                                {/* Only Title and Number in Blue Wrapper */}
                                <div style={{ padding: '0.5rem', backgroundColor: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: '1.25rem', width: '100%', maxWidth: '200px', aspectRatio: '1/1', display: 'flex', marginBottom: '1.5rem' }}>
                                    <div className="bg-white rounded-xl shadow-sm relative flex flex-col items-center justify-center text-center" style={{ width: '100%', padding: '0.75rem', border: '1px solid #f8fafc' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                            <div className="icon-box-premium icon-box-orange" style={{ width: '28px', height: '28px' }}><Shield size={14} /></div>
                                            <span className="performance-pill pill-orange" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>Melé</span>
                                        </div>
                                        <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '0.5rem' }}>Perdidas</p>
                                        <h3 style={{ fontSize: '2rem', fontWeight: '900', color: '#FF6600', lineHeight: 1 }}>{meleRivalPerdidas ?? '—'}/{meleRival.lanzamientos}</h3>
                                    </div>
                                </div>

                                {/* Extra Information Outside */}
                                {conquest.mele_scrum ? null : (
                                    <p className="text-xs text-slate-400 italic mt-auto mb-2 w-full text-center">Sin datos</p>
                                )}

                                {/* Bocadillo Análisis Melé Rival Outside */}
                                {(meleRival.nota || tactico?.fases_de_conquista?.mele) && (
                                    <div className="relative mt-5 w-full text-left pt-3 flex flex-col items-center" style={{ marginTop: '3rem' }}>
                                        <div className="absolute top-1 max-md:top-2 left-1/2 -translate-x-1/2 w-4 h-4 transform rotate-45 z-0" style={{ backgroundColor: '#fff7ed', borderTop: '1px solid #fed7aa', borderLeft: '1px solid #fed7aa' }}></div>
                                        <div className="relative z-10 rounded-xl p-4 shadow-sm" style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', width: '100%', maxWidth: '280px' }}>
                                            <p className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center justify-center gap-1.5" style={{ color: '#ea580c' }}><Shield size={12} /> Info Táctica</p>
                                            <div style={{ minHeight: '4.8rem' }}>
                                                <p className="text-[11px] italic font-serif leading-relaxed text-justify" style={{ color: '#9a3412' }}>"{meleRival.nota || tactico?.fases_de_conquista?.mele}"</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Touch Rival */}
                            <div className="flex-1 w-full md:w-auto p-6 bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col items-center">
                                {/* Only Title and Number in Blue Wrapper */}
                                <div style={{ padding: '0.5rem', backgroundColor: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: '1.25rem', width: '100%', maxWidth: '200px', aspectRatio: '1/1', display: 'flex', marginBottom: '1.5rem' }}>
                                    <div className="bg-white rounded-xl shadow-sm relative flex flex-col items-center justify-center text-center" style={{ width: '100%', padding: '0.75rem', border: '1px solid #f8fafc' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                            <div className="icon-box-premium icon-box-orange" style={{ width: '28px', height: '28px' }}><TrendingUp size={14} /></div>
                                            <span className="performance-pill pill-orange" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>Touch</span>
                                        </div>
                                        <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '0.5rem' }}>Perdidas</p>
                                        <h3 style={{ fontSize: '2rem', fontWeight: '900', color: '#FF6600', lineHeight: 1 }}>{touchRivalRobos ?? '—'}/{touchRival.lanzamientos}</h3>
                                    </div>
                                </div>

                                {/* Extra Information Outside */}
                                {conquest.touch_lineout ? null : (
                                    <p className="text-xs text-slate-400 italic mt-auto mb-2 w-full text-center">Sin datos</p>
                                )}

                                {/* Bocadillo Análisis Touch Rival Outside */}
                                {(touchRival.nota || tactico?.fases_de_conquista?.touch) && (
                                    <div className="relative mt-5 w-full text-left pt-3 flex flex-col items-center" style={{ marginTop: '3rem' }}>
                                        <div className="absolute top-1 max-md:top-2 left-1/2 -translate-x-1/2 w-4 h-4 transform rotate-45 z-0" style={{ backgroundColor: '#fff7ed', borderTop: '1px solid #fed7aa', borderLeft: '1px solid #fed7aa' }}></div>
                                        <div className="relative z-10 rounded-xl p-4 shadow-sm" style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', width: '100%', maxWidth: '280px' }}>
                                            <p className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center justify-center gap-1.5" style={{ color: '#ea580c' }}><TrendingUp size={12} /> Info Táctica</p>
                                            <div style={{ minHeight: '4.8rem' }}>
                                                <p className="text-[11px] italic font-serif leading-relaxed text-justify" style={{ color: '#9a3412' }}>"{touchRival.nota || tactico?.fases_de_conquista?.touch}"</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* COACH INSIGHTS - PREMIUM VIEW */}
            {
                insights.length > 0 && (
                    <div className="w-full" style={{ marginTop: '2rem', marginBottom: '0.5rem' }}>
                        <div className="flex items-center gap-4">
                            <div className="h-px bg-slate-200 flex-1"></div>
                            <h4 className="flex items-center gap-3 font-black uppercase text-slate-400" style={{ fontSize: '1.75rem', letterSpacing: '0.25em' }}>
                                <MessageSquare className="text-blue-900" size={28} /> Notas Técnicas
                            </h4>
                            <div className="h-px bg-slate-200 flex-1"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {insights.map((insight, idx) => (
                                <div key={idx} className="insight-premium-card px-10 py-14 group overflow-hidden flex flex-col h-full">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="p-3 bg-slate-50 text-blue-900 rounded-xl group-hover:bg-blue-900 group-hover:text-white transition-all duration-300 shadow-sm border border-slate-100/50">
                                            <Award size={24} />
                                        </div>
                                        <h4 className="flex-1 font-black text-slate-800 m-0" style={{ fontSize: '1.25rem', lineHeight: '1.2' }}>{insight.titulo}</h4>
                                    </div>
                                    <p className="text-[15px] text-slate-600 font-serif italic flex-1" style={{ lineHeight: '2rem', padding: '0 0.5rem' }}>"{insight.descripcion}"</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }

            {/* ═══════════════════════════════════════════════════════
                     INTELLIGENCE REPORT SECTIONS
                ═══════════════════════════════════════════════════════ */}
            {
                (tactico || discrepancias.length > 0 || topTacklers.length > 0 || alertasDef.length > 0) ? (
                    <>
                        {/* — HEADER BADGE — */}
                        <div className="w-full" style={{ marginTop: '2rem', marginBottom: '0.5rem' }}>
                            <div className="flex items-center gap-4">
                                <div className="h-px bg-slate-200 flex-1"></div>
                                <h4 className="flex items-center gap-3 font-black uppercase text-slate-400" style={{ fontSize: '1.75rem', letterSpacing: '0.25em' }}>
                                    <Zap className="text-blue-900" size={28} /> Informe de Inteligencia de Partido
                                </h4>
                                <div className="h-px bg-slate-200 flex-1"></div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-8">

                            {/* ─── 1. VAR / AUDITORÍA DE ACTAS ─── */}
                            {discrepancias.length > 0 && (
                                <div className="premium-card lg:col-span-12 relative flex flex-col justify-start" style={{ paddingTop: '2rem', paddingRight: '2rem', paddingBottom: '3.5rem', paddingLeft: '2rem' }}>
                                    <h4 className="flex items-center gap-3 text-2xl font-black mb-8 w-full text-[#003366]">
                                        <AlertTriangle className="text-orange-500" /> Auditoría Acta vs. Vídeo discrepancias
                                    </h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-start', gap: '1.5rem', width: '100%' }}>
                                        {discrepancias.map((d, i) => (
                                            <div key={i} style={{ flex: '1 1 300px', maxWidth: '500px', padding: '0.4rem', backgroundColor: '#fffbeb', border: '2px solid #fde68a', borderRadius: '1.25rem' }}>
                                                <div className="bg-white rounded-xl shadow-sm relative flex flex-col" style={{ width: '100%', height: '100%', padding: '1rem', border: '1px solid #f8fafc' }}>
                                                    {/* Header */}
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <div className="icon-box-premium" style={{ width: '28px', height: '28px', background: '#fef3c7' }}>
                                                                <AlertCircle size={14} className="text-amber-600" />
                                                            </div>
                                                            <span className="performance-pill" style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', background: '#fef3c7', color: '#b45309', fontWeight: '800' }}>
                                                                {d.tipo}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">⏱ {d.tiempo_aprox}</span>
                                                    </div>

                                                    {/* Comparison Grid */}
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem', flex: 1 }}>
                                                        <div style={{ padding: '0.85rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                                                            <p style={{ fontSize: '9px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.35rem' }}>📄 Acta</p>
                                                            <p style={{ fontSize: '0.85rem', fontWeight: '700', color: '#334155', lineHeight: 1.3, margin: 0 }}>{d.segun_acta}</p>
                                                        </div>
                                                        <div style={{ padding: '0.85rem', backgroundColor: '#eff6ff', borderRadius: '0.75rem', border: '1px solid #bfdbfe', display: 'flex', flexDirection: 'column' }}>
                                                            <p style={{ fontSize: '9px', color: '#1d4ed8', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.35rem' }}>🎥 Vídeo</p>
                                                            <p style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e3a8a', lineHeight: 1.3, margin: 0 }}>{d.segun_video}</p>
                                                        </div>
                                                    </div>

                                                    {/* Action Required */}
                                                    {d.accion_requerida && (
                                                        <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px dashed #fcd34d', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                                            <span style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px', fontWeight: '900' }}>→</span>
                                                            <p style={{ fontSize: '0.8rem', fontWeight: '700', color: '#b45309', margin: 0 }}>{d.accion_requerida}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ─── 2. RENDIMIENTO DEFENSIVO INDIVIDUAL ─── */}
                            {(topTacklers.length > 0 || alertasDef.length > 0) && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                                    {/* Los Muros — Top Tacklers */}
                                    {topTacklers.length > 0 && (
                                        <div className="premium-card lg:col-span-1" style={{ paddingTop: '2rem', paddingRight: '2rem', paddingBottom: '3.5rem', paddingLeft: '2rem' }}>
                                            <h4 className="flex items-center gap-3 text-xl font-black mb-6 text-[#003366]">
                                                <Shield size={20} className="text-green-500" /> Los Muros — Top Tacklers
                                            </h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                                                {topTacklers.map((p, i) => {
                                                    const photoUrl = getPlayerPhoto(p.dorsal, p.nombre);
                                                    return (
                                                        <div key={i} style={{ padding: '0.4rem', backgroundColor: '#f0fdf4', border: '2px solid #bbf7d0', borderRadius: '1.25rem' }}>
                                                            <div className="bg-white rounded-xl shadow-sm relative flex items-center justify-between" style={{ padding: '0.75rem 1rem', border: '1px solid #f8fafc' }}>
                                                                {/* User Avatar/Dorsal */}
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                                    {photoUrl ? (
                                                                        <img src={photoUrl} alt={p.nombre} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #dcfce7' }} />
                                                                    ) : (
                                                                        <div className="icon-box-premium" style={{ width: '40px', height: '40px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                            <span style={{ fontSize: '1rem', fontWeight: '900', color: '#166534' }}>{p.dorsal}</span>
                                                                        </div>
                                                                    )}
                                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                        <p style={{ fontSize: '0.9rem', fontWeight: '800', color: '#1e293b', margin: 0 }}>{p.nombre}</p>
                                                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                                                                            <span style={{ fontSize: '0.7rem', color: '#15803d', fontWeight: '700' }}>{p.placajes_ganados} Éxito</span>
                                                                            <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: '700' }}>{p.placajes_perdidos} Fallo</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Result Stat */}
                                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                                                                    <span className="performance-pill" style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', background: '#dcfce7', color: '#16a34a', marginBottom: '0.2rem' }}>Tasa</span>
                                                                    <span style={{ fontSize: '1.25rem', fontWeight: '900', color: '#16a34a', lineHeight: 1 }}>{p.tasa_exito}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Focos de Mejora — Alertas Defensivas */}
                                    {alertasDef.length > 0 && (
                                        <div className="premium-card lg:col-span-1" style={{ paddingTop: '2rem', paddingRight: '2rem', paddingBottom: '3.5rem', paddingLeft: '2rem' }}>
                                            <h4 className="flex items-center gap-3 text-xl font-black mb-6 text-[#003366]">
                                                <Target size={20} className="text-red-500" /> Focos de Mejora
                                            </h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                                                {alertasDef.map((p, i) => {
                                                    const photoUrl = getPlayerPhoto(p.dorsal, p.nombre);
                                                    return (
                                                        <div key={i} style={{ padding: '0.4rem', backgroundColor: '#fef2f2', border: '2px solid #fecaca', borderRadius: '1.25rem' }}>
                                                            <div className="bg-white rounded-xl shadow-sm relative flex items-center justify-between" style={{ padding: '0.75rem 1rem', border: '1px solid #f8fafc' }}>
                                                                {/* User Avatar/Dorsal */}
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                                    {photoUrl ? (
                                                                        <img src={photoUrl} alt={p.nombre} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #fee2e2' }} />
                                                                    ) : (
                                                                        <div className="icon-box-premium" style={{ width: '40px', height: '40px', background: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                            <span style={{ fontSize: '1rem', fontWeight: '900', color: '#b91c1c' }}>{p.dorsal}</span>
                                                                        </div>
                                                                    )}
                                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                        <p style={{ fontSize: '0.9rem', fontWeight: '800', color: '#1e293b', margin: 0 }}>{p.nombre}</p>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                                                                            <span style={{ fontSize: '0.7rem', color: '#15803d', fontWeight: '700' }}>{p.placajes_ganados} Éxito</span>
                                                                            <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: '700' }}>{p.placajes_perdidos} Fallo</span>
                                                                            {p.zona && <span style={{ padding: '0.1rem 0.3rem', borderRadius: '4px', background: '#fee2e2', color: '#dc2626', fontSize: '0.6rem', fontWeight: '900', textTransform: 'uppercase' }}>{p.zona}</span>}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Result Stat */}
                                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                                                                    <span className="performance-pill" style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', background: '#fee2e2', color: '#dc2626', marginBottom: '0.2rem' }}>Alerta</span>
                                                                    <span style={{ fontSize: '1.25rem', fontWeight: '900', color: '#dc2626', lineHeight: 1 }}>{p.tasa_exito}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ─── 3. ANÁLISIS TÁCTICO GLOBAL ─── */}
                            {tactico && (
                                <div className="mt-8">
                                    {/* — HEADER BADGE — */}
                                    <div className="w-full" style={{ marginTop: '2rem', marginBottom: '0.5rem' }}>
                                        <div className="flex items-center gap-4">
                                            <div className="h-px bg-slate-200 flex-1"></div>
                                            <h4 className="flex items-center gap-3 font-black uppercase text-slate-400" style={{ fontSize: '1.75rem', letterSpacing: '0.25em' }}>
                                                <TrendingUp className="text-blue-900" size={28} /> Análisis Táctico
                                            </h4>
                                            <div className="h-px bg-slate-200 flex-1"></div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                        {/* Dominio Posesión */}
                                        {tactico.dominio_posesion && (
                                            <div className="insight-premium-card px-10 py-14 group overflow-hidden flex flex-col h-full">
                                                <div className="flex items-center gap-4 mb-6">
                                                    <div className="p-3 bg-slate-50 text-orange-500 rounded-xl group-hover:bg-orange-500 group-hover:text-white transition-all duration-300 shadow-sm border border-slate-100/50">
                                                        <Activity size={24} />
                                                    </div>
                                                    <h4 className="flex-1 font-black text-slate-800 m-0" style={{ fontSize: '1.25rem', lineHeight: '1.2' }}>Dominio Posesión</h4>
                                                </div>

                                                <div className="flex gap-4 mb-4 justify-center items-center">
                                                    <div className="text-center">
                                                        <span className="text-3xl font-black text-orange-500">{tactico.dominio_posesion.posesion_hospitalet}</span>
                                                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">Hospitalet</p>
                                                    </div>
                                                    <div className="text-slate-300 font-black text-3xl mx-2">·</div>
                                                    <div className="text-center">
                                                        <span className="text-3xl font-black text-[#003366]">{tactico.dominio_posesion.posesion_sant_cugat}</span>
                                                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">Rival</p>
                                                    </div>
                                                </div>

                                                {tactico.dominio_posesion.conclusion && (
                                                    <p className="text-[15px] text-slate-600 font-serif italic flex-1 mt-4" style={{ lineHeight: '2rem', padding: '0 0.5rem' }}>"{tactico.dominio_posesion.conclusion}"</p>
                                                )}
                                            </div>
                                        )}

                                        {/* Fases de Conquista */}
                                        {tactico.fases_de_conquista && (
                                            <div className="insight-premium-card px-10 py-14 group overflow-hidden flex flex-col h-full">
                                                <div className="flex items-center gap-4 mb-6">
                                                    <div className="p-3 bg-slate-50 text-blue-900 rounded-xl group-hover:bg-blue-900 group-hover:text-white transition-all duration-300 shadow-sm border border-slate-100/50">
                                                        <Shield size={24} />
                                                    </div>
                                                    <h4 className="flex-1 font-black text-slate-800 m-0" style={{ fontSize: '1.25rem', lineHeight: '1.2' }}>Set Pieces</h4>
                                                </div>

                                                <div className="flexflex-col gap-4 flex-1">
                                                    {tactico.fases_de_conquista.mele && (
                                                        <div className="mb-4">
                                                            <span className="text-[11px] font-black text-blue-900 uppercase tracking-widest">Melé //</span>
                                                            <p className="text-[14px] text-slate-600 mt-1 leading-relaxed">{tactico.fases_de_conquista.mele}</p>
                                                        </div>
                                                    )}
                                                    {tactico.fases_de_conquista.touch && (
                                                        <div>
                                                            <span className="text-[11px] font-black text-blue-900 uppercase tracking-widest">Touch //</span>
                                                            <p className="text-[14px] text-slate-600 mt-1 leading-relaxed">{tactico.fases_de_conquista.touch}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Impacto Banquillo */}
                                        {tactico.impacto_banquillo && (
                                            <div className="insight-premium-card px-10 py-14 group overflow-hidden flex flex-col h-full md:col-span-2 lg:col-span-1">
                                                <div className="flex items-center gap-4 mb-6">
                                                    <div className="p-3 bg-slate-50 text-amber-500 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-all duration-300 shadow-sm border border-slate-100/50">
                                                        <Zap size={24} />
                                                    </div>
                                                    <h4 className="flex-1 font-black text-slate-800 m-0" style={{ fontSize: '1.25rem', lineHeight: '1.2' }}>Impacto Banquillo</h4>
                                                </div>

                                                <div className="flex-1 flex flex-col">
                                                    {tactico.impacto_banquillo.jugador_clave && (
                                                        <p className="font-black text-lg text-[#003366] mb-2">{tactico.impacto_banquillo.jugador_clave}</p>
                                                    )}
                                                    {tactico.impacto_banquillo.accion && (
                                                        <p className="text-[14px] text-slate-600 mb-4 leading-relaxed">{tactico.impacto_banquillo.accion}</p>
                                                    )}
                                                    {tactico.impacto_banquillo.conclusion && (
                                                        <p className="text-[15px] text-slate-600 font-serif italic mt-auto" style={{ lineHeight: '2rem', padding: '0 0.5rem' }}>"{tactico.impacto_banquillo.conclusion}"</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                </div>
                            )}

                        </div>
                    </>
                ) : (
                    /* Backward-compatible empty state for old match JSONs */
                    <div className="mt-12 flex items-center gap-4 p-6 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="text-3xl opacity-30">🔍</div>
                        <div>
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Sin Informe de Inteligencia</p>
                            <p className="text-xs text-slate-400 mt-0.5">Este partido no tiene datos del formato avanzado Nac Sport + Acta FCR.</p>
                        </div>
                    </div>
                )
            }

            {/* BRANDING FOOTER */}
            <div className="mt-16 border-t border-slate-100 pt-8">
            </div>
        </div >
    );
};

export default VideoAnalysisDashboard;
