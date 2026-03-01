
import React, { useState, useEffect } from 'react';
import { X, User, Calendar, Award, Hash, Ruler, Edit2, Save, XCircle, Mail, Phone, CalendarDays, Camera, Loader2 } from 'lucide-react';
import attendanceService from '../services/attendanceService';
import playerService from '../services/playerService';
import { supabase } from '../lib/supabaseClient';
import './PlayerDetailsModal.css';

const PlayerDetailsModal = ({ player: initialPlayer, onClose, onPlayerUpdated }) => {
    const [activeTab, setActiveTab] = useState('details');
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Local state for the player data to ensure instant refresh
    const [player, setPlayer] = useState(initialPlayer);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = React.useRef(null);

    useEffect(() => {
        if (activeTab === 'attendance' && player) {
            fetchHistory();
        }
    }, [activeTab, player]);

    // Keep local state in sync with props if parent changes it
    useEffect(() => {
        if (initialPlayer) {
            setPlayer(initialPlayer);
            setFormData({
                nombre: initialPlayer.nombre,
                apellidos: initialPlayer.apellidos,
                posiciones: initialPlayer.posiciones,
                talla: initialPlayer.talla,
                licencia: initialPlayer.licencia,
                foto: initialPlayer.foto,
                email: initialPlayer.email,
                Telefono: initialPlayer.Telefono,
                fecha_nacimiento: initialPlayer.fecha_nacimiento
            });
        }
    }, [initialPlayer]);

    const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
            const data = await attendanceService.getByPlayerId(player.id);
            setHistory(data || []);
        } catch (error) {
            console.error("Error fetching player attendance:", error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const updatedData = await playerService.update(player.id, formData);

            // Update local state immediately
            setPlayer(updatedData);
            setIsEditing(false);

            if (onPlayerUpdated) {
                onPlayerUpdated(); // Refresh parent list
            }
        } catch (error) {
            console.error("Error updating player:", error);
            alert("Error al guardar los cambios");
        } finally {
            setSaving(false);
        }
    };

    const handlePhotoClick = () => {
        if (isEditing && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handlePhotoChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            alert('Por favor, selecciona una imagen válida.');
            return;
        }

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${player.id}-${Date.now()}.${fileExt}`;
            const filePath = fileName;

            const { data, error } = await supabase.storage
                .from('Imagenes Jugadores')
                .upload(filePath, file);

            if (error) throw error;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('Imagenes Jugadores')
                .getPublicUrl(filePath);

            setFormData(prev => ({
                ...prev,
                foto: publicUrl
            }));

            // Update local view immediately for better UX
            setPlayer(prev => ({
                ...prev,
                foto: publicUrl
            }));

        } catch (error) {
            console.error('Error uploading photo:', error);
            alert('Error al subir la foto');
        } finally {
            setUploading(false);
        }
    };

    if (!player) return null;

    const formatDate = (dateString) => {
        if (!dateString) return 'Fecha desconocida';
        return new Date(dateString).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const getBadgeClass = (status) => {
        if (!status) return 'badge-unknown';
        const lower = status.toLowerCase();
        const normalized = lower.replace(/\s+/g, '-');

        const types = ['presente', 'retraso', 'falta-justificada', 'lesion', 'emfermo', 'catalana', 'falta', 'ausente'];

        if (types.includes(normalized)) {
            return `badge-${normalized}`;
        }
        return 'badge-unknown';
    };

    return (
        <div className="player-details-overlay" onClick={onClose}>
            <div className="player-details-content" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="player-details-header">
                    <div className="player-header-info">
                        <div
                            className={`player-header-photo-container ${isEditing ? 'editable' : ''}`}
                            onClick={handlePhotoClick}
                        >
                            {player.foto ? (
                                <img src={player.foto} alt={player.nombre} className="player-header-photo" />
                            ) : (
                                <div className="player-header-photo placeholder">
                                    <User size={40} color="#64748b" />
                                </div>
                            )}

                            {isEditing && (
                                <div className="photo-edit-overlay">
                                    {uploading ? <Loader2 size={24} className="animate-spin" /> : <Camera size={24} />}
                                </div>
                            )}

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handlePhotoChange}
                                accept="image/*"
                                style={{ display: 'none' }}
                            />
                        </div>
                        <div className="player-header-text">
                            {isEditing ? (
                                <div className="edit-header-inputs">
                                    <input
                                        name="nombre"
                                        value={formData.nombre || ''}
                                        onChange={handleInputChange}
                                        placeholder="Nombre"
                                        className="edit-input header-input"
                                    />
                                    <input
                                        name="apellidos"
                                        value={formData.apellidos || ''}
                                        onChange={handleInputChange}
                                        placeholder="Apellidos"
                                        className="edit-input header-input"
                                    />
                                </div>
                            ) : (
                                <>
                                    <h2>{player.nombre} {player.apellidos}</h2>
                                    <p>{player.posiciones ? player.posiciones.replace(/\r\n/g, ', ') : 'Sin posición'}</p>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="header-actions">
                        {!isEditing ? (
                            <button className="icon-button edit-button" onClick={() => setIsEditing(true)} title="Editar">
                                <Edit2 size={20} />
                            </button>
                        ) : (
                            <div className="edit-actions">
                                <button className="icon-button save-button" onClick={handleSave} disabled={saving} title="Guardar">
                                    <Save size={20} />
                                </button>
                                <button className="icon-button cancel-button" onClick={() => setIsEditing(false)} disabled={saving} title="Cancelar">
                                    <XCircle size={20} />
                                </button>
                            </div>
                        )}
                        <button className="close-button" onClick={onClose}>
                            <X size={24} />
                        </button>
                    </div>
                </div>


                {/* Tabs */}
                <div className="player-tabs">
                    <button
                        className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
                        onClick={() => setActiveTab('details')}
                    >
                        Detalles
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'attendance' ? 'active' : ''}`}
                        onClick={() => setActiveTab('attendance')}
                    >
                        Historial de Asistencia
                    </button>
                </div>

                {/* Body */}
                <div className="player-details-body">
                    {activeTab === 'details' && (
                        <div className="details-grid">
                            <div className="detail-group full-width">
                                <label>Posiciones</label>
                                {isEditing ? (
                                    <textarea
                                        name="posiciones"
                                        value={formData.posiciones || ''}
                                        onChange={handleInputChange}
                                        className="edit-input"
                                        rows={2}
                                    />
                                ) : (
                                    <p>{player.posiciones || '-'}</p>
                                )}
                            </div>

                            <div className="detail-group">
                                <label><CalendarDays size={14} style={{ marginRight: '4px', verticalAlign: 'text-bottom' }} /> Fecha Nacimiento</label>
                                {isEditing ? (
                                    <input
                                        type="date"
                                        name="fecha_nacimiento"
                                        value={formData.fecha_nacimiento || ''}
                                        onChange={handleInputChange}
                                        className="edit-input"
                                    />
                                ) : (
                                    <p>{player.fecha_nacimiento ? new Date(player.fecha_nacimiento).toLocaleDateString() : '-'}</p>
                                )}
                            </div>

                            <div className="detail-group">
                                <label><Hash size={14} style={{ marginRight: '4px', verticalAlign: 'text-bottom' }} /> Licencia</label>
                                {isEditing ? (
                                    <input
                                        name="licencia"
                                        value={formData.licencia || ''}
                                        onChange={handleInputChange}
                                        className="edit-input"
                                    />
                                ) : (
                                    <p>{player.licencia || '-'}</p>
                                )}
                            </div>

                            <div className="detail-group">
                                <label><Ruler size={14} style={{ marginRight: '4px', verticalAlign: 'text-bottom' }} /> Talla</label>
                                {isEditing ? (
                                    <input
                                        name="talla"
                                        value={formData.talla || ''}
                                        onChange={handleInputChange}
                                        className="edit-input"
                                    />
                                ) : (
                                    <p>{player.talla || '-'}</p>
                                )}
                            </div>

                            <div className="detail-group">
                                <label><Phone size={14} style={{ marginRight: '4px', verticalAlign: 'text-bottom' }} /> Móvil</label>
                                {isEditing ? (
                                    <input
                                        name="Telefono"
                                        value={formData.Telefono || ''}
                                        onChange={handleInputChange}
                                        className="edit-input"
                                    />
                                ) : (
                                    <p>{player.Telefono || '-'}</p>
                                )}
                            </div>

                            <div className="detail-group full-width">
                                <label><Mail size={14} style={{ marginRight: '4px', verticalAlign: 'text-bottom' }} /> Email</label>
                                {isEditing ? (
                                    <input
                                        name="email"
                                        type="email"
                                        value={formData.email || ''}
                                        onChange={handleInputChange}
                                        className="edit-input"
                                    />
                                ) : (
                                    <p>{player.email || '-'}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'attendance' && (
                        <div>
                            {loadingHistory ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Cargando historial...</div>
                            ) : history.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No se encontraron registros de asistencia.</div>
                            ) : (
                                <div className="attendance-history-list">
                                    {history.map((record) => (
                                        <div key={record.id} className="history-item">
                                            <div className="history-date">
                                                <span className="history-date-main">{formatDate(record.date)}</span>
                                                <span className="history-type">{record.type}</span>
                                            </div>
                                            <span className={`history-badge ${getBadgeClass(record.asistencia)}`}>
                                                {record.asistencia}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PlayerDetailsModal;
