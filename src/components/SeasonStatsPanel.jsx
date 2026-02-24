import React, { useState, useEffect } from 'react';
import { Upload, Trophy, Target, AlertTriangle, ChevronDown, ChevronUp, X, Check, TrendingUp, Users, Lightbulb, Shield } from 'lucide-react';

const STORAGE_KEY = 's16_season_json_v2';

// ─── Default Full JSON (merged from both objects provided) ────────────────────
const DEFAULT_JSON = {
    "temporada_s16_1a_catalana": {
        "equipo_info": {
            "nombre": "RC L'HOSPITALET",
            "estadio_local": "FEIXA LLARGA",
            "contexto_temporada": "Ascenso reciente desde 3a División. Año de consolidación y adaptación al contacto y ritmo de 1a Catalana."
        },
        "kpis_temporada": {
            "partidos_registrados": 10,
            "victorias": 2,
            "derrotas": 8,
            "puntos_favor": 147,
            "puntos_contra": 568,
            "diferencia": -421,
            "total_ensayos_favor": 24,
            "total_transformaciones_favor": 6,
            "total_golpes_castigo_favor": 3,
            "puntos_al_pie": 21,
            "puntos_a_la_mano": 120
        },
        "analisis_local_vs_visitante": {
            "local": {
                "partidos": 5, "victorias": 2, "derrotas": 3,
                "puntos_favor": 100, "puntos_contra": 244,
                "promedio_puntos_favor_partido": 20.0,
                "nota": "El equipo se hace fuerte en casa. Ambas victorias (CRUC y BUC) se consiguieron en la Feixa Llarga."
            },
            "visitante": {
                "partidos": 5, "victorias": 0, "derrotas": 5,
                "puntos_favor": 47, "puntos_contra": 324,
                "promedio_puntos_favor_partido": 9.4,
                "nota": "Sufrimiento lejos de casa, acusando más la presión inicial de los equipos locales consolidados."
            }
        },
        "efecto_adaptacion_primera_vs_segunda_vuelta": [
            { "rival": "BUC", "ida": { "condicion": "Visitante", "resultado": "48-8", "estado": "Derrota" }, "vuelta": { "condicion": "Local", "resultado": "29-18", "estado": "Victoria" }, "mejora_diferencial": "+51 puntos", "analisis": "El punto de inflexión de la temporada. Demuestra adaptación táctica al rival y fortaleza mental tras una derrota dura." },
            { "rival": "CR SANT CUGAT", "ida": { "condicion": "Visitante", "resultado": "110-10", "estado": "Derrota" }, "vuelta": { "condicion": "Local", "resultado": "54-31", "estado": "Derrota" }, "mejora_diferencial": "+77 puntos", "analisis": "Pese a la derrota, anotar 31 puntos a un equipo dominante que os hizo más de 100 en la ida refleja una mejora masiva en la retención del balón y el juego de fases." },
            { "rival": "UES", "ida": { "condicion": "Local", "resultado": "0-115", "estado": "Derrota" }, "vuelta": { "condicion": "Visitante", "resultado": "53-5", "estado": "Derrota" }, "mejora_diferencial": "+67 puntos", "analisis": "Mejora defensiva sustancial. Se redujeron los espacios y se mejoró el placaje de primer contacto." },
            { "rival": "FÉNIX", "ida": { "condicion": "Local", "resultado": "10-33", "estado": "Derrota" }, "vuelta": { "condicion": "Visitante", "resultado": "28-14", "estado": "Derrota" }, "mejora_diferencial": "+9 puntos", "analisis": "Partidos consistentes, acortando distancias incluso jugando en Zaragoza." }
        ],
        "insights_all_blacks_tactica": {
            "reloj_de_anotacion_propia": {
                "minutos_0_a_20": "5 ensayos", "minutos_21_a_40": "8 ensayos",
                "minutos_41_a_60": "6 ensayos", "minutos_61_a_70": "5 ensayos",
                "conclusion": "El equipo es un motor diésel. Tarda en arrancar, pero mantiene un ritmo anotador constante en la segunda mitad. No hay caídas físicas drásticas en ataque al final del partido."
            },
            "indice_de_fatiga_defensiva": {
                "observacion": "En los partidos contra UES y Sant Cugat, el equipo recibe avalanchas de ensayos consecutivos en ventanas de 5-10 minutos.",
                "diagnostico": "Cuando la línea defensiva se rompe, el equipo sufre para realinearse rápido ('fold' defensivo). Hay que trabajar la resiliencia mental post-ensayo en contra."
            },
            "liderazgo_y_capitania": {
                "capitan_principal": "Jiménez González, Lucas (9 partidos)",
                "capitan_alternativo": "Navarro Minguez, Alex (1 partido, J7)",
                "impacto": "Lucas es el ancla emocional del equipo. Tener un capitán estable en una temporada de transición es clave."
            }
        },
        "estadisticas_individuales": {
            "maximos_anotadores_total_puntos": [
                { "jugador": "Vallespin Viera, Oriol", "puntos": 30, "desglose": "6 Ensayos" },
                { "jugador": "Díaz Pauta, Pau", "puntos": 24, "desglose": "3 Ensayos, 3 Trans., 1 GC" },
                { "jugador": "Caro Caballero, Victor", "puntos": 20, "desglose": "4 Ensayos" },
                { "jugador": "Epoumbi, Prescott Lacroix", "puntos": 15, "desglose": "3 Ensayos" },
                { "jugador": "Buges Sanchez, Erik", "puntos": 12, "desglose": "3 Trans., 2 GC" }
            ],
            "disciplina": {
                "total_tarjetas_amarillas": 3, "total_tarjetas_rojas": 1,
                "analisis": "Promedio bajísimo (0.4 por partido). Las tarjetas amarillas en min 60' y 64' indican placajes a destiempo por fatiga."
            }
        },
        "analisis_posicional_forwards_vs_backs": {
            "ataque_hospitalet_ensayos_a_favor": {
                "total_ensayos": 23,
                "delanteros_forwards_1_al_8": {
                    "ensayos": 10, "porcentaje": "43.5%",
                    "jugadores_destacados": ["Caro Caballero, Victor (8)", "Epoumbi, Prescott (3)", "Gil Bebebino (1)"],
                    "analisis": "Un porcentaje alto para la delantera. El equipo tiene un 'pack' pesado, valiente y muy dominante en la zona de 5 metros (pick and go)."
                },
                "tres_cuartos_backs_9_al_15": {
                    "ensayos": 13, "porcentaje": "56.5%",
                    "jugadores_destacados": ["Vallespin Viera, Oriol (14)", "Díaz Pauta, Pau (13)", "Navarro Minguez (15)"],
                    "analisis": "La línea finaliza el trabajo de desgaste de los delanteros. Este equilibrio 43/57% es ideal: el equipo no es predecible."
                }
            },
            "defensa_hospitalet_ensayos_en_contra": {
                "diagnostico_general": "Dos 'fugas' principales dependiendo del tipo de rival.",
                "perfiles_de_rivales": [
                    { "tipo_de_rival": "La Guerra de Trincheras (BUC)", "como_nos_anotan": "Juego ultracerrado de delanteros.", "datos_clave": "En J2, BUC anotó 8 ensayos (7 de delanteros). En J9, sus 3 ensayos también fueron de la delantera.", "evolucion_hospitalet": "En la J9 el equipo entendió esto y ganó 29-18 la guerra física con Hospi anotando 4 de 5 ensayos." },
                    { "tipo_de_rival": "La Sangría Exterior (UES, Sant Cugat)", "como_nos_anotan": "Velocidad por las alas.", "datos_clave": "Contra UES (J4), 23 de 28 ensayos fueron de sus backs. Contra Sant Cugat (J5), más de 16.", "vulnerabilidad_detectada": "La defensa no logra bascular con suficiente velocidad. Falta comunicación entre centros y alas." }
                ]
            },
            "insights_tacticos_inteligencia_deportiva": [
                { "titulo": "Camaleones Tácticos", "detalle": "Contra equipos pesados (BUC, Fénix): la delantera choca y anota. Contra equipos rápidos (CRSC): el equipo abre el balón buscando la carrera." },
                { "titulo": "Defensa de Línea de Ventaja vs Defensa del Espacio", "detalle": "El equipo es muy bueno defendiendo el primer choque, pero sufre en la segunda/tercera fase cuando el rival mueve el balón a las esquinas." }
            ]
        },
        "recomendaciones_entrenamiento": [
            { "foco": "Salida de campo propio (Exit Strategies)", "accion": "Practicar pateos de despeje altos y organizados (box kicks) para jugar en campo contrario al inicio." },
            { "foco": "Defensa de fases rápidas", "accion": "Ejercicios de 'Touch down and up' para acelerar la velocidad a la que la línea se pone de pie y ocupa el ancho del campo." },
            { "foco": "Potenciar el maul ofensivo", "accion": "Invertir tiempo en perfeccionar el 'maul' tras touch a 5 metros para garantizar ensayos contra equipos de media tabla." }
        ],
        "partidos": [
            { "jornada": 1, "fecha": "04/10/2025", "local": "RC L'HOSPITALET", "visitante": "FÉNIX", "pts_local": 10, "pts_visitante": 33 },
            { "jornada": 2, "fecha": "11/10/2025", "local": "BUC", "visitante": "RC L'HOSPITALET", "pts_local": 48, "pts_visitante": 8 },
            { "jornada": 4, "fecha": "08/11/2025", "local": "RC L'HOSPITALET", "visitante": "UES", "pts_local": 0, "pts_visitante": 115 },
            { "jornada": 5, "fecha": "15/11/2025", "local": "CR SANT CUGAT", "visitante": "RC L'HOSPITALET", "pts_local": 110, "pts_visitante": 10 },
            { "jornada": 6, "fecha": "29/11/2025", "local": "RC L'HOSPITALET", "visitante": "CRUC", "pts_local": 30, "pts_visitante": 24 },
            { "jornada": 7, "fecha": "13/12/2025", "local": "RC SITGES", "visitante": "RC L'HOSPITALET", "pts_local": 85, "pts_visitante": 10 },
            { "jornada": 8, "fecha": "17/01/2026", "local": "FÉNIX", "visitante": "RC L'HOSPITALET", "pts_local": 28, "pts_visitante": 14 },
            { "jornada": 9, "fecha": "24/01/2026", "local": "RC L'HOSPITALET", "visitante": "BUC", "pts_local": 29, "pts_visitante": 18 },
            { "jornada": 11, "fecha": "14/02/2026", "local": "UES", "visitante": "RC L'HOSPITALET", "pts_local": 53, "pts_visitante": 5 },
            { "jornada": 12, "fecha": "21/02/2026", "local": "RC L'HOSPITALET", "visitante": "CR SANT CUGAT", "pts_local": 31, "pts_visitante": 54 }
        ],
        "anotaciones_hospitalet": [
            { "jornada": 1, "minuto": 4, "dorsal": 1, "tipo": "A", "puntos": 5, "jugador": "Gil Bebebino, Maximo Luciano" },
            { "jornada": 1, "minuto": 29, "dorsal": 11, "tipo": "A", "puntos": 5, "jugador": "Navarro Minguez, Alex" },
            { "jornada": 2, "minuto": 23, "dorsal": 12, "tipo": "CC", "puntos": 3, "jugador": "Buges Sanchez, Erik" },
            { "jornada": 2, "minuto": 49, "dorsal": 8, "tipo": "A", "puntos": 5, "jugador": "Caro Caballero, Victor" },
            { "jornada": 5, "minuto": 3, "dorsal": 12, "tipo": "CC", "puntos": 3, "jugador": "Buges Sanchez, Erik" },
            { "jornada": 5, "minuto": 44, "dorsal": 13, "tipo": "A", "puntos": 5, "jugador": "Díaz Pauta, Pau" },
            { "jornada": 5, "minuto": 44, "dorsal": 12, "tipo": "T", "puntos": 2, "jugador": "Buges Sanchez, Erik" },
            { "jornada": 6, "minuto": 5, "dorsal": 12, "tipo": "CC", "puntos": 3, "jugador": "Buges Sanchez, Erik" },
            { "jornada": 6, "minuto": 20, "dorsal": 15, "tipo": "A", "puntos": 5, "jugador": "Jiménez González, Lucas" },
            { "jornada": 6, "minuto": 20, "dorsal": 12, "tipo": "T", "puntos": 2, "jugador": "Buges Sanchez, Erik" },
            { "jornada": 6, "minuto": 37, "dorsal": 13, "tipo": "A", "puntos": 5, "jugador": "Díaz Pauta, Pau" },
            { "jornada": 6, "minuto": 37, "dorsal": 10, "tipo": "T", "puntos": 2, "jugador": "Garreta Abad, Jon" },
            { "jornada": 6, "minuto": 41, "dorsal": 5, "tipo": "A", "puntos": 5, "jugador": "Villen Hernandez, Iu" },
            { "jornada": 6, "minuto": 54, "dorsal": 14, "tipo": "A", "puntos": 5, "jugador": "Vallespin Viera, Oriol" },
            { "jornada": 6, "minuto": 66, "dorsal": 12, "tipo": "CC", "puntos": 3, "jugador": "Buges Sanchez, Erik" },
            { "jornada": 7, "minuto": 15, "dorsal": 14, "tipo": "A", "puntos": 5, "jugador": "Lozano Nieto, Ohian" },
            { "jornada": 7, "minuto": 62, "dorsal": 8, "tipo": "A", "puntos": 5, "jugador": "Caro Caballero, Victor" },
            { "jornada": 8, "minuto": 38, "dorsal": 14, "tipo": "A", "puntos": 5, "jugador": "Jiménez González, Lucas" },
            { "jornada": 8, "minuto": 39, "dorsal": 13, "tipo": "T", "puntos": 2, "jugador": "Díaz Pauta, Pau" },
            { "jornada": 8, "minuto": 68, "dorsal": 1, "tipo": "A", "puntos": 5, "jugador": "Torres Puebla, Eduard" },
            { "jornada": 8, "minuto": 69, "dorsal": 13, "tipo": "T", "puntos": 2, "jugador": "Díaz Pauta, Pau" },
            { "jornada": 9, "minuto": 12, "dorsal": 8, "tipo": "A", "puntos": 5, "jugador": "Caro Caballero, Victor" },
            { "jornada": 9, "minuto": 25, "dorsal": 14, "tipo": "A", "puntos": 5, "jugador": "Vallespin Viera, Oriol" },
            { "jornada": 9, "minuto": 48, "dorsal": 3, "tipo": "A", "puntos": 5, "jugador": "Epoumbi, Prescott Lacroix" },
            { "jornada": 9, "minuto": 49, "dorsal": 13, "tipo": "T", "puntos": 2, "jugador": "Díaz Pauta, Pau" },
            { "jornada": 9, "minuto": 55, "dorsal": 8, "tipo": "A", "puntos": 5, "jugador": "Caro Caballero, Victor" },
            { "jornada": 9, "minuto": 70, "dorsal": 3, "tipo": "A", "puntos": 5, "jugador": "Epoumbi, Prescott Lacroix" },
            { "jornada": 9, "minuto": 70, "dorsal": 13, "tipo": "T", "puntos": 2, "jugador": "Díaz Pauta, Pau" },
            { "jornada": 11, "minuto": 12, "dorsal": 3, "tipo": "A", "puntos": 5, "jugador": "Epoumbi, Prescott Lacroix" },
            { "jornada": 12, "minuto": 12, "dorsal": 15, "tipo": "A", "puntos": 5, "jugador": "Navarro Minguez, Alex" },
            { "jornada": 12, "minuto": 27, "dorsal": 14, "tipo": "A", "puntos": 5, "jugador": "Vallespin Viera, Oriol" },
            { "jornada": 12, "minuto": 28, "dorsal": 12, "tipo": "T", "puntos": 2, "jugador": "Buges Sanchez, Erik" },
            { "jornada": 12, "minuto": 30, "dorsal": 13, "tipo": "A", "puntos": 5, "jugador": "Díaz Pauta, Pau" },
            { "jornada": 12, "minuto": 30, "dorsal": 13, "tipo": "T", "puntos": 2, "jugador": "Díaz Pauta, Pau" },
            { "jornada": 12, "minuto": 35, "dorsal": 14, "tipo": "A", "puntos": 5, "jugador": "Vallespin Viera, Oriol" },
            { "jornada": 12, "minuto": 35, "dorsal": 13, "tipo": "T", "puntos": 2, "jugador": "Díaz Pauta, Pau" },
            { "jornada": 12, "minuto": 69, "dorsal": 22, "tipo": "A", "puntos": 5, "jugador": "Lozano Nieto, Julen" }
        ],
        "disciplina": [
            { "jornada": 1, "minuto": 60, "dorsal": 6, "jugador": "Buges Sanchez, Erik", "codigo": "D", "motivo": "Joc perillós", "tipo": "Temporal" },
            { "jornada": 5, "minuto": 23, "dorsal": 13, "jugador": "Díaz Pauta, Pau", "codigo": "B", "motivo": "Falta reiterada d'equip", "tipo": "Temporal" },
            { "jornada": 6, "minuto": 44, "dorsal": 7, "jugador": "Bodokia Tsartsidze, Daniel", "codigo": "E", "motivo": "Altres motius", "tipo": "Definitiva" },
            { "jornada": 8, "minuto": 64, "dorsal": 3, "jugador": "Epoumbi, Prescott Lacroix", "codigo": "D", "motivo": "Joc perillós", "tipo": "Temporal" }
        ]
    }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildScorers(anotaciones) {
    const map = {};
    (anotaciones || []).forEach(a => {
        if (!map[a.jugador]) map[a.jugador] = { nombre: a.jugador, ensayos: 0, total_puntos: 0, jornadas: new Set() };
        if (a.tipo === 'A') map[a.jugador].ensayos += 1;
        map[a.jugador].total_puntos += a.puntos;
        map[a.jugador].jornadas.add(a.jornada);
    });
    return Object.values(map)
        .map(s => ({ ...s, partidos: s.jornadas.size }))
        .sort((a, b) => b.total_puntos - a.total_puntos);
}

const card = (title, children, accentColor = 'var(--color-primary-blue)') => (
    <div style={{ background: 'white', border: `1px solid #e2e8f0`, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '0.75rem 1rem', background: `linear-gradient(90deg, ${accentColor}, ${accentColor}cc)`, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {title}
        </div>
        <div style={{ padding: '1rem' }}>{children}</div>
    </div>
);

const Section = ({ label, children, defaultOpen = false }) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
            <button onClick={() => setOpen(v => !v)} style={{ width: '100%', padding: '0.75rem 1rem', background: '#f8fafc', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 700, color: 'var(--color-primary-blue)', fontSize: '0.9rem' }}>
                <span>{label}</span>
                {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {open && <div style={{ padding: '1rem', borderTop: '1px solid #f1f5f9' }}>{children}</div>}
        </div>
    );
};

// ─── Main Component ────────────────────────────────────────────────────────────
export const SeasonStatsPanel = ({ isStaff = true }) => {
    const [data, setData] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [jsonText, setJsonText] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            setData(stored ? JSON.parse(stored) : DEFAULT_JSON);
            if (!stored) localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_JSON));
        } catch {
            setData(DEFAULT_JSON);
        }
    }, []);

    const handleSave = () => {
        setError('');
        try {
            const parsed = JSON.parse(jsonText);
            const root = parsed[Object.keys(parsed)[0]];
            if (!root?.kpis_temporada) throw new Error('El JSON debe tener la clave kpis_temporada.');
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
            setData(parsed);
            setSuccess(true);
            setTimeout(() => { setSuccess(false); setShowModal(false); }, 1200);
        } catch (e) {
            setError(e.message || 'JSON inválido');
        }
    };

    if (!data) return <div style={{ padding: '2rem', color: '#64748b' }}>Cargando…</div>;

    const root = data[Object.keys(data)[0]];
    const kpis = root?.kpis_temporada || {};
    const info = root?.equipo_info || {};
    const partidos = root?.partidos || [];
    const anotaciones = root?.anotaciones_hospitalet || [];
    const disciplina = root?.disciplina || [];
    const scorers = buildScorers(anotaciones);
    const lv = root?.analisis_local_vs_visitante || {};
    const vuelta = root?.efecto_adaptacion_primera_vs_segunda_vuelta || [];
    const insights = root?.insights_all_blacks_tactica || {};
    const posicional = root?.analisis_posicional_forwards_vs_backs || {};
    const recomendaciones = root?.recomendaciones_entrenamiento || [];
    const disciplinaStats = root?.estadisticas_individuales?.disciplina || {};

    const winRate = kpis.partidos_registrados > 0 ? Math.round((kpis.victorias / kpis.partidos_registrados) * 100) : 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* ── Header ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-primary-blue)', fontWeight: 800 }}>
                        S16 1ª Catalana · Temporada 2025-2026
                    </h2>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: '#64748b', fontStyle: 'italic' }}>{info.contexto_temporada}</p>
                </div>
                {isStaff && (
                    <button onClick={() => { setJsonText(JSON.stringify(data, null, 2)); setShowModal(true); setError(''); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '8px', border: '1.5px solid var(--color-primary-blue)', background: 'white', color: 'var(--color-primary-blue)', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}>
                        <Upload size={15} /> Actualizar JSON
                    </button>
                )}
            </div>

            {/* ── KPI Cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.6rem' }}>
                {[
                    { label: 'PJ', value: kpis.partidos_registrados, color: '#1d4ed8' },
                    { label: 'Victorias', value: kpis.victorias, color: '#15803d' },
                    { label: 'Derrotas', value: kpis.derrotas, color: '#dc2626' },
                    { label: '% Victoria', value: `${winRate}%`, color: winRate >= 50 ? '#15803d' : '#b45309' },
                    { label: 'PF', value: kpis.puntos_favor, color: '#0369a1' },
                    { label: 'PC', value: kpis.puntos_contra, color: '#9f1239' },
                    { label: 'Dif.', value: kpis.diferencia, color: kpis.diferencia >= 0 ? '#15803d' : '#dc2626' },
                    { label: 'Ensayos', value: kpis.total_ensayos_favor, color: '#7c3aed' },
                ].map(k => (
                    <div key={k.label} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.8rem 0.5rem', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                        <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>{k.label}</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: k.color, lineHeight: 1 }}>{k.value}</div>
                    </div>
                ))}
            </div>

            {/* ── Local vs Visitante ── */}
            {(lv.local || lv.visitante) && (
                <Section label="🏠 Local vs Visitante" defaultOpen={true}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        {[
                            { label: '🏠 LOCAL', d: lv.local, color: '#15803d', bg: '#f0fdf4' },
                            { label: '✈️ VISITANTE', d: lv.visitante, color: '#dc2626', bg: '#fef2f2' }
                        ].map(({ label, d, color, bg }) => d && (
                            <div key={label} style={{ background: bg, borderRadius: '10px', padding: '1rem', border: `1px solid ${color}33` }}>
                                <div style={{ fontWeight: 800, color, fontSize: '0.8rem', marginBottom: '0.5rem' }}>{label}</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem', marginBottom: '0.75rem' }}>
                                    {[['PJ', d.partidos], ['V', d.victorias], ['D', d.derrotas], ['PF', d.puntos_favor], ['PC', d.puntos_contra], ['Prom.', d.promedio_puntos_favor_partido]].map(([l, v]) => (
                                        <div key={l} style={{ textAlign: 'center', background: 'white', borderRadius: '6px', padding: '0.3rem' }}>
                                            <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700 }}>{l}</div>
                                            <div style={{ fontWeight: 800, color, fontSize: '1rem' }}>{v}</div>
                                        </div>
                                    ))}
                                </div>
                                <p style={{ margin: 0, fontSize: '0.78rem', color: '#475569', fontStyle: 'italic' }}>{d.nota}</p>
                            </div>
                        ))}
                    </div>
                </Section>
            )}

            {/* ── Primera vs Segunda Vuelta ── */}
            {vuelta.length > 0 && (
                <Section label="📈 Evolución Ida vs Vuelta" defaultOpen={true}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {vuelta.map((v, i) => (
                            <div key={i} style={{ background: '#f8fafc', borderRadius: '10px', padding: '0.85rem 1rem', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <div style={{ fontWeight: 800, color: 'var(--color-primary-blue)', fontSize: '0.95rem' }}>vs {v.rival}</div>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '0.75rem', background: v.ida.estado === 'Victoria' ? '#dcfce7' : '#fee2e2', color: v.ida.estado === 'Victoria' ? '#15803d' : '#991b1b', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>{v.ida.condicion}: {v.ida.resultado} ({v.ida.estado})</span>
                                        <span style={{ color: '#94a3b8', fontWeight: 700 }}>→</span>
                                        <span style={{ fontSize: '0.75rem', background: v.vuelta.estado === 'Victoria' ? '#dcfce7' : '#fee2e2', color: v.vuelta.estado === 'Victoria' ? '#15803d' : '#991b1b', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>{v.vuelta.condicion}: {v.vuelta.resultado} ({v.vuelta.estado})</span>
                                        <span style={{ fontWeight: 900, color: '#15803d', fontSize: '0.9rem' }}>{v.mejora_diferencial}</span>
                                    </div>
                                </div>
                                <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569' }}>{v.analisis}</p>
                            </div>
                        ))}
                    </div>
                </Section>
            )}

            {/* ── Top Scorers ── */}
            <Section label="🏆 Máximos Anotadores" defaultOpen={true}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            {['#', 'Jugador', 'PJ', 'Ens', 'Pts'].map(h => (
                                <th key={h} style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', textAlign: h === 'Jugador' ? 'left' : 'center' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {scorers.slice(0, 8).map((s, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', color: '#94a3b8', fontWeight: 700 }}>{i + 1}</td>
                                <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600, color: '#1e293b' }}>{s.nombre}</td>
                                <td style={{ padding: '0.5rem', textAlign: 'center', color: '#64748b' }}>{s.partidos}</td>
                                <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 700, color: '#15803d' }}>{s.ensayos}</td>
                                <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                                    <span style={{ background: '#fef3c7', color: '#92400e', fontWeight: 800, padding: '2px 10px', borderRadius: '20px' }}>{s.total_puntos}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Section>

            {/* ── Análisis Posicional ── */}
            {posicional?.ataque_hospitalet_ensayos_a_favor && (
                <Section label="⚔️ Análisis Posicional: Delanteros vs Tres Cuartos">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                        {[
                            { label: 'DELANTEROS (1-8)', d: posicional.ataque_hospitalet_ensayos_a_favor.delanteros_forwards_1_al_8, color: '#1d4ed8', bg: '#dbeafe' },
                            { label: 'TRES CUARTOS (9-15)', d: posicional.ataque_hospitalet_ensayos_a_favor.tres_cuartos_backs_9_al_15, color: '#7c3aed', bg: '#ede9fe' }
                        ].map(({ label, d, color, bg }) => d && (
                            <div key={label} style={{ background: bg, borderRadius: '10px', padding: '0.85rem', border: `1px solid ${color}33` }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 800, color, marginBottom: '0.3rem' }}>{label}</div>
                                <div style={{ fontSize: '2rem', fontWeight: 900, color, lineHeight: 1 }}>{d.ensayos} <span style={{ fontSize: '1rem', color: '#64748b' }}>({d.porcentaje})</span></div>
                                <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: '#475569' }}>{d.analisis}</p>
                            </div>
                        ))}
                    </div>
                    {posicional.defensa_hospitalet_ensayos_en_contra?.perfiles_de_rivales?.map((p, i) => (
                        <div key={i} style={{ background: '#fff7ed', borderRadius: '8px', padding: '0.85rem', border: '1px solid #fed7aa', marginBottom: '0.5rem' }}>
                            <div style={{ fontWeight: 800, color: '#c2410c', fontSize: '0.85rem', marginBottom: '0.4rem' }}>{p.tipo_de_rival}</div>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#78350f' }}><strong>Cómo nos anotan:</strong> {p.como_nos_anotan}</p>
                            <p style={{ margin: '0.3rem 0 0', fontSize: '0.78rem', color: '#92400e' }}>{p.datos_clave}</p>
                            {p.evolucion_hospitalet && <p style={{ margin: '0.3rem 0 0', fontSize: '0.78rem', color: '#15803d', fontWeight: 600 }}>✅ {p.evolucion_hospitalet}</p>}
                            {p.vulnerabilidad_detectada && <p style={{ margin: '0.3rem 0 0', fontSize: '0.78rem', color: '#dc2626' }}>⚠️ {p.vulnerabilidad_detectada}</p>}
                        </div>
                    ))}
                    {posicional.insights_tacticos_inteligencia_deportiva?.map((ins, i) => (
                        <div key={i} style={{ background: '#f0fdf4', borderRadius: '8px', padding: '0.75rem', border: '1px solid #bbf7d0', marginTop: '0.5rem' }}>
                            <div style={{ fontWeight: 800, color: '#15803d', fontSize: '0.85rem', marginBottom: '0.25rem' }}>💡 {ins.titulo}</div>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#166534' }}>{ins.detalle}</p>
                        </div>
                    ))}
                </Section>
            )}

            {/* ── Insights Tácticos All Blacks ── */}
            {insights?.reloj_de_anotacion_propia && (
                <Section label="🕐 Reloj de Anotación + Insights Tácticos">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        {[
                            { label: '0–20 min', value: insights.reloj_de_anotacion_propia.minutos_0_a_20 },
                            { label: '21–40 min', value: insights.reloj_de_anotacion_propia.minutos_21_a_40 },
                            { label: '41–60 min', value: insights.reloj_de_anotacion_propia.minutos_41_a_60 },
                            { label: '61–70 min', value: insights.reloj_de_anotacion_propia.minutos_61_a_70 },
                        ].map(({ label, value }) => (
                            <div key={label} style={{ textAlign: 'center', background: '#f8fafc', borderRadius: '8px', padding: '0.6rem', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700 }}>{label}</div>
                                <div style={{ fontWeight: 800, color: 'var(--color-primary-blue)', fontSize: '0.95rem' }}>{value}</div>
                            </div>
                        ))}
                    </div>
                    <p style={{ margin: '0 0 0.75rem', fontSize: '0.82rem', color: '#475569', fontStyle: 'italic', background: '#f0f9ff', padding: '0.6rem', borderRadius: '6px' }}>
                        {insights.reloj_de_anotacion_propia.conclusion}
                    </p>
                    {insights.indice_de_fatiga_defensiva && (
                        <div style={{ background: '#fff7ed', borderRadius: '8px', padding: '0.75rem', border: '1px solid #fed7aa' }}>
                            <div style={{ fontWeight: 700, color: '#c2410c', fontSize: '0.82rem', marginBottom: '0.3rem' }}>⚠️ Índice de Fatiga Defensiva</div>
                            <p style={{ margin: 0, fontSize: '0.78rem', color: '#78350f' }}>{insights.indice_de_fatiga_defensiva.diagnostico}</p>
                        </div>
                    )}
                    {insights.liderazgo_y_capitania && (
                        <div style={{ background: '#f0fdf4', borderRadius: '8px', padding: '0.75rem', border: '1px solid #bbf7d0', marginTop: '0.5rem' }}>
                            <div style={{ fontWeight: 700, color: '#15803d', fontSize: '0.82rem', marginBottom: '0.3rem' }}>🏆 Liderazgo</div>
                            <p style={{ margin: 0, fontSize: '0.78rem', color: '#166534' }}><strong>Capitán:</strong> {insights.liderazgo_y_capitania.capitan_principal}</p>
                        </div>
                    )}
                </Section>
            )}

            {/* ── Recomendaciones ── */}
            {recomendaciones.length > 0 && (
                <Section label="📋 Recomendaciones de Entrenamiento">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {recomendaciones.map((r, i) => (
                            <div key={i} style={{ background: '#f8fafc', borderRadius: '8px', padding: '0.85rem', borderLeft: '4px solid var(--color-primary-orange)' }}>
                                <div style={{ fontWeight: 800, color: 'var(--color-primary-blue)', fontSize: '0.85rem', marginBottom: '0.3rem' }}>{r.foco}</div>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569' }}>{r.accion}</p>
                            </div>
                        ))}
                    </div>
                </Section>
            )}

            {/* ── Match Results (collapsible) ── */}
            <Section label="📅 Resultados de Temporada">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            {['J', 'Fecha', 'Local', 'Marcador', 'Visitante'].map(h => (
                                <th key={h} style={{ padding: '0.5rem', color: '#64748b', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase', textAlign: h === 'Local' ? 'right' : h === 'Visitante' ? 'left' : 'center' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {partidos.map((p, i) => {
                            const hospiLocal = p.local.toUpperCase().includes('HOSPITALET');
                            const hospiPts = hospiLocal ? p.pts_local : p.pts_visitante;
                            const rivalPts = hospiLocal ? p.pts_visitante : p.pts_local;
                            const win = hospiPts > rivalPts;
                            return (
                                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: win ? 'rgba(21,128,61,0.04)' : 'rgba(220,38,38,0.04)' }}>
                                    <td style={{ padding: '0.45rem 0.5rem', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: '0.7rem' }}>J{p.jornada}</td>
                                    <td style={{ padding: '0.45rem 0.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.7rem' }}>{p.fecha}</td>
                                    <td style={{ padding: '0.45rem 0.5rem', textAlign: 'right', fontWeight: hospiLocal ? 800 : 500, color: hospiLocal ? 'var(--color-primary-orange)' : '#334155', fontSize: '0.82rem' }}>{p.local}</td>
                                    <td style={{ padding: '0.45rem 0.25rem', textAlign: 'center' }}>
                                        <span style={{ background: win ? '#dcfce7' : '#fee2e2', color: win ? '#15803d' : '#991b1b', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', fontSize: '0.85rem' }}>
                                            {p.pts_local} – {p.pts_visitante}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.45rem 0.5rem', fontWeight: !hospiLocal ? 800 : 500, color: !hospiLocal ? 'var(--color-primary-orange)' : '#334155', fontSize: '0.82rem' }}>{p.visitante}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </Section>

            {/* ── Discipline ── */}
            {disciplina.length > 0 && (
                <Section label="🟨 Sanciones Disciplinarias">
                    <div style={{ marginBottom: '0.75rem', display: 'flex', gap: '1rem' }}>
                        <span style={{ background: '#fef3c7', color: '#92400e', fontWeight: 700, padding: '3px 10px', borderRadius: '6px', fontSize: '0.8rem' }}>🟨 {disciplinaStats.total_tarjetas_amarillas || 3} Amarillas</span>
                        <span style={{ background: '#fee2e2', color: '#991b1b', fontWeight: 700, padding: '3px 10px', borderRadius: '6px', fontSize: '0.8rem' }}>🟥 {disciplinaStats.total_tarjetas_rojas || 1} Roja</span>
                        {disciplinaStats.analisis && <span style={{ color: '#64748b', fontSize: '0.78rem', fontStyle: 'italic', alignSelf: 'center' }}>{disciplinaStats.analisis}</span>}
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                        <thead><tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            {['J', 'Min', 'Jugador', 'Motivo', 'Tipo'].map(h => (
                                <th key={h} style={{ padding: '0.5rem', color: '#64748b', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase', textAlign: h === 'Jugador' || h === 'Motivo' ? 'left' : 'center' }}>{h}</th>
                            ))}
                        </tr></thead>
                        <tbody>
                            {disciplina.map((d, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '0.45rem 0.5rem', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: '0.7rem' }}>J{d.jornada}</td>
                                    <td style={{ padding: '0.45rem 0.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.7rem' }}>{d.minuto}'</td>
                                    <td style={{ padding: '0.45rem 0.5rem', fontWeight: 600, color: '#1e293b' }}>{d.jugador}</td>
                                    <td style={{ padding: '0.45rem 0.5rem', color: '#475569', fontSize: '0.78rem' }}>{d.motivo}</td>
                                    <td style={{ padding: '0.45rem 0.5rem', textAlign: 'center' }}>
                                        <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, background: d.tipo === 'Definitiva' ? '#fee2e2' : '#fef3c7', color: d.tipo === 'Definitiva' ? '#991b1b' : '#92400e' }}>{d.tipo}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Section>
            )}

            {/* ── Update JSON Modal ── */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px rgba(0,0,0,0.4)' }}>
                        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h3 style={{ margin: 0, color: 'var(--color-primary-blue)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Upload size={18} /> Actualizar Datos de Temporada
                            </h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
                        </div>
                        <div style={{ padding: '0.6rem 1.5rem', background: '#f0f9ff', borderBottom: '1px solid #bae6fd', fontSize: '0.78rem', color: '#0369a1' }}>
                            Pega el JSON con la misma estructura. Los datos se guardan en este navegador (localStorage).
                        </div>
                        <div style={{ flex: 1, overflow: 'auto', padding: '1rem 1.5rem' }}>
                            <textarea value={jsonText} onChange={e => setJsonText(e.target.value)}
                                style={{ width: '100%', height: '380px', fontFamily: 'monospace', fontSize: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
                            {error && <div style={{ marginTop: '0.4rem', color: '#dc2626', fontSize: '0.82rem', fontWeight: 600 }}>⚠ {error}</div>}
                        </div>
                        <div style={{ padding: '0.85rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowModal(false)} style={{ padding: '0.55rem 1.1rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600, color: '#64748b' }}>Cancelar</button>
                            <button onClick={handleSave} style={{ padding: '0.55rem 1.2rem', borderRadius: '8px', border: 'none', background: success ? '#15803d' : 'var(--color-primary-blue)', color: 'white', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'background 0.2s' }}>
                                {success ? <><Check size={15} /> Guardado</> : <><Upload size={15} /> Guardar</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
